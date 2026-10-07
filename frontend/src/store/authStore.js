import { useMemo, useState } from "react";
import { useOpportunities } from "../context/OpportunitiesContext";
import { getMyStudentProfile } from "../services/studentProfileAPI";

export const getAuthRedirectPath = (role) => {
  if (role === "super_admin") {
    return "/super-admin-dashboard";
  }

  if (role === "admin") {
    return "/admin-dashboard";
  }

  if (role === "mentor") {
    return "/mentor-dashboard";
  }

  return "/";
};

// Students (role "user") don't have a single static landing path — where they
// land depends on how far they've gotten through the profile setup wizard.
export const resolveStudentRedirectPath = async () => {
  try {
    const { status, currentStep } = await getMyStudentProfile();
    if (status === "COMPLETE") {
      return "/";
    }
    return "/"
    // return `/student/profile/setup?step=${(currentStep || "PERSONAL").toLowerCase()}`;
  } catch {
    return "/student/profile/setup";
  }
};

export const resolveAuthRedirectPath = async (role) => {
  if (role === "user") {
    return resolveStudentRedirectPath();
  }
  return getAuthRedirectPath(role);
};

const useAuthStore = () => {
  const {
    user,
    signup: createAccount,
    login: signIn,
    logout,
    isBootstrapping,
  } = useOpportunities();
  const [isLoadingState, setIsLoadingState] = useState(false);

  const signup = async ({ fullName, email, password, whatsappNumber }) => {
    setIsLoadingState(true);

    try {
      const result = await createAccount({
        fullName,
        email,
        password,
        whatsappNumber,
      });

      return {
        success: true,
        message: "Account created successfully.",
        ...result,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error?.response?.data?.message || "Signup failed. Please try again.",
      };
    } finally {
      setIsLoadingState(false);
    }
  };

  const login = async ({ email, password }) => {
    setIsLoadingState(true);

    try {
      const result = await signIn({ email, password });

      return {
        success: true,
        message: "Signed in successfully.",
        ...result,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error?.response?.data?.message || "Login failed. Please try again.",
      };
    } finally {
      setIsLoadingState(false);
    }
  };

  const isLoading = isLoadingState || isBootstrapping;

  return useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      signup,
      login,
      logout,
    }),
    [user, isLoading, signup, login, logout],
  );
};

export default useAuthStore;

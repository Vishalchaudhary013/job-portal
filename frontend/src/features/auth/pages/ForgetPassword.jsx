import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useOpportunities } from "../../../context/OpportunitiesContext";

const ForgetPassword = () => {
  const { forgotPassword, resetPassword } = useOpportunities();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const requestReset = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("");

    if (!email) {
      setError("Email is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await forgotPassword({ email });
      setStatus(
        response?.message ||
          "If this email exists, a reset code has been sent to your inbox.",
      );
      setStep(2);
    } catch (apiError) {
      setError(
        apiError?.response?.data?.message ||
          "Unable to send reset code right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitNewPassword = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("");

    if (!email || !code || !newPassword || !confirmPassword) {
      setError("Please complete all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await resetPassword({
        email,
        code,
        newPassword,
      });
      setStatus(response?.message || "Password changed successfully.");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (apiError) {
      setError(
        apiError?.response?.data?.message ||
          "Unable to reset password. Please verify code and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#EEF2FF] ">
      <div className="bg-[#EEF2FF]">
        <div className="w-full max-w-[1250px] px-4 md:px-6 mx-auto px-4 sm:px-6 py-5">
          <header>
            <Link to="/" className="text-3xl font-medium">
              edeco
            </Link>
          </header>
        </div>
      </div>

      <div className="w-full max-w-[1250px] px-4 md:px-6 mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-center min-h-[calc(100dvh-88px)] py-8 sm:py-10">
          <form
            onSubmit={step === 1 ? requestReset : submitNewPassword}
            className="bg-white rounded-xl p-5 w-full max-w-[370px]"
          >
            <h2 className="text-center text-2xl font-medium mb-6">
              Reset your password
            </h2>

            <label className="mb-1.5 block text-gray-600 font-medium">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="outline-none rounded-lg px-3 border border-black/30 w-full py-2 mb-5"
              disabled={step === 2}
              required
            />

            {step === 2 ? (
              <>
                <label className="mb-1.5 block text-gray-600 font-medium">
                  Reset Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className="outline-none rounded-lg px-3 border border-black/30 w-full py-2 mb-4"
                  placeholder="Enter 6-digit code"
                  required
                />

                <label className="mb-1.5 block text-gray-600 font-medium">
                  New Password
                </label>
                <div className="relative mb-4">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="outline-none rounded-lg px-3 pr-10 border border-black/30 w-full py-2"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  >
                    {showNewPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>

                <label className="mb-1.5 block text-gray-600 font-medium">
                  Confirm New Password
                </label>
                <div className="relative mb-4">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="outline-none rounded-lg px-3 pr-10 border border-black/30 w-full py-2"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </>
            ) : null}

            {error ? <p className="text-sm text-red-600 mb-3">{error}</p> : null}
            {status ? <p className="text-sm text-green-700 mb-3">{status}</p> : null}

            <div className="flex justify-center rounded-lg bg-[#FF4E45] mb-4">
              <button disabled={isSubmitting} className="py-2 font-medium ">
                {isSubmitting
                  ? "Please wait..."
                  : step === 1
                    ? "Send Reset Code"
                    : "Change Password"}
              </button>
            </div>

            {step === 2 ? (
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setCode("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setError("");
                }}
                className="text-sm text-red-600 block mx-auto mb-4"
              >
                Resend code
              </button>
            ) : null}

            <p className="text-sm text-center">
              Remember your password?{" "}
              <Link to="/login" className="text-red-600">
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgetPassword;

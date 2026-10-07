import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../../../services/apiClient";
import { cmsAdmin, cmsError } from "../../../services/cmsAdminAPI";

// Session + navigation data for the Form Builder: who the admin is (resolved
// by the server from the existing Edeco session), what they may do, and the
// content types listed in the sidebar.

const StudioContext = createContext(null);

export const StudioProvider = ({ children }) => {
  const [me, setMe] = useState(null);
  const [error, setError] = useState(null);
  const [types, setTypes] = useState([]);

  const refreshTypes = useCallback(async () => {
    try {
      const result = await cmsAdmin.listTypes();
      setTypes(result.items || []);
    } catch {
      // the sidebar simply shows no types; pages surface their own errors
    }
  }, []);

  useEffect(() => {
    cmsAdmin
      .me()
      .then(({ user }) => {
        setMe(user);
        refreshTypes();
      })
      .catch((loadError) => {
        const parsed = cmsError(loadError, "Couldn't open the Form Builder.");
        // 404 on /me = the API server this frontend talks to doesn't have the
        // Form Builder routes (old deployment, or a backend not restarted).
        if (parsed.status === 404) {
          parsed.message = `The server at ${API_BASE_URL} doesn't have the Form Builder yet. Restart or redeploy the backend with the latest code.`;
        }
        setError(parsed);
      });
  }, [refreshTypes]);

  const value = useMemo(
    () => ({
      me,
      error,
      types,
      refreshTypes,
      isSuperAdmin: me?.role === "super_admin",
      can: (...permissions) => Boolean(me && permissions.some((permission) => me.permissions.includes(permission))),
    }),
    [me, error, types, refreshTypes],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
};

export const useStudio = () => useContext(StudioContext);

import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const EDECO_URL = (import.meta.env.VITE_EDECO_URL || "").replace(/\/$/, "");

// This portal only carries one section of Edeco. Copied components still link
// to the rest of the site (tools, profile, dashboards...), so any path that
// isn't routed here is forwarded to the main Edeco site instead of a dead 404.
const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    if (!EDECO_URL) return;
    window.location.replace(`${EDECO_URL}${location.pathname}${location.search}${location.hash}`);
  }, [location]);

  if (EDECO_URL) return null;

  return (
    <div className="min-h-screen bg-[#EEF2FF]">
      <div className="w-350 max-w-[95%] mx-auto py-16">
        <div className="bg-white border border-black/10 rounded-2xl p-8 md:p-12 text-center">
          <p className="text-slate-500 text-sm font-semibold tracking-widest mb-3">
            ERROR 404
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-slate-600 text-lg mb-8">
            The page you are trying to access does not exist or has been moved.
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

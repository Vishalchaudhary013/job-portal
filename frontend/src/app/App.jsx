import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import ApplyHandoffReviver from "../features/forms/components/ApplyHandoffReviver";

const App = () => {
  const location = useLocation();
  const hideLayout = ["/login", "/signup", "/forget-password", "/choose-signup"];
  // Dashboards render their own header + sidebar (same as Edeco).
  const isAdminRoute =
    location.pathname.startsWith("/admin-dashboard") ||
    location.pathname.startsWith("/super-admin-dashboard");
  const showNavBar = !hideLayout.includes(location.pathname) && !isAdminRoute;

  // Google Translate host + bootstrap (same as the main Edeco app) — kept here
  // so it stays mounted while NavBar swaps between its route-specific layouts.
  useEffect(() => {
    if (document.querySelector('script[src*="translate.google.com"]')) return;

    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,hi,pa,fr,es,de,zh,ja",
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          "google_translate_element",
        );
      }
    };

    const script = document.createElement("script");
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <>
      <div id="google_translate_element" className="hidden" aria-hidden="true" />
      {showNavBar && <NavBar />}
      <AppRoutes />
      <ApplyHandoffReviver />
      {showNavBar && <Footer />}
    </>
  );
};

export default App;

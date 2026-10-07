import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../styles/globals.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { OpportunitiesProvider } from "../context/OpportunitiesContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <OpportunitiesProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </OpportunitiesProvider>
  </StrictMode>,
);

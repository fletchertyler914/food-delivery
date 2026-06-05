import "@fontsource-variable/inter";
import CssBaseline from "@mui/material/CssBaseline";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AppProviders } from "./app/AppProviders";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <CssBaseline />
    <AppProviders />
  </StrictMode>
);

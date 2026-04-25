import React from "react";
import ReactDOM from "react-dom/client";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";

import { App } from "./app/App";
import { DebugConsoleApp } from "./debug/DebugConsoleApp";
import { installRendererDebugCapture } from "./debug/install-renderer-debug";
import { ControlPanelPreviewApp } from "./preview/ControlPanelPreviewApp";
import { ThemeContextProvider } from "./store/ThemeContext";
import { useThemeContext } from "./store/theme.hooks";
import "./app/styles.css";

function ThemedApp() {
  const { siteTheme } = useThemeContext();

  return (
    <ThemeProvider theme={siteTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}

function Root() {
  return (
    <ThemeContextProvider>
      <ThemedApp />
    </ThemeContextProvider>
  );
}

function isDebugRoute(): boolean {
  return (
    window.location.hash.startsWith("#/debug") ||
    window.location.pathname.endsWith("/debug")
  );
}

function isControlPreviewRoute(): boolean {
  const queryParams = new URLSearchParams(window.location.search);
  return (
    queryParams.get("preview") === "control-panel" ||
    window.location.hash.startsWith("#/preview/control-panel") ||
    window.location.pathname.endsWith("/preview/control-panel")
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

if (isDebugRoute()) {
  root.render(
    <React.StrictMode>
      <DebugConsoleApp />
    </React.StrictMode>,
  );
} else if (isControlPreviewRoute()) {
  root.render(
    <React.StrictMode>
      <ControlPanelPreviewApp />
    </React.StrictMode>,
  );
} else {
  root.render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>,
  );

  void installRendererDebugCapture();
}

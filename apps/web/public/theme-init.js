/* global document, localStorage, window */

// Bootstrap the color scheme before MUI's runtime styles inject, so a
// reload in dark mode doesn't flash the light background. Served as a
// same-origin file (not inline) so it satisfies the strict CSP
// `script-src 'self'` enforced by the web container's nginx.
(function () {
  try {
    var raw = localStorage.getItem("fd-ui-preferences");
    var parsed = raw ? JSON.parse(raw) : null;
    var mode = parsed && parsed.state ? parsed.state.mode : null;
    if (!mode) {
      mode = localStorage.getItem("fd-color-mode");
    }
    var resolved = mode;
    if (resolved === "system" || !resolved) {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    if (resolved === "light") {
      document.documentElement.setAttribute("data-light", "");
    } else if (resolved === "dark") {
      document.documentElement.setAttribute("data-dark", "");
    }
    // Tint the mobile browser chrome (iOS Safari/Brave toolbar + safe-area
    // insets) to the active scheme so there's no white bar above/below the
    // app. Hexes mirror index.html and theme.background.default.
    var bg = resolved === "dark" ? "#1a1310" : "#fbf7f0";
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", bg);
  } catch {
    /* ignore */
  }
})();

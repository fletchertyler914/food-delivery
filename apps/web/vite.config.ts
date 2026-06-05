/// <reference types="vitest/config" />

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Stable manual chunk groups keep the long-cached vendor bundles from
// being invalidated every time a feature ships. The router/MUI/data
// stack rarely changes, so splitting them out lets returning users hit
// the immutable /assets/ cache instead of redownloading core libs.
const VENDOR_GROUPS: Record<string, readonly string[]> = {
  "vendor-react": ["react", "react-dom", "scheduler"],
  "vendor-react-router": ["react-router", "react-router-dom", "@remix-run/router"],
  "vendor-mui": ["@mui/material", "@mui/system", "@mui/utils", "@emotion/react", "@emotion/styled"],
  "vendor-tanstack": ["@tanstack/react-query", "@tanstack/query-core"],
  "vendor-socket": ["socket.io-client", "engine.io-client", "engine.io-parser", "socket.io-parser"],
  "vendor-forms": ["zod", "react-hook-form", "@hookform/resolvers"]
};

function resolveVendorChunk(id: string): string | undefined {
  if (!id.includes("node_modules")) {
    return undefined;
  }
  for (const [chunk, packages] of Object.entries(VENDOR_GROUPS)) {
    if (packages.some((pkg) => id.includes(`/node_modules/${pkg}/`))) {
      return chunk;
    }
  }
  return undefined;
}

export default defineConfig({
  // tsconfigPaths resolves the workspace path mapping (e.g. the
  // `@food-delivery/api-client` alias from tsconfig.base.json) so the
  // bundle does not depend on Node's package resolution at build time.
  plugins: [react(), tsconfigPaths()],
  // Belt-and-braces: force a single copy of emotion/MUI/React through
  // Vite's resolver and dep-optimizer. Transitive peer-dep graphs
  // (e.g. Prisma studio-core → Radix UI) can otherwise install
  // duplicate packages and break the SPA before React mounts.
  resolve: {
    dedupe: [
      "@emotion/react",
      "@emotion/styled",
      "@mui/material",
      "@mui/system",
      "react",
      "react-dom"
    ]
  },
  optimizeDeps: {
    include: ["@emotion/react", "@emotion/styled", "@mui/material", "@mui/material/styles"]
  },
  build: {
    target: "es2022",
    // "hidden" sourcemaps ship the .map alongside the bundle but omit
    // the //# sourceMappingURL footer, so error monitoring (Sentry,
    // Datadog) can symbolicate while end-users cannot trivially read
    // the original source from devtools.
    sourcemap: "hidden",
    rollupOptions: {
      output: {
        manualChunks(id) {
          return resolveVendorChunk(id);
        }
      }
    }
  },
  server: {
    port: 5173,
    // Match the production nginx topology so the bundle can use
    // relative URLs everywhere. Anything matching these prefixes is
    // forwarded to the local API; everything else is served by Vite.
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: false
      },
      "/socket.io": {
        target: "http://localhost:3000",
        ws: true,
        changeOrigin: false
      },
      // Swagger UI + OpenAPI JSON, mirroring the production nginx
      // reverse-proxy so engineers can reach the API docs through the
      // same origin in dev as they would in the bundled compose.prod
      // stack. Not surfaced anywhere in the public SPA chrome.
      "/docs": {
        target: "http://localhost:3000",
        changeOrigin: false
      },
      "/docs-json": {
        target: "http://localhost:3000",
        changeOrigin: false
      }
    }
  },
  preview: {
    port: 4173
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // Pin the jsdom origin so the SPA's relative URLs ("/api/…")
    // parse correctly and MSW can match them.
    environmentOptions: {
      jsdom: {
        url: "http://localhost/"
      }
    },
    coverage: {
      provider: "v8",
      thresholds: {
        statements: 78,
        branches: 65,
        functions: 76,
        lines: 77
      }
    }
  }
});

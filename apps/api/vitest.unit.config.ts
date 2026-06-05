import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
    exclude: ["src/**/*.integration.spec.ts", "test/**/*.e2e-spec.ts"],
    reporters: ["default", ["junit", { outputFile: "junit.xml" }]],
    coverage: {
      provider: "v8",
      include: [
        "src/modules/**/domain/**/*.ts",
        "src/common/filters/**/*.ts",
        "src/common/guards/**/*.ts",
        "src/common/util/**/*.ts",
        "src/common/pagination/**/*.ts",
        "src/modules/users/users.service.ts",
        "src/modules/auth/auth.service.ts",
        "src/modules/health/**/*.ts"
      ],
      exclude: ["src/**/*.spec.ts", "src/openapi/**", "src/modules/health/health.module.ts"],
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85
      }
    }
  }
});

import js from "@eslint/js";
import prettier from "eslint-config-prettier/flat";
import importPlugin from "eslint-plugin-import";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "node_modules",
      "**/dist",
      "coverage",
      "packages/api-client/src/generated",
      "apps/api/prisma/migrations"
    ]
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [js.configs.recommended]
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true
        }
      ]
    }
  },
  {
    files: ["apps/api/src/**/*.module.ts"],
    rules: {
      "@typescript-eslint/no-extraneous-class": "off"
    }
  },
  {
    // @mui/icons-material default exports turn into module objects in
    // lazy route chunks under Rollup's CJS interop, which crashes the
    // app with React error #130. Force every icon through the wrapper
    // module so this never bites us in production again.
    files: ["apps/web/src/**/*.{ts,tsx}"],
    ignores: ["apps/web/src/lib/icons.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@mui/icons-material", "@mui/icons-material/*"],
              message:
                "Import icons from '../lib/icons' instead. @mui/icons-material default exports break in lazy route chunks (React error #130)."
            }
          ]
        }
      ]
    }
  },
  {
    // Web app: lint hook usage and forbid import cycles. Cycles in
    // browser bundles cause `undefined` exports at module init time
    // depending on which side of the cycle Rollup hoists first;
    // catching them at lint time avoids painful production-only bugs.
    files: ["apps/web/src/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      import: importPlugin
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: ["apps/web/tsconfig.json", "tsconfig.base.json"]
        },
        node: true
      }
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "import/no-cycle": ["error", { maxDepth: 10, ignoreExternal: true }]
    }
  },
  {
    // React Router data loaders signal redirects and HTTP errors via
    // `throw redirect(...)` / `throw new Response(...)`. That is the
    // documented contract; the rule's default rejection of non-Error
    // throws would force us to wrap loaders in workarounds that hurt
    // readability for no behavioural gain.
    files: ["apps/web/src/app/router.tsx"],
    rules: {
      "@typescript-eslint/only-throw-error": "off"
    }
  },
  {
    files: [
      "apps/api/prisma/**/*.ts",
      "apps/api/src/prisma/**/*.ts",
      "apps/api/src/modules/auth/jwt.strategy.ts"
    ],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off"
    }
  },
  prettier
);

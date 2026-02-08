import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["convex/**/*.ts", "convex/**/*.tsx"],
    rules: {
      // v1 Convex modules are being migrated to v2; keep lint non-blocking during transition.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["src/components/**/*.ts", "src/components/**/*.tsx"],
    rules: {
      // v1 UI is in compatibility mode while v2 implementation is rolled out.
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/rules-of-hooks": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

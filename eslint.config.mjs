import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Extend Next.js and TypeScript rules
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Custom rule overrides
  {
    rules: {
      // Allow use of `any` for flexibility during development
      "@typescript-eslint/no-explicit-any": "off",

      // Allow generic `Function` types
      "@typescript-eslint/no-unsafe-function-type": "off",

      // Allow console logs (useful for debugging)
      "no-console": "off",

      // Disable prop-types enforcement (not needed with TypeScript)
      "react/prop-types": "off",

      // Warn about missing dependencies in useEffect
      "react-hooks/exhaustive-deps": "warn",

      // Warn about using <img> instead of Next.js <Image>
      "@next/next/no-img-element": "warn",
    },
  },
];

export default eslintConfig;
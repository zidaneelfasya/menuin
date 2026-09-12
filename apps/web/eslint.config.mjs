import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "*.js",
      "*.mjs",
      "src/file_export/**",
      "apply*.ts",
      "check*.ts",
      "clean*.ts",
      "clear*.ts",
      "enable*.ts",
      "fix*.ts",
      "grant*.ts",
      "replica.ts",
      "reset*.ts",
      "scratch.ts",
      "test*.ts",
      "src/lib/db/seed*.ts"
    ]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
      "react/no-unescaped-entities": "off"
    }
  }
];

export default eslintConfig;



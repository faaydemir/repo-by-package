import globals from "globals";
import js from "@eslint/js";

export default [
  js.configs.recommended,

  {
    languageOptions: {
      globals: globals.browser ,
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-console": "off",
      "strict": ["error", "global"],
    },
  },
];
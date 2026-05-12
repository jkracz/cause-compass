import { config as baseConfig } from "./packages/eslint-config/base.js";

export default [
  ...baseConfig,
  {
    ignores: [
      ".agents/**",
      "apps/**",
      "packages/**",
      "node_modules/**",
      "dist/**",
    ],
  },
];

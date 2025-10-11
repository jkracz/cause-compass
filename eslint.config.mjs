import { config as baseConfig } from "@cause/eslint-config/base";

export default [
  ...baseConfig,
  {
    ignores: ["apps/**", "packages/**", "node_modules/**", "dist/**"],
  },
];

import fs from "node:fs";
import { config } from "./config.js";

try {
  if (!fs.existsSync(config.healthFile)) {
    process.exit(1);
  }

  const raw = fs.readFileSync(config.healthFile, "utf8");
  const parsed = JSON.parse(raw) as { ts?: unknown };

  if (typeof parsed.ts !== "number") {
    process.exit(1);
  }

  const ageMs = Date.now() - parsed.ts;
  if (ageMs > config.healthMaxAgeMs) {
    process.exit(1);
  }

  process.exit(0);
} catch {
  process.exit(1);
}

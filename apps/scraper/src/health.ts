import fs from "node:fs";
import { config } from "./config.js";

type HealthState = Record<string, unknown>;

/**
 * Periodically writes worker liveness state to disk for container healthchecks.
 */
export function startHealthReporter(getState: () => HealthState): {
  writeNow: () => void;
  stop: () => void;
} {
  const writeNow = () => {
    try {
      fs.writeFileSync(
        config.healthFile,
        JSON.stringify({
          ts: Date.now(),
          workerId: config.workerId,
          ...getState(),
        }),
      );
    } catch {
      // Keep worker running even if health file cannot be written.
    }
  };

  writeNow();
  const interval = setInterval(writeNow, config.healthUpdateMs);

  return {
    writeNow,
    stop: () => clearInterval(interval),
  };
}

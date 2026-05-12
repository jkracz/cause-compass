import {
  FAMILY_COLOR,
  FAMILY_ORDER,
  FOCUS_ORDER,
  type Family,
  type Organization,
  type PortraitStats,
} from "@/lib/compass-axes";

import { CompassConstellation } from "./compass-constellation";
import { HowToReadDisclosure } from "./how-to-read";

const SCALE_ORDER = ["Grassroots", "Established", "Institutional"] as const;

const FOCUS_HINT: Record<string, string> = {
  Local: "one neighborhood",
  Regional: "a metro or state",
  National: "across the U.S.",
  Global: "cross-border",
};

const SCALE_RANGE: Record<(typeof SCALE_ORDER)[number], string> = {
  Grassroots: "under $250K",
  Established: "$250K to $1M",
  Institutional: "over $1M",
};

export function PortraitBlock({
  liked,
  stats,
  onSelect,
}: {
  liked: Organization[];
  stats: PortraitStats;
  onSelect: (org: Organization) => void;
}) {
  const presentFamilies = FAMILY_ORDER.filter(
    (f) => (stats.families[f] ?? 0) > 0,
  );
  const familyTotal = Math.max(1, stats.count);
  const rankedFamilies = presentFamilies
    .slice()
    .sort((a, b) => (stats.families[b] ?? 0) - (stats.families[a] ?? 0));
  const topFamily = rankedFamilies[0] ?? null;
  const tiltSentence: { lead: string; family?: Family; trail: string } | null =
    topFamily
      ? topFamily === "Unclassified"
        ? { lead: "A wide-ranging collection.", trail: "" }
        : rankedFamilies.length === 1
          ? { lead: "All in ", family: topFamily, trail: "." }
          : (stats.families[topFamily] ?? 0) / Math.max(1, stats.count) >= 0.6
            ? { lead: "Mostly ", family: topFamily, trail: "." }
            : { lead: "Tilted toward ", family: topFamily, trail: "." }
      : null;
  const presentFocus = FOCUS_ORDER.filter((f) => stats.focusCounts[f]);
  const presentScale = SCALE_ORDER.filter((k) => stats.scaleCounts[k]);

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 lg:col-span-7">
        <div className="rounded-[20px] border border-[var(--rule)] bg-[var(--card)] p-5 md:p-6">
          <div className="mb-3 flex flex-col gap-1">
            <span className="text-[10px] font-semibold tracking-[0.32em] text-[var(--accent)] uppercase">
              Compass constellation
            </span>
            <h2 className="font-heading text-[20px] leading-tight font-semibold text-[var(--ink)]">
              The shape of your giving
            </h2>
          </div>
          <CompassConstellation liked={liked} onSelect={onSelect} />
          <HowToReadDisclosure />
        </div>
      </div>

      <div className="col-span-12 space-y-4 lg:col-span-5">
        <div className="grid grid-cols-3 divide-x divide-[var(--rule)] rounded-[20px] border border-[var(--rule)] bg-[var(--card)]">
          {[
            { label: "Causes", value: stats.count },
            { label: "Cities", value: stats.cities },
            { label: "States", value: stats.states },
          ].map((cell) => (
            <div key={cell.label} className="px-4 py-3.5">
              <div className="text-[9.5px] font-semibold tracking-[0.18em] text-[var(--ink-mute)] uppercase">
                {cell.label}
              </div>
              <div className="font-heading mt-0.5 text-[24px] leading-none font-semibold text-[var(--ink)] tabular-nums">
                {cell.value}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[20px] border border-[var(--rule)] bg-[var(--card)] p-5">
          <span className="text-[10px] font-semibold tracking-[0.32em] text-[var(--accent)] uppercase">
            Cause families
          </span>
          {rankedFamilies.length === 0 || !tiltSentence ? (
            <>
              <h3 className="font-heading mt-1 text-[20px] font-semibold text-[var(--ink)]">
                Your tilt at a glance
              </h3>
              <p className="mt-3 text-[13px] text-[var(--ink-mute)]">
                No category data on these orgs yet.
              </p>
            </>
          ) : (
            <>
              <h3 className="font-heading mt-1 text-[24px] leading-[1.1] font-semibold text-[var(--ink)]">
                {tiltSentence.lead}
                {tiltSentence.family ? (
                  <span style={{ color: FAMILY_COLOR[tiltSentence.family] }}>
                    {tiltSentence.family}
                  </span>
                ) : null}
                {tiltSentence.trail}
              </h3>
              <div
                className="mt-5 flex h-7 w-full overflow-hidden rounded-full ring-1 ring-[var(--rule)]/60"
                role="img"
                aria-label={rankedFamilies
                  .map(
                    (f) =>
                      `${f} ${Math.round(((stats.families[f] ?? 0) / familyTotal) * 100)}%`,
                  )
                  .join(", ")}
              >
                {rankedFamilies.map((f) => {
                  const pct = ((stats.families[f] ?? 0) / familyTotal) * 100;
                  return (
                    <div
                      key={f}
                      title={`${f} · ${stats.families[f]}`}
                      style={{
                        width: `${pct}%`,
                        background: FAMILY_COLOR[f],
                      }}
                    />
                  );
                })}
              </div>
              <ul className="mt-3.5 flex flex-wrap gap-x-4 gap-y-1.5">
                {rankedFamilies.map((f) => (
                  <li
                    key={f}
                    className="flex items-baseline gap-1.5 text-[11.5px] text-[var(--ink-soft)]"
                  >
                    <span
                      aria-hidden
                      className="inline-block h-2 w-2 translate-y-[-1px] rounded-full"
                      style={{ background: FAMILY_COLOR[f] }}
                    />
                    {f}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-[20px] border border-[var(--rule)] bg-[var(--card)] p-4">
            <div className="text-[9.5px] font-semibold tracking-[0.18em] text-[var(--ink-mute)] uppercase">
              Geographic reach
            </div>
            <div className="mt-0.5 text-[11px] text-[var(--ink-mute)]">
              Where the work happens
            </div>
            {presentFocus.length === 0 ? (
              <p className="mt-2 text-[12px] text-[var(--ink-mute)]">
                Not enough data.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {presentFocus.map((f) => (
                  <div key={f}>
                    <div className="flex items-baseline justify-between text-[12.5px]">
                      <span className="text-[var(--ink-soft)]">{f}</span>
                      <span className="font-semibold text-[var(--ink)] tabular-nums">
                        {stats.focusCounts[f]}
                      </span>
                    </div>
                    <div className="text-[10.5px] text-[var(--ink-mute)]">
                      {FOCUS_HINT[f]}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-[20px] border border-[var(--rule)] bg-[var(--card)] p-4">
            <div className="text-[9.5px] font-semibold tracking-[0.18em] text-[var(--ink-mute)] uppercase">
              Org scale
            </div>
            <div className="mt-0.5 text-[11px] text-[var(--ink-mute)]">
              By annual assets
            </div>
            {presentScale.length === 0 ? (
              <p className="mt-2 text-[12px] text-[var(--ink-mute)]">
                Not enough data.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {presentScale.map((k) => (
                  <div key={k}>
                    <div className="flex items-baseline justify-between text-[12.5px]">
                      <span className="text-[var(--ink-soft)]">{k}</span>
                      <span className="font-semibold text-[var(--ink)] tabular-nums">
                        {stats.scaleCounts[k]}
                      </span>
                    </div>
                    <div className="text-[10.5px] text-[var(--ink-mute)]">
                      {SCALE_RANGE[k]}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

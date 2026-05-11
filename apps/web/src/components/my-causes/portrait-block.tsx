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

const CARDINAL_LEGEND: { color: string; label: Family; hint: string }[] = [
  { color: FAMILY_COLOR.Imagination, label: "Imagination", hint: "arts" },
  { color: FAMILY_COLOR.Knowledge, label: "Knowledge", hint: "learning" },
  { color: FAMILY_COLOR.Care, label: "Care", hint: "health" },
  {
    color: FAMILY_COLOR.Stewardship,
    label: "Stewardship",
    hint: "environment",
  },
];

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
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--rule)] pt-3 text-[10px] font-semibold tracking-[0.18em] text-[var(--ink-mute)] uppercase">
            {CARDINAL_LEGEND.map((item) => (
              <span key={item.label} className="flex items-center">
                <span
                  aria-hidden
                  className="mr-1.5 inline-block h-2 w-2 rounded-full"
                  style={{ background: item.color }}
                />
                {item.label}
                <span className="ml-1 font-normal tracking-[0.08em] text-[var(--ink-mute)]/70 normal-case">
                  · {item.hint}
                </span>
              </span>
            ))}
          </div>
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
              <div className="font-heading mt-0.5 text-[24px] leading-none font-semibold tabular-nums text-[var(--ink)]">
                {cell.value}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[20px] border border-[var(--rule)] bg-[var(--card)] p-5">
          <span className="text-[10px] font-semibold tracking-[0.32em] text-[var(--accent)] uppercase">
            Cause families
          </span>
          <h3 className="font-heading mt-1 text-[20px] font-semibold text-[var(--ink)]">
            Your tilt at a glance
          </h3>
          <p className="mt-0.5 mb-4 text-[11px] text-[var(--ink-mute)]">
            Share of your collection
          </p>
          {presentFamilies.length === 0 ? (
            <p className="text-[13px] text-[var(--ink-mute)]">
              No category data on these orgs yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {presentFamilies.map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-[110px] shrink-0 text-[11px] font-semibold tracking-[0.12em] text-[var(--ink-soft)] uppercase">
                    {f}
                  </div>
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[var(--paper-deep)]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${((stats.families[f] ?? 0) / familyTotal) * 100}%`,
                        background: FAMILY_COLOR[f],
                      }}
                    />
                  </div>
                  <div className="w-6 shrink-0 text-right text-[12px] font-semibold tabular-nums text-[var(--ink)]">
                    {stats.families[f]}
                  </div>
                </div>
              ))}
            </div>
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
                      <span className="font-semibold tabular-nums text-[var(--ink)]">
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
                      <span className="font-semibold tabular-nums text-[var(--ink)]">
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

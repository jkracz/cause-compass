"use client";

import { useId, useMemo, useState } from "react";
import { Group } from "@visx/group";
import { Text } from "@visx/text";

import type { GeographicFocus } from "@/lib/browse-categories";
import {
  AXIS_ANGLES_DEG,
  FOCUS_RADIUS,
  getAxisForOrg,
  getDotRadius,
  type Family,
  type Organization,
} from "@/lib/compass-axes";

const VIEW = 460;
const CENTER_RADIUS_FRAC = 0.18;
const OUTER_RADIUS_FRAC = 0.42;
const SPREAD_DEG = 36;

type Dot = {
  org: Organization;
  x: number;
  y: number;
  color: string;
  family: Family;
  dotR: number;
};

function placeDots(liked: Organization[]): Dot[] {
  const cx = VIEW / 2;
  const cy = VIEW / 2;
  const R = VIEW * OUTER_RADIUS_FRAC;

  // Group by axis + focus so dots in the same cell can be spread together.
  const byCell = new Map<string, Organization[]>();
  for (const org of liked) {
    const axis = getAxisForOrg(org).axis;
    if (axis === "CENTER") {
      const list = byCell.get("CENTER") ?? [];
      list.push(org);
      byCell.set("CENTER", list);
      continue;
    }
    const focus =
      (org.geographicFocus as GeographicFocus | undefined) ?? "Regional";
    const key = `${axis}|${focus}`;
    const list = byCell.get(key) ?? [];
    list.push(org);
    byCell.set(key, list);
  }

  const out: Dot[] = [];
  for (const [key, group] of byCell) {
    if (key === "CENTER") {
      const r = R * CENTER_RADIUS_FRAC;
      group.forEach((org, i) => {
        const angle = ((i / group.length) * 360 - 90) * (Math.PI / 180);
        out.push(
          makeDot(org, cx + Math.cos(angle) * r, cy + Math.sin(angle) * r),
        );
      });
      continue;
    }
    const [axis, focus] = key.split("|") as [
      keyof typeof AXIS_ANGLES_DEG,
      GeographicFocus,
    ];
    const baseAngle = AXIS_ANGLES_DEG[axis];
    const baseR = R * (FOCUS_RADIUS[focus] ?? 0.5);
    const n = group.length;
    group.forEach((org, i) => {
      // Angular spread within ±SPREAD_DEG/2 of the axis.
      const angleSpread = n === 1 ? 0 : (i / (n - 1) - 0.5) * SPREAD_DEG;
      // Radial wobble within the focus band so dense buckets fan out
      // along two dimensions instead of stacking on one arc.
      const radialStep = n > 1 ? (((i % 3) - 1) * R) / 22 : 0;
      const angle = ((baseAngle + angleSpread) * Math.PI) / 180;
      const r = baseR + radialStep;
      out.push(
        makeDot(org, cx + Math.cos(angle) * r, cy + Math.sin(angle) * r),
      );
    });
  }
  return out;
}

function makeDot(org: Organization, x: number, y: number): Dot {
  const axisDef = getAxisForOrg(org);
  return {
    org,
    x,
    y,
    color: axisDef.color,
    family: axisDef.family,
    dotR: getDotRadius(org),
  };
}

export function CompassConstellation({
  liked,
  onSelect,
}: {
  liked: Organization[];
  onSelect: (org: Organization) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const dots = useMemo(() => placeDots(liked), [liked]);
  const titleId = useId();
  const cx = VIEW / 2;
  const cy = VIEW / 2;
  const R = VIEW * OUTER_RADIUS_FRAC;

  const axisLabels = [
    { id: "N", text: "Imagination", x: cx, y: 18, anchor: "middle" as const },
    {
      id: "E",
      text: "Knowledge",
      x: VIEW - 12,
      y: cy + 4,
      anchor: "end" as const,
    },
    { id: "S", text: "Care", x: cx, y: VIEW - 8, anchor: "middle" as const },
    { id: "W", text: "Stewardship", x: 12, y: cy + 4, anchor: "start" as const },
  ];

  const focusRings = [
    { frac: FOCUS_RADIUS.Local, label: "Local" },
    { frac: FOCUS_RADIUS.Regional, label: "Regional" },
    { frac: FOCUS_RADIUS.National, label: "National" },
    { frac: FOCUS_RADIUS.Global, label: "Global" },
  ];

  const hoveredDot = hovered
    ? (dots.find((d) => d.org.slug === hovered) ?? null)
    : null;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[460px]">
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className="block h-full w-full"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>
          Compass constellation of {liked.length}{" "}
          {liked.length === 1 ? "liked cause" : "liked causes"}
        </title>

        {focusRings.map((ring) => {
          const r = R * ring.frac;
          const labelAngle = (-65 * Math.PI) / 180;
          const labelX = cx + Math.cos(labelAngle) * r + 4;
          const labelY = cy + Math.sin(labelAngle) * r - 2;
          return (
            <g key={ring.label}>
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="var(--rule)"
                strokeDasharray="2 4"
                strokeWidth={1}
              />
              <Text
                x={labelX}
                y={labelY}
                fontSize={9}
                fill="var(--ink-mute)"
                style={{
                  fontFamily: "Archivo, sans-serif",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                {ring.label}
              </Text>
            </g>
          );
        })}

        {[0, 90, 180, 270].map((deg) => {
          const a = (deg * Math.PI) / 180;
          return (
            <line
              key={deg}
              x1={cx + Math.cos(a) * R * FOCUS_RADIUS.Local}
              y1={cy + Math.sin(a) * R * FOCUS_RADIUS.Local}
              x2={cx + Math.cos(a) * R}
              y2={cy + Math.sin(a) * R}
              stroke="var(--rule)"
              strokeWidth={1}
            />
          );
        })}

        {axisLabels.map((l) => (
          <Text
            key={l.id}
            x={l.x}
            y={l.y}
            textAnchor={l.anchor}
            fontSize={11}
            fontWeight={600}
            fill="var(--ink-soft)"
            style={{ fontFamily: "var(--font-heading), Bitter, serif" }}
          >
            {l.text}
          </Text>
        ))}

        <Group left={cx} top={cy}>
          <circle
            r={10}
            fill="none"
            stroke="var(--ink)"
            strokeWidth={0.5}
            opacity={0.4}
          />
          <circle r={4} fill="var(--ink)" />
        </Group>

        {dots
          .slice()
          .sort((a, b) => {
            if (a.org.slug === hovered) return 1;
            if (b.org.slug === hovered) return -1;
            return 0;
          })
          .map((d) => {
          const isHovered = hovered === d.org.slug;
          const focusLabel = d.org.geographicFocus ?? "scope unknown";
          return (
            <g
              key={d.org.slug}
              onMouseEnter={() => setHovered(d.org.slug)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(d.org.slug)}
              onBlur={() => setHovered(null)}
              onClick={() => onSelect(d.org)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(d.org);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`${d.org.name}, ${d.family}, ${focusLabel}`}
              style={{ cursor: "pointer", outline: "none" }}
            >
              {isHovered && (
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={d.dotR + 6}
                  fill={d.color}
                  opacity={0.18}
                />
              )}
              <circle
                cx={d.x}
                cy={d.y}
                r={d.dotR}
                fill={d.color}
                stroke="var(--paper)"
                strokeWidth={1.5}
              />
            </g>
          );
        })}
      </svg>

      {hoveredDot && (
        <div
          className="pointer-events-none absolute z-10 max-w-[220px] rounded-lg border border-[var(--rule)] bg-[var(--card)] px-3 py-2 shadow-[0_18px_40px_-24px_rgba(91,75,158,0.45)]"
          style={{
            left: `calc(${(hoveredDot.x / VIEW) * 100}% + 14px)`,
            top: `calc(${(hoveredDot.y / VIEW) * 100}% - 8px)`,
          }}
        >
          <div
            className="text-[10.5px] font-semibold tracking-[0.14em] uppercase"
            style={{ color: hoveredDot.color }}
          >
            {hoveredDot.family}
            {hoveredDot.org.geographicFocus
              ? ` · ${hoveredDot.org.geographicFocus}`
              : ""}
          </div>
          <div className="font-heading mt-0.5 text-sm leading-tight font-semibold text-[var(--ink)]">
            {hoveredDot.org.name}
          </div>
          {(hoveredDot.org.city || hoveredDot.org.state) && (
            <div className="text-[11px] text-[var(--ink-mute)]">
              {[hoveredDot.org.city, hoveredDot.org.state]
                .filter(Boolean)
                .join(", ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

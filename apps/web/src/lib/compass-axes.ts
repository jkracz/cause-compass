import type { Doc } from "@cause/backend/convex/_generated/dataModel";

import type { GeographicFocus } from "./browse-categories";

export type Organization = Doc<"organizations">;

export type AxisKey =
  | "N"
  | "E"
  | "S"
  | "W"
  | "NE"
  | "SE"
  | "SW"
  | "NW"
  | "CENTER";

export type Family =
  | "Imagination"
  | "Knowledge"
  | "Care"
  | "Stewardship"
  | "Global Affairs"
  | "Community"
  | "Public Safety"
  | "Youth & Sport"
  | "Unclassified";

export type AxisDef = {
  axis: AxisKey;
  family: Family;
  color: string;
};

const N: AxisDef = { axis: "N", family: "Imagination", color: "#C58F5A" };
const E_AX: AxisDef = { axis: "E", family: "Knowledge", color: "#5A7A8E" };
const S: AxisDef = { axis: "S", family: "Care", color: "#8E5C4A" };
const W: AxisDef = { axis: "W", family: "Stewardship", color: "#5C7A5E" };
const NE: AxisDef = { axis: "NE", family: "Global Affairs", color: "#5E5470" };
const SE: AxisDef = { axis: "SE", family: "Community", color: "#8E6F4F" };
const SW: AxisDef = { axis: "SW", family: "Public Safety", color: "#5B4B9E" };
const NW: AxisDef = { axis: "NW", family: "Youth & Sport", color: "#7B6BA8" };
const CENTER: AxisDef = {
  axis: "CENTER",
  family: "Unclassified",
  color: "#7C6F9A",
};

const NTEE_TO_AXIS: Record<string, AxisDef> = {
  A: N,
  B: E_AX,
  C: W,
  D: W,
  E: S,
  F: S,
  G: S,
  H: S,
  I: SW,
  J: SE,
  K: W,
  L: SE,
  M: SW,
  N: NW,
  O: NW,
  P: S,
  Q: NE,
  R: NE,
  S: SE,
  T: SE,
  U: E_AX,
  V: E_AX,
  W: SE,
  X: CENTER,
  Y: CENTER,
  Z: CENTER,
};

export function getAxisForOrg(org: Organization): AxisDef {
  const major = org.nteeMajor?.toUpperCase();
  if (!major) return CENTER;
  return NTEE_TO_AXIS[major] ?? CENTER;
}

export const AXIS_ANGLES_DEG: Record<AxisKey, number> = {
  N: -90,
  NE: -45,
  E: 0,
  SE: 45,
  S: 90,
  SW: 135,
  W: 180,
  NW: -135,
  CENTER: 0,
};

export const FOCUS_RADIUS: Record<GeographicFocus, number> = {
  Local: 0.32,
  Regional: 0.55,
  National: 0.78,
  Global: 0.95,
};

export const FOCUS_ORDER: GeographicFocus[] = [
  "Local",
  "Regional",
  "National",
  "Global",
];

export type ScaleBucket = "Grassroots" | "Established" | "Institutional";

export const SCALE_DOT_RADIUS: Record<ScaleBucket, number> = {
  Grassroots: 6,
  Established: 9,
  Institutional: 13,
};

const DEFAULT_DOT_RADIUS = 8;

export function getScaleBucket(
  assetBucket: Organization["assetBucket"],
): ScaleBucket | null {
  switch (assetBucket) {
    case "micro":
    case "small":
      return "Grassroots";
    case "mid":
      return "Established";
    case "large":
    case "mega":
      return "Institutional";
    default:
      return null;
  }
}

export function getDotRadius(org: Organization): number {
  const bucket = getScaleBucket(org.assetBucket);
  return bucket ? SCALE_DOT_RADIUS[bucket] : DEFAULT_DOT_RADIUS;
}

export const FAMILY_ORDER: Family[] = [
  "Imagination",
  "Knowledge",
  "Care",
  "Stewardship",
  "Global Affairs",
  "Community",
  "Public Safety",
  "Youth & Sport",
  "Unclassified",
];

export const FAMILY_COLOR: Record<Family, string> = {
  Imagination: N.color,
  Knowledge: E_AX.color,
  Care: S.color,
  Stewardship: W.color,
  "Global Affairs": NE.color,
  Community: SE.color,
  "Public Safety": SW.color,
  "Youth & Sport": NW.color,
  Unclassified: CENTER.color,
};

export type PortraitStats = {
  count: number;
  cities: number;
  states: number;
  families: Partial<Record<Family, number>>;
  focusCounts: Partial<Record<GeographicFocus, number>>;
  scaleCounts: Partial<Record<ScaleBucket, number>>;
  topFamily: Family | null;
  topFamilyShare: number;
  topFocus: GeographicFocus | null;
  topFocusShare: number;
  localishCount: number;
};

export function computePortraitStats(orgs: Organization[]): PortraitStats {
  const cities = new Set<string>();
  const states = new Set<string>();
  const families: Partial<Record<Family, number>> = {};
  const focusCounts: Partial<Record<GeographicFocus, number>> = {};
  const scaleCounts: Partial<Record<ScaleBucket, number>> = {};

  for (const org of orgs) {
    if (org.city) cities.add(`${org.city}, ${org.state ?? ""}`);
    if (org.state) states.add(org.state);

    const axis = getAxisForOrg(org);
    families[axis.family] = (families[axis.family] ?? 0) + 1;

    if (org.geographicFocus) {
      const focus = org.geographicFocus as GeographicFocus;
      focusCounts[focus] = (focusCounts[focus] ?? 0) + 1;
    }

    const bucket = getScaleBucket(org.assetBucket);
    if (bucket) scaleCounts[bucket] = (scaleCounts[bucket] ?? 0) + 1;
  }

  const familyEntries = Object.entries(families) as [Family, number][];
  const focusEntries = Object.entries(focusCounts) as [
    GeographicFocus,
    number,
  ][];
  const topFamilyEntry = familyEntries.sort((a, b) => b[1] - a[1])[0];
  const topFocusEntry = focusEntries.sort((a, b) => b[1] - a[1])[0];

  const total = orgs.length;
  const localishCount =
    (focusCounts.Local ?? 0) + (focusCounts.Regional ?? 0);

  return {
    count: total,
    cities: cities.size,
    states: states.size,
    families,
    focusCounts,
    scaleCounts,
    topFamily: topFamilyEntry?.[0] ?? null,
    topFamilyShare: topFamilyEntry
      ? Math.round((topFamilyEntry[1] / total) * 100)
      : 0,
    topFocus: topFocusEntry?.[0] ?? null,
    topFocusShare: topFocusEntry
      ? Math.round((topFocusEntry[1] / total) * 100)
      : 0,
    localishCount,
  };
}

const FAMILY_PHRASE: Record<Family, string> = {
  Imagination: "imagination-led",
  Knowledge: "knowledge-anchored",
  Care: "care-anchored",
  Stewardship: "stewardship-minded",
  "Global Affairs": "globally-minded",
  Community: "community-rooted",
  "Public Safety": "safety-minded",
  "Youth & Sport": "youth-focused",
  Unclassified: "wide-ranging",
};

export function buildPortraitSentence(stats: PortraitStats): string {
  const { count, topFamily, topFamilyShare, localishCount, families } = stats;

  if (count === 0) {
    return "Like a few organizations on Discover and your portrait will start to take shape — by cause family, geographic reach, and the scale of each cause.";
  }

  if (count === 1) {
    return topFamily
      ? `One cause so far, rooted in ${topFamily.toLowerCase()}. Your portrait will take shape as you add more.`
      : "One cause so far. Your portrait will take shape as you add more.";
  }

  const familyCount = Object.keys(families).length;
  const localPct = Math.round((localishCount / count) * 100);
  const phrase = topFamily ? FAMILY_PHRASE[topFamily] : "wide-ranging";

  if (localPct >= 60 && topFamily) {
    return `A ${phrase}, locally rooted giver — ${localishCount} of your ${count} causes sit close to home.`;
  }
  if (topFamilyShare >= 50 && topFamily) {
    return `Your portrait leans heavily toward ${topFamily.toLowerCase()}: ${topFamilyShare}% of your causes belong to that family.`;
  }
  if (familyCount >= 4 && topFamily) {
    return `A wide-ranging giver across ${familyCount} cause families, with a tilt toward ${topFamily.toLowerCase()}.`;
  }
  if (topFamily) {
    return `Your collection so far leans ${topFamily.toLowerCase()}, with ${count} causes across ${familyCount} ${familyCount === 1 ? "family" : "families"}.`;
  }
  return `${count} causes saved so far. Add a few more and your portrait will start to take shape.`;
}

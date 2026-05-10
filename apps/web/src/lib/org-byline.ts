type AssetBucket = "micro" | "small" | "mid" | "large" | "mega" | "unknown";
type GeographicFocus = "Local" | "Regional" | "National" | "Global";

const SIZE_NOUN: Record<AssetBucket, string> = {
  micro: "a grassroots group",
  small: "a small-team nonprofit",
  mid: "a mid-sized nonprofit",
  large: "a large nonprofit",
  mega: "a major nonprofit",
  unknown: "a nonprofit",
};

const REACH_CLAUSE: Record<Exclude<GeographicFocus, "Local">, string> = {
  Regional: "working across a region",
  National: "working across the country",
  Global: "working across borders",
};

const GEO_GLYPH: Record<GeographicFocus, string> = {
  Global: "◐",
  National: "◈",
  Regional: "◇",
  Local: "◉",
};

interface BylineInput {
  assetBucket?: AssetBucket;
  geographicFocus?: GeographicFocus;
  city?: string;
  state?: string;
}

export interface OrgByline {
  sentence: string;
  glyph: string | null;
  glyphLabel: string | null;
}

function locationPhrase(city?: string, state?: string): string {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return "";
}

export function composeOrgByline({
  assetBucket,
  geographicFocus,
  city,
  state,
}: BylineInput): OrgByline | null {
  const hasSize = assetBucket && assetBucket !== "unknown";
  const hasReach = !!geographicFocus;
  const place = locationPhrase(city, state);
  const hasPlace = place.length > 0;

  if (!hasSize && !hasReach && !hasPlace) return null;

  const noun = SIZE_NOUN[assetBucket ?? "unknown"];
  let sentence: string;

  if (geographicFocus === "Local" && hasPlace) {
    sentence = `${noun} rooted in ${place}.`;
  } else if (hasReach) {
    const reach = REACH_CLAUSE[geographicFocus as Exclude<GeographicFocus, "Local">];
    sentence = hasPlace
      ? `${noun} ${reach}, based in ${place}.`
      : `${noun} ${reach}.`;
  } else if (hasPlace) {
    sentence = `${noun} based in ${place}.`;
  } else {
    sentence = `${noun}.`;
  }

  sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);

  return {
    sentence,
    glyph: geographicFocus ? GEO_GLYPH[geographicFocus] : null,
    glyphLabel: geographicFocus ?? null,
  };
}

interface ShortBylineInput {
  assetBucket?: AssetBucket;
  geographicFocus?: GeographicFocus;
}

export function composeOrgBylineShort({
  assetBucket,
  geographicFocus,
}: ShortBylineInput): string | null {
  const hasSize = assetBucket && assetBucket !== "unknown";
  const hasReach = !!geographicFocus;
  if (!hasSize && !hasReach) return null;

  const SIZE_SHORT: Record<AssetBucket, string> = {
    micro: "Grassroots",
    small: "Small team",
    mid: "Mid-sized",
    large: "Large",
    mega: "Major",
    unknown: "",
  };

  const REACH_SHORT: Record<GeographicFocus, string> = {
    Local: "neighborhood-rooted",
    Regional: "regional reach",
    National: "national reach",
    Global: "international reach",
  };

  const sizeWord = hasSize ? SIZE_SHORT[assetBucket as AssetBucket] : "";
  const reachWord = hasReach
    ? REACH_SHORT[geographicFocus as GeographicFocus]
    : "";

  if (sizeWord && reachWord) return `${sizeWord}, ${reachWord}.`;
  if (sizeWord) return `${sizeWord}.`;
  return `${reachWord.charAt(0).toUpperCase()}${reachWord.slice(1)}.`;
}

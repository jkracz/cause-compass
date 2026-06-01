"use server";

import "server-only";

type ReverseGeocodeStateInput = {
  latitude: number;
  longitude: number;
};

type ReverseGeocodeStateResult =
  | {
      ok: true;
      stateCode: string;
      stateName: string;
    }
  | {
      ok: false;
      reason:
        | "invalid_coordinates"
        | "missing_token"
        | "mapbox_error"
        | "state_not_found";
    };

type MapboxFeature = {
  place_type?: string[];
  properties?: {
    short_code?: string;
  };
  text?: string;
};

type MapboxReverseGeocodeResponse = {
  features?: MapboxFeature[];
};

function parseStateCode(shortCode?: string) {
  const match = shortCode?.match(/^US-([A-Z]{2})$/i);
  return match?.[1]?.toUpperCase() ?? null;
}

export async function reverseGeocodeState({
  latitude,
  longitude,
}: ReverseGeocodeStateInput): Promise<ReverseGeocodeStateResult> {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return { ok: false, reason: "invalid_coordinates" };
  }

  const accessToken = process.env.MAPBOX_ACCESS_TOKEN;
  if (!accessToken) {
    return { ok: false, reason: "missing_token" };
  }

  const params = new URLSearchParams({
    access_token: accessToken,
    country: "US",
    limit: "1",
    types: "region",
  });
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?${params.toString()}`;

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return { ok: false, reason: "mapbox_error" };
    }

    const body = (await response.json()) as MapboxReverseGeocodeResponse;
    const region = body.features?.find((feature) =>
      feature.place_type?.includes("region"),
    );
    const stateCode = parseStateCode(region?.properties?.short_code);
    const stateName = region?.text?.trim();

    if (!stateCode || !stateName) {
      return { ok: false, reason: "state_not_found" };
    }

    return { ok: true, stateCode, stateName };
  } catch {
    return { ok: false, reason: "mapbox_error" };
  }
}

"use server";

const MAPBOX_REVERSE_GEOCODE_URL =
  "https://api.mapbox.com/search/geocode/v6/reverse";

type MapboxFeature = {
  properties?: {
    feature_type?: string;
    name?: string;
    context?: {
      region?: {
        name?: string;
        region_code?: string;
      };
      place?: {
        name?: string;
      };
    };
  };
};

export type SessionLocation = {
  city?: string;
  state?: string;
};

type ReverseGeocodeArgs = {
  latitude: number;
  longitude: number;
};

function normalizeRegionCode(value?: string) {
  if (!value) {
    return undefined;
  }

  const parts = value.split("-");
  return parts[parts.length - 1]?.toUpperCase();
}

function extractLocation(features: MapboxFeature[]) {
  const regionFeature = features.find(
    (feature) => feature.properties?.feature_type === "region",
  );
  const placeFeature = features.find(
    (feature) => feature.properties?.feature_type === "place",
  );
  const firstFeature = features[0];

  return {
    city:
      placeFeature?.properties?.name ??
      firstFeature?.properties?.context?.place?.name,
    state: normalizeRegionCode(
      regionFeature?.properties?.context?.region?.region_code ??
        firstFeature?.properties?.context?.region?.region_code,
    ),
  };
}

export async function reverseGeocodeForSession({
  latitude,
  longitude,
}: ReverseGeocodeArgs): Promise<SessionLocation | null> {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  const accessToken = process.env.MAPBOX_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("MAPBOX_ACCESS_TOKEN is not configured.");
    return null;
  }

  const url = new URL(MAPBOX_REVERSE_GEOCODE_URL);
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("types", "place,region");
  url.searchParams.set("country", "US");
  url.searchParams.set("access_token", accessToken);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Mapbox reverse geocoding failed", errorText);
      return null;
    }

    const data = (await response.json()) as {
      features?: MapboxFeature[];
    };

    return extractLocation(data.features ?? []);
  } catch (error) {
    console.error("Reverse geocoding failed", error);
    return null;
  }
}

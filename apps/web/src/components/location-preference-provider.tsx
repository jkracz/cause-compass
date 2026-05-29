"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { reverseGeocodeState } from "@/app/actions/location";
import { getUsStateLabel } from "@/lib/us-states";

type LocationIntent = "unset" | "enabled" | "disabled" | "dismissed";
type LocationSource = "browser" | "manual";
type LocationStatus = "idle" | "locating" | "choosing";

type StoredLocationPreference = {
  version: 1;
  intent: Exclude<LocationIntent, "unset">;
  manualStateCode?: string;
  manualStateName?: string;
};

type ActiveLocationPreference = {
  stateCode: string;
  stateName: string;
  source: LocationSource;
};

type LocationPreferenceContextValue = {
  intent: LocationIntent;
  status: LocationStatus;
  activeState: ActiveLocationPreference | null;
  errorMessage: string | null;
  useBrowserLocation: () => Promise<void>;
  setManualState: (stateCode: string) => void;
  turnOff: () => void;
};

const STORAGE_KEY = "causeCompass.locationPreference.v1";
const GEOLOCATION_TIMEOUT_MS = 10_000;

const LocationPreferenceContext =
  createContext<LocationPreferenceContextValue | null>(null);

function readStoredPreference(): StoredLocationPreference | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredLocationPreference>;
    if (
      parsed.version !== 1 ||
      (parsed.intent !== "enabled" &&
        parsed.intent !== "disabled" &&
        parsed.intent !== "dismissed")
    ) {
      return null;
    }
    return {
      version: 1,
      intent: parsed.intent,
      manualStateCode: parsed.manualStateCode,
      manualStateName: parsed.manualStateName,
    };
  } catch {
    return null;
  }
}

function writeStoredPreference(preference: StoredLocationPreference) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
}

function getBrowserPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("geolocation_unavailable"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 5 * 60 * 1000,
      timeout: GEOLOCATION_TIMEOUT_MS,
    });
  });
}

export function LocationPreferenceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [intent, setIntent] = useState<LocationIntent>("unset");
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [activeState, setActiveState] =
    useState<ActiveLocationPreference | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const persistPreference = useCallback(
    (preference: StoredLocationPreference) => {
      writeStoredPreference(preference);
      setIntent(preference.intent);
    },
    [],
  );

  const requestBrowserLocation = useCallback(async () => {
    setStatus("locating");
    setErrorMessage(null);
    persistPreference({ version: 1, intent: "enabled" });

    try {
      const position = await getBrowserPosition();
      const result = await reverseGeocodeState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      if (!result.ok) {
        setActiveState(null);
        setStatus("choosing");
        setErrorMessage("We could not detect your state. Choose one instead.");
        return;
      }

      setActiveState({
        stateCode: result.stateCode,
        stateName: result.stateName,
        source: "browser",
      });
      setStatus("idle");
    } catch {
      setActiveState(null);
      setStatus("choosing");
      setErrorMessage(
        "Location access was unavailable. Choose a state instead.",
      );
    }
  }, [persistPreference]);

  useEffect(() => {
    let cancelled = false;
    window.setTimeout(() => {
      if (cancelled) return;
      const stored = readStoredPreference();

      if (!stored) return;

      setIntent(stored.intent);
      if (stored.intent === "enabled" && stored.manualStateCode) {
        setActiveState({
          stateCode: stored.manualStateCode,
          stateName:
            stored.manualStateName ?? getUsStateLabel(stored.manualStateCode),
          source: "manual",
        });
        return;
      }

      if (stored.intent === "enabled") {
        void requestBrowserLocation();
      }
    }, 0);

    return () => {
      cancelled = true;
    };
  }, [requestBrowserLocation]);

  const setManualState = useCallback(
    (stateCode: string) => {
      const stateName = getUsStateLabel(stateCode);
      persistPreference({
        version: 1,
        intent: "enabled",
        manualStateCode: stateCode,
        manualStateName: stateName,
      });
      setActiveState({ stateCode, stateName, source: "manual" });
      setStatus("idle");
      setErrorMessage(null);
    },
    [persistPreference],
  );

  const turnOff = useCallback(() => {
    persistPreference({ version: 1, intent: "disabled" });
    setActiveState(null);
    setStatus("idle");
    setErrorMessage(null);
  }, [persistPreference]);

  const value = useMemo<LocationPreferenceContextValue>(
    () => ({
      intent,
      status,
      activeState,
      errorMessage,
      useBrowserLocation: requestBrowserLocation,
      setManualState,
      turnOff,
    }),
    [
      activeState,
      errorMessage,
      intent,
      setManualState,
      status,
      turnOff,
      requestBrowserLocation,
    ],
  );

  return (
    <LocationPreferenceContext.Provider value={value}>
      {children}
    </LocationPreferenceContext.Provider>
  );
}

export function useLocationPreference() {
  const context = useContext(LocationPreferenceContext);
  if (!context) {
    throw new Error(
      "useLocationPreference must be used within LocationPreferenceProvider",
    );
  }
  return context;
}

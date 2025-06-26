import { UserPreferencesForm } from "@/server/schemas/user";

/**
 * Process form data from the onboarding flow
 * Handles all the different question types and formats
 */
export function processPreferencesFormData(formData: FormData) {
  // Helper function to normalize array data
  const normalizeArray = (values: FormDataEntryValue[]): string[] => {
    return values.map(v => v.toString()).filter(v => v.trim() !== '');
  };

  // Helper function to normalize string data
  const normalizeString = (value: FormDataEntryValue | null): string | undefined => {
    if (!value) return undefined;
    const str = value.toString().trim();
    return str === '' ? undefined : str;
  };

  return {
    causes: normalizeArray(formData.getAll("causes")),
    location: normalizeString(formData.get("location")),
    donationRange: normalizeString(formData.get("donationRange")),
    involvement: normalizeString(formData.get("involvement")),
    helpMethod: normalizeArray(formData.getAll("helpMethod")),
    changeScope: normalizeString(formData.get("changeScope")),
    openEnded: normalizeString(formData.get("openEnded")),
  };
}

/**
 * Convert user preferences to a format suitable for the control panel
 */
export function formatPreferencesForDisplay(preferences: any): Record<string, any> {
  if (!preferences) return {};

  return {
    causes: preferences.causes || [],
    location: preferences.location,
    donationRange: preferences.donationRange,
    involvement: preferences.involvement,
    helpMethod: preferences.helpMethod || [],
    changeScope: preferences.changeScope,
    openEnded: preferences.openEnded,
  };
}

/**
 * Get user preference labels for display
 */
export const PREFERENCE_LABELS = {
  causes: {
    environment: "Environment & Climate",
    education: "Education & Youth", 
    health: "Health & Wellness",
    poverty: "Poverty & Housing",
    rights: "Human Rights & Justice",
    arts: "Arts & Culture",
    animals: "Animal Welfare",
    disaster: "Disaster Relief",
    "mental-health": "Mental Health",
    food: "Food Security",
    technology: "Technology & Innovation",
    community: "Community Development",
  },
  helpMethod: {
    donating: "Donating",
    volunteering: "Volunteering",
    sharing: "Sharing information",
    connecting: "Connecting people",
    learning: "Learning more",
  },
  changeScope: {
    local: "Local community",
    national: "National",
    global: "Global",
  }
};

/**
 * Convert preference values to human-readable labels
 */
export function getPreferenceLabel(category: keyof typeof PREFERENCE_LABELS, value: string): string {
  return PREFERENCE_LABELS[category][value as keyof typeof PREFERENCE_LABELS[typeof category]] || value;
}
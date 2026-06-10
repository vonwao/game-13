// Non-public shell switch for local QA of deprecated modes.
export const LEGACY_MODES_QUERY = import.meta.env.DEV ? 'legacyModes' : '';
export const LEGACY_MODES_STORAGE_KEY = import.meta.env.DEV ? 'lexdeep:legacyModes' : '';

function readFromLocation() {
  if (typeof window === 'undefined' || !window.location) return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const value = params.get(LEGACY_MODES_QUERY);
    if (value === '1' || value === 'true') return true;
    if (value === '0' || value === 'false') return false;
  } catch {
    return null;
  }
  return null;
}

function readFromStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    return window.localStorage.getItem(LEGACY_MODES_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function legacyModesEnabled() {
  if (!import.meta.env.DEV) return false;
  const fromLocation = readFromLocation();
  if (fromLocation != null) return fromLocation;
  return readFromStorage();
}

export function persistLegacyModesPreference(enabled) {
  if (!import.meta.env.DEV) return;
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (enabled) {
      window.localStorage.setItem(LEGACY_MODES_STORAGE_KEY, '1');
    } else {
      window.localStorage.removeItem(LEGACY_MODES_STORAGE_KEY);
    }
  } catch {
    // localStorage can be unavailable; ignore.
  }
}

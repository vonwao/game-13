const LEGACY_MODES_QUERY = 'legacyModes';
const LEGACY_MODES_STORAGE_KEY = 'lexdeep:legacyModes';

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
  const fromLocation = readFromLocation();
  if (fromLocation != null) return fromLocation;
  return readFromStorage();
}

export function persistLegacyModesPreference(enabled) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(LEGACY_MODES_STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // localStorage can be unavailable; ignore.
  }
}

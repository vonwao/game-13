import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SKINS } from './index.jsx';

const STORAGE_KEY = 'lexicon:skin';
const DEFAULT_SKIN_ID = 'page';

const SkinContext = createContext(null);

function readStoredSkinId() {
  if (typeof window === 'undefined') return DEFAULT_SKIN_ID;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && SKINS[raw]) return raw;
  } catch (_err) {
    // localStorage may be unavailable (private mode, SSR); fall through
  }
  return DEFAULT_SKIN_ID;
}

function publishSkinToWindow(skinId, vars) {
  if (typeof window === 'undefined') return;
  window.LD = window.LD || {};
  window.LD.Theme = { skinId, vars };
  try {
    window.dispatchEvent(new CustomEvent('ld:skin-change', { detail: { skinId, vars } }));
  } catch (_err) {
    // CustomEvent may not be supported in some test environments; ignore
  }
}

export function SkinProvider({ children }) {
  const [skinId, setSkinIdState] = useState(() => readStoredSkinId());

  const skin = SKINS[skinId] || SKINS[DEFAULT_SKIN_ID];

  // Publish initial skin to window/legacy renderer on mount.
  useEffect(() => {
    publishSkinToWindow(skin.id, skin.vars);
  }, [skin]);

  const setSkin = useCallback((id) => {
    if (!SKINS[id]) {
      console.warn(`[SkinProvider] Unknown skin id: ${id}`);
      return;
    }
    setSkinIdState(id);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, id);
      }
    } catch (_err) {
      // ignore storage errors
    }
    publishSkinToWindow(id, SKINS[id].vars);
  }, []);

  const value = useMemo(() => ({ skin, skinId: skin.id, setSkin }), [skin, setSkin]);

  return (
    <SkinContext.Provider value={value}>
      <div style={skin.vars}>{children}</div>
    </SkinContext.Provider>
  );
}

export function useSkin() {
  const ctx = useContext(SkinContext);
  if (!ctx) {
    throw new Error('useSkin must be used within a <SkinProvider>');
  }
  return ctx;
}

export default SkinProvider;

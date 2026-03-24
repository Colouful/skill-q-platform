"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { applyFontScaleToDocument, FONT_SCALE_STORAGE_KEY, isFontScaleId } from "./font-scale";
import type { FontScaleId } from "./types";

type FontScaleContextValue = {
  fontScaleId: FontScaleId;
  setFontScaleId: (id: FontScaleId) => void;
  mounted: boolean;
};

const FontScaleContext = createContext<FontScaleContextValue | null>(null);

export function FontScaleProvider({ children }: { children: React.ReactNode }) {
  const [fontScaleId, setFontScaleIdState] = useState<FontScaleId>("normal");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let initial: FontScaleId = "normal";
    try {
      const raw = localStorage.getItem(FONT_SCALE_STORAGE_KEY);
      if (isFontScaleId(raw)) initial = raw;
    } catch {
      /* ignore */
    }
    applyFontScaleToDocument(initial);
    setFontScaleIdState(initial);
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== FONT_SCALE_STORAGE_KEY || !isFontScaleId(e.newValue)) return;
      applyFontScaleToDocument(e.newValue);
      setFontScaleIdState(e.newValue);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setFontScaleId = useCallback((id: FontScaleId) => {
    if (id === fontScaleId) return;
    applyFontScaleToDocument(id);
    setFontScaleIdState(id);
    try {
      localStorage.setItem(FONT_SCALE_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, [fontScaleId]);

  const value = useMemo(
    () => ({
      fontScaleId,
      setFontScaleId,
      mounted,
    }),
    [fontScaleId, setFontScaleId, mounted],
  );

  return <FontScaleContext.Provider value={value}>{children}</FontScaleContext.Provider>;
}

export function useFontScale(): FontScaleContextValue {
  const ctx = useContext(FontScaleContext);
  if (!ctx) {
    throw new Error("useFontScale must be used within FontScaleProvider");
  }
  return ctx;
}

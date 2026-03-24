"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { applyHubThemeToDocument } from "./apply-theme";
import { THEME_ORDER, THEME_STORAGE_KEY, isThemeId, themes } from "./index";
import type { HubThemeDefinition, ThemeId } from "./types";

type ThemeContextValue = {
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  current: HubThemeDefinition;
  list: HubThemeDefinition[];
  isTransitioning: boolean;
  mounted: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>("pixel");
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setMounted(true);
    let initial: ThemeId = "pixel";
    try {
      const raw = localStorage.getItem(THEME_STORAGE_KEY);
      if (isThemeId(raw)) initial = raw;
    } catch {
      /* ignore */
    }
    applyHubThemeToDocument(initial, { useViewTransition: false });
    setThemeIdState(initial);
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== THEME_STORAGE_KEY || !isThemeId(e.newValue)) return;
      applyHubThemeToDocument(e.newValue, { useViewTransition: false });
      setThemeIdState(e.newValue);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setThemeId = useCallback((id: ThemeId) => {
    if (id === themeId) return;
    setIsTransitioning(true);
    applyHubThemeToDocument(id, { useViewTransition: true });
    setThemeIdState(id);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
    window.setTimeout(() => setIsTransitioning(false), 320);
  }, [themeId]);

  const list = useMemo(
    () => THEME_ORDER.map((id) => themes[id] as HubThemeDefinition),
    [],
  );

  const current = themes[themeId] as HubThemeDefinition;

  const value = useMemo(
    () => ({
      themeId,
      setThemeId,
      current,
      list,
      isTransitioning,
      mounted,
    }),
    [themeId, setThemeId, current, list, isTransitioning, mounted],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

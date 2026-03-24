"use client";

import { ThemeTransitionOverlay } from "@/components/theme/theme-transition-overlay";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/themes/ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <ThemeTransitionOverlay />
      <Toaster richColors position="top-center" />
    </ThemeProvider>
  );
}

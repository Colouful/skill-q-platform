"use client";

import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";
import { ThemeTransitionOverlay } from "@/components/theme/theme-transition-overlay";
import { Toaster } from "@/components/ui/sonner";
import { FontScaleProvider } from "@/themes/FontScaleProvider";
import { ThemeProvider } from "@/themes/ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <FontScaleProvider>
        <ServiceWorkerRegistrar />
        {children}
        <ThemeTransitionOverlay />
        <Toaster richColors position="top-center" />
      </FontScaleProvider>
    </ThemeProvider>
  );
}

import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Providers } from "@/components/providers";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const devServiceWorkerCleanupScript = `
(() => {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => Promise.allSettled(registrations.map((registration) => registration.unregister())))
    .catch(() => {});
  if (!("caches" in window)) return;
  caches
    .keys()
    .then((keys) =>
      Promise.allSettled(
        keys
          .filter((key) => key.startsWith("xiaqiu-hub-pwa-"))
          .map((key) => caches.delete(key)),
      ),
    )
    .catch(() => {});
})();
`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "虾球Hub",
    template: "%s · 虾球Hub",
  },
  description:
    "Skill 与 Rule 的发现与分享：榜单检索、评测、版本与 ZIP 工具链，面向 Agent 的像素风 Hub。",
  keywords: [
    "Agent Skill",
    "Agent Rule",
    "OpenClaw",
    "Skills",
    "Rules",
    "虾球Hub",
    "像素风",
  ],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "/",
    siteName: "虾球Hub",
    title: "虾球Hub",
    description:
      "Skill 与 Rule 的发现与分享：榜单、评测、版本管理与 ZIP 工具链，面向 Agent 的像素风 Hub。",
    images: [{ url: "/patterns/sketch-paper.svg", width: 1200, height: 630, alt: "虾球Hub" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "虾球Hub",
    description:
      "Skill 与 Rule 的发现与分享：榜单、评测、版本管理与 ZIP 工具链，面向 Agent 的像素风 Hub。",
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "虾球Hub",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      data-theme="pixel"
      suppressHydrationWarning
    >
      <head>
        {process.env.NODE_ENV !== "production" ? (
          <Script id="dev-service-worker-cleanup" strategy="beforeInteractive">
            {devServiceWorkerCleanupScript}
          </Script>
        ) : null}
      </head>
      <body suppressHydrationWarning className="min-h-0 overflow-hidden antialiased">
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:border-4 focus:border-[var(--pixel-border)] focus:bg-[var(--pixel-yellow)] focus:px-3 focus:py-2 focus:font-[family-name:var(--font-pixel-body)] focus:text-[var(--pixel-fg)]"
          >
            跳到主内容
          </a>
          <div className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden">
            <SiteHeader />
            <main
              id="main-content"
              tabIndex={-1}
              className="mx-auto flex w-full min-h-0 flex-1 flex-col overflow-y-auto bg-[var(--pixel-bg)] px-3 py-6 sm:px-4 lg:px-5 outline-none"
            >
              {children}
            </main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}

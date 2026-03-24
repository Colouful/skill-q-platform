import { NotificationsPageClient } from "@/components/notifications/notifications-page-client";

export const dynamic = "force-dynamic";

export default function NotificationsPage() {
  return (
    <div className="mx-auto w-full max-w-screen-md px-3 py-8 sm:px-4">
      <h1 className="mb-4 font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
        通知
      </h1>
      <NotificationsPageClient />
    </div>
  );
}

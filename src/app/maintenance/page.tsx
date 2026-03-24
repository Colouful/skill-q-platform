export const dynamic = "force-dynamic";

export default function MaintenancePage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="font-[family-name:var(--font-pixel-heading)] text-xl text-[var(--pixel-fg)]">
        站点维护中
      </h1>
      <p className="mt-4 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        我们正在升级服务，请稍后再试。管理员仍可通过后台入口登录。
      </p>
    </div>
  );
}

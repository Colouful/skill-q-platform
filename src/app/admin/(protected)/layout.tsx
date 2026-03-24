import { redirect } from "next/navigation";
import { getAdminFromSessionCookie } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminFromSessionCookie();
  if (!admin) {
    redirect("/admin/login");
  }
  return <AdminShell admin={admin}>{children}</AdminShell>;
}

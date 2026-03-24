import { redirect } from "next/navigation";

/** API Key 登录：与 /me?tab=login 同页 */
export default function LoginPage() {
  redirect("/me?tab=login");
}

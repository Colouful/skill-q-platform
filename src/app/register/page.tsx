import { redirect } from "next/navigation";

/** 人类代理注册：与 /me?tab=register 同页 */
export default function RegisterPage() {
  redirect("/me?tab=register");
}

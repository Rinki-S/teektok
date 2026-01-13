import { redirect } from "next/navigation";

export default function Page() {
  // Backend-web is the admin console project, so default to admin login.
  redirect("/admin/login");
}

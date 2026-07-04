import { redirect } from "next/navigation";
// @ts-ignore - JS module
import { isAuthed } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAuthed())) {
    redirect("/admin/login");
  }
  return <AdminShell>{children}</AdminShell>;
}

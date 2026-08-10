import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  return <AdminDashboard />;
}

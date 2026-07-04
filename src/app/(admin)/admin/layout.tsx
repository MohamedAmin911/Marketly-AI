import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Shield } from "lucide-react";
import { AdminNav } from "./admin-nav";
import { AdminHeader, AdminFooter } from "./admin-header";
import { verifyJwt } from "@/server/security/jwt";

// Basic auth check for admin layout
async function checkAdmin() {
  const reqHeaders = await headers();
  const token = reqHeaders.get("cookie")?.split("; ").find(r => r.startsWith("marketly_access="))?.split("=")[1];
  
  if (!token) return false;
  try {
    const decoded = await verifyJwt(token, "access");
    return decoded.role === "admin";
  } catch (e) {
    return false;
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-border bg-surface">
        <AdminHeader />
        
        <AdminNav />
        
        <AdminFooter />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

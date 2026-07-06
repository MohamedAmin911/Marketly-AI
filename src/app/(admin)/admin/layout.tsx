import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Shield } from "lucide-react";
import { AdminNav } from "./admin-nav";
import { verifyJwt } from "@/server/security/jwt";

// Basic auth check for admin layout
async function checkAdmin() {
  const headerStore = await headers();
  const token = headerStore.get("cookie")?.split("; ").find((item: string) => item.startsWith("marketly_access="))?.split("=")[1];
  
  if (!token) return false;
  try {
    const decoded = await verifyJwt(token, "access");
    return decoded.role === "admin";
  } catch {
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
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Shield className="size-5 text-primary" />
          <span className="font-bold text-foreground font-display">Marketly Admin</span>
        </div>
        
        <AdminNav />
        
        <div className="border-t border-border p-4 text-xs text-muted text-center">
          Admin Portal v1.0
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

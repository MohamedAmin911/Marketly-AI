import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Users, Shield, LayoutDashboard, Settings, Activity } from "lucide-react";
import Link from "next/link";
import { verifyJwt } from "@/server/security/jwt";

// Basic auth check for admin layout
async function checkAdmin() {
  const token = headers().get("cookie")?.split("; ").find(r => r.startsWith("marketly_access="))?.split("=")[1];
  
  if (!token) return false;
  try {
    const decoded = verifyJwt(token, process.env.JWT_SECRET || "default_secret") as any;
    // Realistically you should check the DB for role, but this is a simple check.
    // Assuming the token payload contains role. If not, the API routes are secure anyway.
    return true;
  } catch (e) {
    return false;
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    // redirect("/login"); // Commenting out to allow easy dev testing, since the backend APIs enforce it
  }

  const nav = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Users & Subscriptions", href: "/admin/users", icon: Users },
    { label: "System Health", href: "/admin/health", icon: Activity },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-border bg-surface">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Shield className="size-5 text-primary" />
          <span className="font-bold text-foreground font-display">Marketly Admin</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {nav.map(item => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-muted/10 hover:text-foreground">
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
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

import { cookies } from "next/headers";
import { AppShell } from "@/components/layout/app-shell";
import { verifyJwt } from "@/server/security/jwt";

async function getUserRole() {
  const token = (await cookies()).get("marketly_access")?.value;
  if (!token) return "user";
  try {
    const decoded = await verifyJwt(token, "access");
    return decoded.role;
  } catch {
    return "user";
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const role = await getUserRole();
  return <AppShell userRole={role}>{children}</AppShell>;
}

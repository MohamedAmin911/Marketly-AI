"use client";

import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

async function fetchUsers() {
  const res = await fetch("/api/admin/users", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load");
  const data = await res.json();
  return data.data?.users ?? data.users ?? [];
}

export default function AdminUsersPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: fetchUsers,
  });

  if (isLoading) return <div className="p-8 text-muted">Loading users...</div>;

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-display font-bold text-foreground">Users & Subscriptions</h1>
        <p className="text-muted mt-1">Manage platform users and view subscription status.</p>
      </header>

      <div className="rounded-md border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Monthly Credits</TableHead>
              <TableHead>Purchased</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user: any) => (
              <TableRow key={user._id}>
                <TableCell className="font-medium text-foreground">{user.username}</TableCell>
                <TableCell className="text-muted">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                </TableCell>
                <TableCell>
                  <span className="capitalize text-primary font-medium">{user.subscription?.plan || "free"}</span>
                </TableCell>
                <TableCell className="text-muted">
                  {user.subscription?.monthlyCreditsRemaining ?? 0} / {user.subscription?.monthlyCredits ?? 0}
                </TableCell>
                <TableCell className="text-muted">
                  {user.subscription?.purchasedCredits ?? 0}
                </TableCell>
                <TableCell className="text-muted text-sm">
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
            {!users?.length && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Ban, CheckCircle, Trash2, ChevronDown, ChevronUp, Search, Loader2, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUiStore } from "@/store/ui-store";

import { useTranslation } from "@/lib/i18n/useTranslation";

async function fetchUsers(search = ""): Promise<AdminUser[]> {
  const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load");
  const data = await res.json();
  return data.data?.users ?? data.users ?? [];
}

type AdminUserAction = "block" | "unblock" | "reset-strikes" | "delete";

type AdminUser = {
  _id?: string;
  createdAt?: string;
  email: string;
  emailVerified?: boolean;
  fullName: string;
  id?: string;
  lastActiveAt?: string;
  moderation?: {
    aiBlockedUntil?: string | null;
    aiStrikes?: number;
    lastViolationAt?: string | null;
    lastViolationFeature?: string | null;
    lastViolationReason?: string | null;
  };
  role: string;
  status: string;
  subscription?: {
    monthlyCredits?: number;
    monthlyCreditsRemaining?: number;
    plan?: string;
    purchasedCredits?: number;
    status?: string;
  };
  usage?: {
    aiRequests?: number;
    analyticsRuns?: number;
    growthRuns?: number;
    projectsCreated?: number;
  };
};

async function userAction({ id, action }: { id: string; action: AdminUserAction }) {
  const res = await fetch(`/api/admin/users/${id}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error("Action failed");
  return res.json();
}

async function contactUser({ id, subject, message }: { id: string; subject: string; message: string }) {
  const res = await fetch(`/api/admin/users/${id}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject, message }),
  });
  if (!res.ok) throw new Error("Failed to send email");
  return res.json();
}

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const queryClient = useQueryClient();

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ["adminUsers", search],
    queryFn: () => fetchUsers(search),
  });

  const addToast = useUiStore((state) => state.addToast);

  const actionMutation = useMutation({
    mutationFn: userAction,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      addToast({
        title: "Action Successful",
        description: `Successfully performed '${variables.action}' on user.`,
        type: "success"
      });
    },
    onError: (error) => {
      addToast({
        title: "Action Failed",
        description: error.message,
        type: "error"
      });
    }
  });

  const contactMutation = useMutation({
    mutationFn: contactUser,
    onSuccess: () => {
      setEmailStatus("success");
      addToast({ title: "Email Sent", description: "Successfully sent email to the user.", type: "success" });
      setTimeout(() => {
        setContactModalOpen(false);
        setEmailStatus("idle");
        setEmailSubject("");
        setEmailMessage("");
      }, 2000);
    },
    onError: (error) => {
      setEmailStatus("error");
      addToast({ title: "Email Failed", description: error.message, type: "error" });
    },
  });

  const handleAction = (id: string, action: AdminUserAction) => {
    if (action === "delete" && !confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    actionMutation.mutate({ id, action });
  };

  const openContact = (user: AdminUser) => {
    setSelectedUser(user);
    setContactModalOpen(true);
    setEmailStatus("idle");
  };

  const handleSendEmail = () => {
    if (!emailSubject || !emailMessage || !selectedUser) return;
    const selectedUserId = selectedUser.id ?? selectedUser._id;
    if (!selectedUserId) return;
    setEmailStatus("loading");
    contactMutation.mutate({ id: selectedUserId, subject: emailSubject, message: emailMessage });
  };

  return (
    <div className="p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">{t("admin.usersTitle")}</h1>
          <p className="text-muted mt-1">{t("admin.usersDesc")}</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
          <Input 
            placeholder="Search email or name..." 
            className="pl-9 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && refetch()}
          />
        </div>
      </header>

      <div className="rounded-md border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Strikes</TableHead>
              <TableHead>AI Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={9} className="h-24 text-center text-muted">Loading...</TableCell></TableRow>
            )}
            {!isLoading && users?.map((user: AdminUser) => {
              const id = user.id ?? user._id;
              if (!id) return null;
              const isExpanded = expandedUser === id;
              const strikeCount = user.moderation?.aiStrikes ?? 0;
              const blockedUntil = user.moderation?.aiBlockedUntil ? new Date(user.moderation.aiBlockedUntil) : null;
              const isTemporarilyBlocked = Boolean(blockedUntil && blockedUntil.getTime() > Date.now());
              const isSuspended = user.status === "suspended";

              return (
                <React.Fragment key={id}>
                  <TableRow className={isSuspended ? "opacity-75 bg-destructive/5" : ""}>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="size-6" onClick={() => setExpandedUser(isExpanded ? null : id)}>
                        {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{user.fullName}</TableCell>
                    <TableCell className="text-muted">{user.email}</TableCell>
                    <TableCell>
                      <Badge tone={isSuspended ? "danger" : "default"}>{user.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge tone={strikeCount > 0 ? "danger" : "default"}>{strikeCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge tone={isSuspended ? "danger" : isTemporarilyBlocked ? "warning" : "success"}>
                        {isSuspended ? "Suspended" : isTemporarilyBlocked ? "Blocked" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge tone={user.role === "admin" ? "success" : "default"}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-primary font-medium">{user.subscription?.plan || "free"}</span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {user.role !== "admin" && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => openContact(user)} title="Contact User">
                            <Mail className="size-4 text-blue-500" />
                          </Button>
                          {isSuspended ? (
                            <Button variant="ghost" size="icon" onClick={() => handleAction(id, "unblock")} title="Restore account and reset strikes" disabled={actionMutation.isPending && actionMutation.variables?.id === id}>
                              {actionMutation.isPending && actionMutation.variables?.id === id && actionMutation.variables?.action === "unblock" ? <Loader2 className="size-4 animate-spin text-green-500" /> : <CheckCircle className="size-4 text-green-500 hover:scale-110 transition-transform" />}
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon" onClick={() => handleAction(id, "block")} title="Block User" disabled={actionMutation.isPending && actionMutation.variables?.id === id}>
                              {actionMutation.isPending && actionMutation.variables?.id === id && actionMutation.variables?.action === "block" ? <Loader2 className="size-4 animate-spin text-orange-500" /> : <Ban className="size-4 text-orange-500 hover:scale-110 transition-transform" />}
                            </Button>
                          )}
                          {strikeCount > 0 ? (
                            <Button variant="ghost" size="icon" onClick={() => handleAction(id, "reset-strikes")} title="Reset AI strikes" disabled={actionMutation.isPending && actionMutation.variables?.id === id}>
                              {actionMutation.isPending && actionMutation.variables?.id === id && actionMutation.variables?.action === "reset-strikes" ? <Loader2 className="size-4 animate-spin text-cyan-500" /> : <RotateCcw className="size-4 text-cyan-500 hover:scale-110 transition-transform" />}
                            </Button>
                          ) : null}
                          <Button variant="ghost" size="icon" onClick={() => handleAction(id, "delete")} title="Delete User" disabled={actionMutation.isPending && actionMutation.variables?.id === id}>
                            {actionMutation.isPending && actionMutation.variables?.id === id && actionMutation.variables?.action === "delete" ? <Loader2 className="size-4 animate-spin text-red-500" /> : <Trash2 className="size-4 text-red-500 hover:scale-110 transition-transform" />}
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow className="bg-card/50">
                      <TableCell colSpan={9} className="p-0 border-b">
                        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-top-2">
                          
                          <div className="space-y-3">
                            <h4 className="font-semibold text-sm">Generation Insights</h4>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between"><span className="text-muted">AI Requests:</span> <span className="font-medium">{user.usage?.aiRequests || 0}</span></div>
                              <div className="flex justify-between"><span className="text-muted">Growth Runs:</span> <span className="font-medium">{user.usage?.growthRuns || 0}</span></div>
                              <div className="flex justify-between"><span className="text-muted">Analytics Runs:</span> <span className="font-medium">{user.usage?.analyticsRuns || 0}</span></div>
                              <div className="flex justify-between"><span className="text-muted">Projects Created:</span> <span className="font-medium">{user.usage?.projectsCreated || 0}</span></div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-semibold text-sm">Subscription Details</h4>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between"><span className="text-muted">Status:</span> <span className="font-medium capitalize">{user.subscription?.status || "Free"}</span></div>
                              <div className="flex justify-between"><span className="text-muted">Monthly Credits:</span> <span className="font-medium">{user.subscription?.monthlyCreditsRemaining || 0} / {user.subscription?.monthlyCredits || 0}</span></div>
                              <div className="flex justify-between"><span className="text-muted">Purchased Credits:</span> <span className="font-medium">{user.subscription?.purchasedCredits || 0}</span></div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-semibold text-sm">AI Moderation</h4>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between"><span className="text-muted">Strike Count:</span> <span className="font-medium">{strikeCount}</span></div>
                              <div className="flex justify-between"><span className="text-muted">Suspension:</span> <span className="font-medium capitalize">{isSuspended ? "Suspended" : isTemporarilyBlocked ? "Temporary block" : "None"}</span></div>
                              <div className="flex justify-between"><span className="text-muted">Last Violation:</span> <span className="font-medium">{user.moderation?.lastViolationAt ? new Date(user.moderation.lastViolationAt).toLocaleString() : "None"}</span></div>
                              <div className="flex justify-between"><span className="text-muted">AI Feature:</span> <span className="font-medium">{user.moderation?.lastViolationFeature || "None"}</span></div>
                              <div><span className="text-muted">Reason:</span> <p className="mt-1 text-foreground">{user.moderation?.lastViolationReason || "None"}</p></div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-semibold text-sm">User Details</h4>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between"><span className="text-muted">Joined:</span> <span className="font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}</span></div>
                              <div className="flex justify-between"><span className="text-muted">Last Active:</span> <span className="font-medium">{user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : "Never"}</span></div>
                              <div className="flex justify-between"><span className="text-muted">Email Verified:</span> <span className="font-medium">{user.emailVerified ? "Yes" : "No"}</span></div>
                            </div>
                          </div>

                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
            {!isLoading && !users?.length && (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent className="sm:max-w-md bg-surface">
          <DialogHeader>
            <DialogTitle>Contact User</DialogTitle>
            <DialogDescription>
              Send an email directly to {selectedUser?.fullName} ({selectedUser?.email}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input 
                id="subject" 
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Message regarding your account" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea 
                id="message" 
                rows={6}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Hello..." 
              />
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4 pt-4 border-t border-border">
            {emailStatus === "success" ? (
              <span className="text-green-500 flex items-center text-sm font-medium mr-auto mb-2 sm:mb-0"><CheckCircle className="size-4 mr-2"/> Sent Successfully</span>
            ) : emailStatus === "error" ? (
              <span className="text-red-500 flex items-center text-sm font-medium mr-auto mb-2 sm:mb-0">Failed to send</span>
            ) : null}
            <Button variant="secondary" onClick={() => setContactModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSendEmail} disabled={emailStatus === "loading" || !emailSubject || !emailMessage}>
              {emailStatus === "loading" ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

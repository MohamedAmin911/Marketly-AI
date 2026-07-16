"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tag, Plus, Loader2, MoreHorizontal, PowerOff, Power } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUiStore } from "@/store/ui-store";

import { useTranslation } from "@/lib/i18n/useTranslation";

async function fetchPromoCodes() {
  const res = await fetch("/api/admin/promo");
  if (!res.ok) throw new Error("Failed to fetch promo codes");
  return res.json();
}

async function createPromoCode(params: any) {
  const res = await fetch("/api/admin/promo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to create promo code");
  return res.json();
}

async function updatePromoCodeStatus({ id, active }: { id: string; active: boolean }) {
  const res = await fetch(`/api/admin/promo/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ active }),
  });
  if (!res.ok) throw new Error("Failed to update promo code");
  return res.json();
}

export default function AdminPromoPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [promoPercent, setPromoPercent] = useState("20");
  const [promoDuration, setPromoDuration] = useState("once");
  const [promoCodeName, setPromoCodeName] = useState("");
  const [createdPromo, setCreatedPromo] = useState<any>(null);

  const addToast = useUiStore((state) => state.addToast);

  const { data, isLoading } = useQuery({
    queryKey: ["promo-codes"],
    queryFn: fetchPromoCodes,
  });

  const promoCodes = data?.data?.promoCodes || [];

  const promoMutation = useMutation({
    mutationFn: createPromoCode,
    onSuccess: (data) => {
      setCreatedPromo(data.data.promoCode);
      addToast({ title: "Promo Code Created", description: "The promotion code is now live.", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
    },
    onError: (err) => {
      addToast({ title: "Failed", description: err.message, type: "error" });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: updatePromoCodeStatus,
    onSuccess: (data) => {
      addToast({ title: "Status Updated", description: "The promotion code status has been updated.", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
    },
    onError: (err) => {
      addToast({ title: "Failed", description: err.message, type: "error" });
    }
  });

  const handleCreatePromo = () => {
    promoMutation.mutate({
      percentOff: Number(promoPercent),
      duration: promoDuration,
      code: promoCodeName || undefined,
    });
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <header>
        <h1 className="text-3xl font-display font-bold text-foreground">{t("admin.promoTitle")}</h1>
        <p className="text-muted mt-1">{t("admin.promoDesc")}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Tag className="size-5 text-primary"/> Generate Promo Code</CardTitle>
          <CardDescription>Create a Stripe promotion code to give users discounted access to premium plans.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Discount %</Label>
              <Input type="number" value={promoPercent} onChange={e => setPromoPercent(e.target.value)} min="1" max="100" />
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={promoDuration} onChange={e => setPromoDuration(e.target.value)}>
                <option value="once">Once</option>
                <option value="repeating">Repeating</option>
                <option value="forever">Forever</option>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Custom Code (Optional)</Label>
            <Input placeholder="e.g. SUMMER2026" value={promoCodeName} onChange={e => setPromoCodeName(e.target.value.toUpperCase())} />
            <p className="text-xs text-muted">Leave empty to auto-generate a secure random code.</p>
          </div>
          
          <Button className="w-full mt-4" onClick={handleCreatePromo} disabled={promoMutation.isPending}>
            {promoMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Plus className="mr-2 size-4" />}
            Generate Code
          </Button>

          {createdPromo && (
            <div className="mt-4 p-6 rounded-lg bg-primary/10 border border-primary/20 text-center animate-in zoom-in-95">
              <p className="text-sm text-muted mb-2">Code is Live & Ready to Share!</p>
              <p className="text-4xl font-bold font-mono tracking-wider text-primary">{createdPromo.code}</p>
              <p className="text-sm font-medium mt-3">{createdPromo.percentOff}% off • {createdPromo.active ? 'Status: Active' : 'Status: Inactive'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Created Promo Codes</CardTitle>
          <CardDescription>Manage and monitor your existing promotion codes.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted" />
            </div>
          ) : promoCodes.length === 0 ? (
            <div className="text-center py-8 text-muted">
              No promo codes found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Redeemed</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((promo: any) => (
                  <TableRow key={promo.id} className={!promo.active ? "opacity-60" : ""}>
                    <TableCell className="font-mono font-medium">{promo.code}</TableCell>
                    <TableCell>{promo.percentOff}% OFF</TableCell>
                    <TableCell>
                      <Badge variant={promo.active ? "default" : "secondary"} className={promo.active ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : ""}>
                        {promo.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {promo.timesRedeemed} {promo.maxRedemptions ? `/ ${promo.maxRedemptions}` : ""}
                    </TableCell>
                    <TableCell className="text-muted text-sm">
                      {new Date(promo.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => updateStatusMutation.mutate({ id: promo.id, active: !promo.active })}
                            className={promo.active ? "text-red-500" : "text-green-500"}
                          >
                            {promo.active ? (
                              <><PowerOff className="mr-2 size-4" /> Deactivate Code</>
                            ) : (
                              <><Power className="mr-2 size-4" /> Reactivate Code</>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

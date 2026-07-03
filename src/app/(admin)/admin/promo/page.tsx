"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tag, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useUiStore } from "@/store/ui-store";

async function createPromoCode(params: any) {
  const res = await fetch("/api/admin/promo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to create promo code");
  return res.json();
}

export default function AdminPromoPage() {
  const [promoPercent, setPromoPercent] = useState("20");
  const [promoDuration, setPromoDuration] = useState("once");
  const [promoCodeName, setPromoCodeName] = useState("");
  const [createdPromo, setCreatedPromo] = useState<any>(null);

  const addToast = useUiStore((state) => state.addToast);

  const promoMutation = useMutation({
    mutationFn: createPromoCode,
    onSuccess: (data) => {
      setCreatedPromo(data.data.promoCode);
      addToast({ title: "Promo Code Created", description: "The promotion code is now live.", type: "success" });
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
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <header>
        <h1 className="text-3xl font-display font-bold text-foreground">Promo Codes</h1>
        <p className="text-muted mt-1">Generate and manage promotional discounts for Marketing campaigns.</p>
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
    </div>
  );
}

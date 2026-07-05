"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { LandingNavbar } from "@/features/landing/components/navbar";
import { LandingFooter } from "@/features/landing/components/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { useUiStore } from "@/store/ui-store";

export function ContactClient({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const addToast = useUiStore((state) => state.addToast);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, subject, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      addToast({ title: "Success", description: t("contact.success"), type: "success" });
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err: any) {
      addToast({ title: "Error", description: err.message || t("contact.error"), type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingNavbar isAuthenticated={isAuthenticated} />
      
      <main className="flex-1 flex items-center justify-center py-24 px-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <Card className="w-full max-w-lg glass-panel relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <CardHeader className="flex flex-col items-center justify-center text-center space-y-2">
            <CardTitle className="text-3xl font-display font-bold">{t("contact.title")}</CardTitle>
            <CardDescription className="text-base mt-0">{t("contact.desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">{t("contact.email")}</Label>
                <Input 
                  id="email"
                  type="email" 
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-surface-container"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">{t("contact.subject")}</Label>
                <Input 
                  id="subject"
                  type="text" 
                  placeholder="How can we help you?"
                  required
                  minLength={3}
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="bg-surface-container"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">{t("contact.message")}</Label>
                <Textarea 
                  id="message"
                  placeholder="Write your message here..."
                  required
                  minLength={10}
                  rows={5}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="bg-surface-container resize-none"
                />
              </div>
              
              <Button type="submit" className="w-full h-12 text-lg shadow-glow" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 size-5 animate-spin" />
                ) : (
                  <Send className="mr-2 size-5" />
                )}
                {isLoading ? t("contact.sending") : t("contact.submit")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      
      <LandingFooter />
    </div>
  );
}

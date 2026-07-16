"use client";

import { useState, useEffect } from "react";
import { Flame, AlertCircle, Download, Copy, Check, Zap } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchPanel } from "./search-panel";
import { LoadingState } from "./loading-state";
import { EmptyState } from "./empty-state";
import { ResultsDashboard } from "./results-dashboard";
import { generateViralEngine } from "@/services/viralEngine";
import { ViralEngineRequest, ViralEngineResponse } from "@/types/viral-engine";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function ViralEngineView() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [hasSearched, setHasSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  const mutation = useMutation<ViralEngineResponse, Error, ViralEngineRequest>({
    mutationFn: (data) => generateViralEngine(data),
    onSuccess: (data) => {
      setHasSearched(true);
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-generations"] });
      queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
  });

  const handleSearch = (data: ViralEngineRequest) => {
    mutation.mutate(data);
  };

  const activeData = mutation.data;

  const handleCopyEntire = async () => {
    if (!activeData?.viralEngine) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(activeData.viralEngine, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownloadJson = () => {
    if (!activeData?.viralEngine) return;
    const blob = new Blob([JSON.stringify(activeData.viralEngine, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "viral-engine.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <PageShell 
      title={
        <div className="flex items-center gap-3">
          {t("viralEngine.title")}
          <Badge tone="success" className="font-normal border-primary/20 bg-primary/10 text-primary">
            <Zap className="size-3.5 me-1 inline-block" /> 50 Credits/Generation
          </Badge>
        </div>
      }
    >
      <div className="space-y-8">
        <header className="mb-10 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
         
            <p className="mt-3 max-w-2xl text-lg text-muted">
              {t("viralEngine.description")}
            </p>
          </div>
          
          {hasSearched && activeData?.viralEngine && !mutation.isPending && (
            <div className="flex gap-2">
              <Button onClick={handleCopyEntire} variant="secondary" className="gap-2">
                {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                {copied ? t("viralEngine.general.copied") : t("viralEngine.copyEntire")}
              </Button>
              <Button onClick={handleDownloadJson} variant="secondary" className="gap-2">
                <Download className="size-4" />
                {t("viralEngine.downloadJson")}
              </Button>
            </div>
          )}
        </header>

        <SearchPanel onSubmit={handleSearch} isLoading={mutation.isPending} />

        {mutation.isPending && <LoadingState />}

        {mutation.isError && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="glass-panel p-8 rounded-2xl max-w-md border border-destructive/20 bg-destructive/5 backdrop-blur-sm">
              <AlertCircle className="size-12 text-destructive mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Unable to generate Viral Engine</h3>
              <p className="text-muted mb-6">
                {mutation.error?.message || "Please try again."}
              </p>
              <Button onClick={() => mutation.reset()} variant="secondary" className="w-full">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {!mutation.isPending && !mutation.isError && activeData && (
          <ResultsDashboard data={activeData} />
        )}

        {!hasSearched && !mutation.isPending && !mutation.isError && <EmptyState />}
      </div>
    </PageShell>
  );
}

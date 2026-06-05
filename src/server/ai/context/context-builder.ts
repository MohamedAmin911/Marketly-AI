import type { AuthContext } from "@/server/security/auth-guard";
import type { BrandContext, WorkflowContext } from "@/server/ai/types";
import { buildMemoryContext } from "@/server/ai/memory/memory-builder";

export async function buildWorkflowContext(auth: AuthContext, brandId?: string): Promise<WorkflowContext> {
  const memory = await buildMemoryContext(auth.user.sub, brandId);
  const brand = await buildBrandContext(auth.user.tenantId, brandId, memory.brandIdentity);

  return {
    brand,
    memory,
    requestId: crypto.randomUUID(),
    tenantId: auth.user.tenantId,
    userId: auth.user.sub,
  };
}

async function buildBrandContext(tenantId: string, brandId?: string, memoryBrand?: Partial<BrandContext> & { positioning?: string }): Promise<BrandContext> {
  return {
    forbiddenWords: memoryBrand?.forbiddenWords?.length ? memoryBrand.forbiddenWords : ["guaranteed", "risk-free", "best ever"],
    name: memoryBrand?.name ?? (brandId ? `Brand ${brandId.slice(0, 8)}` : `Marketly workspace ${tenantId}`),
    preferredCTAs: ["Start campaign", "Generate variants", "Export creative"],
    tone: memoryBrand?.tone ?? "confident, analytical, premium",
    visualStyle: memoryBrand?.visualStyle ?? "dark premium SaaS, precise layouts, conversion-focused visuals",
    voice: memoryBrand?.voice ?? memoryBrand?.positioning ?? "strategic, specific, direct",
  };
}

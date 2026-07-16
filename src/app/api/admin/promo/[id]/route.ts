import { createApiHandler } from "@/server/http/route-handler";
import { jsonSuccess } from "@/server/http/responses";
import { requireAuth, requireRole } from "@/server/security/auth-guard";
import { getStripe } from "@/server/services/billing/stripe.service";
import { parseJsonBody } from "@/server/http/validation";
import { z } from "zod";

const patchPromoSchema = z.object({
  active: z.boolean(),
});

export const PATCH = createApiHandler(
  async ({ meta, request, params }) => {
    const auth = await requireAuth(request);
    requireRole(auth, ["admin"]);

    const body = await parseJsonBody(request, patchPromoSchema);
    const promoId = (params as { id: string }).id;

    const promotionCode = await getStripe().promotionCodes.update(promoId, {
      active: body.active,
    });

    return jsonSuccess({
      promoCode: {
        id: promotionCode.id,
        code: promotionCode.code,
        percentOff: promotionCode.coupon.percent_off,
        active: promotionCode.active,
        maxRedemptions: promotionCode.max_redemptions,
        timesRedeemed: promotionCode.times_redeemed,
        createdAt: new Date(promotionCode.created * 1000).toISOString()
      }
    }, meta);
  }
);

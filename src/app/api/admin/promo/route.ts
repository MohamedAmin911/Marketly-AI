import { createApiHandler } from "@/server/http/route-handler";
import { jsonSuccess } from "@/server/http/responses";
import { requireAuth, requireRole } from "@/server/security/auth-guard";
import { stripe } from "@/server/services/billing/stripe.service";
import { parseJsonBody } from "@/server/http/validation";
import { z } from "zod";
import type Stripe from "stripe";

const promoSchema = z.object({
  percentOff: z.number().min(1).max(100),
  duration: z.enum(["once", "repeating", "forever"]),
  durationInMonths: z.number().optional(),
  maxRedemptions: z.number().optional(),
  code: z.string().min(3).max(20).optional(),
});

export const POST = createApiHandler(
  async ({ meta, request }) => {
    const auth = await requireAuth(request);
    requireRole(auth, ["admin"]);

    const body = await parseJsonBody(request, promoSchema);

    // 1. Create Coupon
    const couponParams: Stripe.CouponCreateParams = {
      percent_off: body.percentOff,
      duration: body.duration,
      name: `Admin Promo ${body.percentOff}% off`,
    };

    if (body.duration === "repeating" && body.durationInMonths) {
      couponParams.duration_in_months = body.durationInMonths;
    }
    
    if (body.maxRedemptions) {
      couponParams.max_redemptions = body.maxRedemptions;
    }

    const coupon = await stripe.coupons.create(couponParams);

    // 2. Create Promotion Code connected to Coupon
    const promoParams: Stripe.PromotionCodeCreateParams = {
      promotion: {
        coupon: coupon.id,
        type: "coupon",
      },
      active: true,
    };

    if (body.code) {
      promoParams.code = body.code.toUpperCase();
    }

    const promotionCode = await stripe.promotionCodes.create(promoParams);

    return jsonSuccess({
      promoCode: {
        id: promotionCode.id,
        code: promotionCode.code,
        percentOff: coupon.percent_off,
        active: promotionCode.active,
        maxRedemptions: promotionCode.max_redemptions,
        timesRedeemed: promotionCode.times_redeemed,
        createdAt: new Date(promotionCode.created * 1000).toISOString()
      }
    }, meta);
  }
);

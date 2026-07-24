import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/src/api/response";
import { assertMutationRequest } from "@/src/api/security";
import {
  PaymentRequestSchema,
  evaluatePayment,
} from "@/src/domain/payment-guard";
import { DEFAULT_PAYMENT_POLICY } from "@/src/payments/policy";

const BodySchema = z.object({
  request: PaymentRequestSchema,
  approvedHash: z.string().optional(),
  usedOrderIds: z.array(z.string()).default([]),
  usedIdempotencyKeys: z.array(z.string()).default([]),
  approvedRecipient: z.string().optional(),
  approvedAmount: z.string().optional(),
  approvedToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    assertMutationRequest(request);
    const body = BodySchema.parse(await request.json());
    return apiSuccess(
      evaluatePayment(body.request, DEFAULT_PAYMENT_POLICY, {
        approvedHash: body.approvedHash,
        usedOrderIds: new Set(body.usedOrderIds),
        usedIdempotencyKeys: new Set(body.usedIdempotencyKeys),
        approvedRecipient: body.approvedRecipient,
        approvedAmount: body.approvedAmount,
        approvedToken: body.approvedToken,
      }),
    );
  } catch (error) {
    return apiError(
      "PAYMENT_EVALUATION_FAILED",
      error instanceof Error ? error.message : "Payment evaluation failed.",
    );
  }
}

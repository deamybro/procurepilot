import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/src/api/response";
import { assertMutationRequest } from "@/src/api/security";
import { serverMockMerchant } from "@/src/payments/server-mock";

const BodySchema = z.object({
  orderId: z.string().min(3),
  recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  token: z.literal("USDC"),
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/),
  confirmed: z.literal(true),
});

export async function POST(request: NextRequest) {
  try {
    assertMutationRequest(request);
    const body = BodySchema.parse(await request.json());
    return apiSuccess(
      serverMockMerchant.createOrder({
        orderId: body.orderId,
        recipient: body.recipient,
        token: body.token,
        amount: body.amount,
      }),
      201,
    );
  } catch (error) {
    return apiError(
      "PAYMENT_CREATE_FAILED",
      error instanceof Error ? error.message : "Payment creation failed.",
    );
  }
}

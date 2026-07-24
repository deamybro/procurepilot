import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/src/api/response";
import { assertMutationRequest } from "@/src/api/security";
import { serverMockMerchant } from "@/src/payments/server-mock";

const BodySchema = z.object({
  paymentId: z.string().startsWith("sim_pay_"),
  confirmed: z.literal(true),
});

export async function POST(request: NextRequest) {
  try {
    assertMutationRequest(request);
    const { paymentId } = BodySchema.parse(await request.json());
    return apiSuccess(serverMockMerchant.transfer(paymentId));
  } catch (error) {
    return apiError(
      "TRANSFER_FAILED",
      error instanceof Error ? error.message : "Transfer failed.",
    );
  }
}

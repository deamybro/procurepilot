import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/src/api/response";
import { assertMutationRequest } from "@/src/api/security";
import { serverMockMerchant } from "@/src/payments/server-mock";

const BodySchema = z.object({ paymentId: z.string().startsWith("sim_pay_") });

export async function POST(request: NextRequest) {
  try {
    assertMutationRequest(request);
    const { paymentId } = BodySchema.parse(await request.json());
    return apiSuccess(serverMockMerchant.cancel(paymentId));
  } catch (error) {
    return apiError(
      "CANCEL_FAILED",
      error instanceof Error ? error.message : "Cancellation failed.",
    );
  }
}

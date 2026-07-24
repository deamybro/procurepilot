import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/src/api/response";
import { assertMutationRequest } from "@/src/api/security";
import { serverMockMerchant } from "@/src/payments/server-mock";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ paymentId: string }> },
) {
  try {
    assertMutationRequest(request);
    await request.json();
    const { paymentId } = await context.params;
    return apiSuccess(serverMockMerchant.cancel(paymentId));
  } catch (error) {
    return apiError(
      "CANCEL_FAILED",
      error instanceof Error ? error.message : "Cancellation failed.",
    );
  }
}

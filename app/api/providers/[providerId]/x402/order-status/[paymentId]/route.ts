import { apiError, apiSuccess } from "@/src/api/response";
import { serverMockMerchant } from "@/src/payments/server-mock";

export async function GET(
  _request: Request,
  context: { params: Promise<{ paymentId: string }> },
) {
  try {
    const { paymentId } = await context.params;
    return apiSuccess(serverMockMerchant.status(paymentId));
  } catch (error) {
    return apiError(
      "PAYMENT_NOT_FOUND",
      error instanceof Error ? error.message : "Payment not found.",
      404,
    );
  }
}

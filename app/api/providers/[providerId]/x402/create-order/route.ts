import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/src/api/response";
import { assertMutationRequest } from "@/src/api/security";
import { LocalProviderRegistry } from "@/src/providers/registry";
import { serverMockMerchant } from "@/src/payments/server-mock";

const BodySchema = z.object({
  orderId: z.string().min(3),
  token: z.literal("USDC"),
  amount: z.string(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ providerId: string }> },
) {
  try {
    assertMutationRequest(request);
    const body = BodySchema.parse(await request.json());
    const { providerId } = await context.params;
    const provider = await new LocalProviderRegistry().get(providerId);
    if (!provider) return apiError("PROVIDER_NOT_FOUND", "Provider not found.", 404);
    if (body.amount !== provider.basePrice) {
      return apiError("QUOTE_MISMATCH", "Order amount does not match the quote.");
    }
    return apiSuccess(
      serverMockMerchant.createOrder({
        orderId: body.orderId,
        recipient: provider.payoutAddress,
        token: body.token,
        amount: body.amount,
      }),
      201,
    );
  } catch (error) {
    return apiError(
      "ORDER_CREATE_FAILED",
      error instanceof Error ? error.message : "Order creation failed.",
    );
  }
}

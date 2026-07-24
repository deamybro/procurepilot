import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/src/api/response";
import { assertMutationRequest } from "@/src/api/security";
import { LocalProviderRegistry } from "@/src/providers/registry";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ providerId: string }> },
) {
  try {
    assertMutationRequest(request);
    await request.json();
    const { providerId } = await context.params;
    const provider = await new LocalProviderRegistry().get(providerId);
    if (!provider) {
      return apiError("PROVIDER_NOT_FOUND", "Provider was not found.", 404);
    }
    return apiSuccess({
      quoteId: `quote_${providerId}`,
      providerId,
      amount: provider.basePrice,
      token: "USDC",
      chain: "goat-testnet",
      recipient: provider.payoutAddress,
      expiresAt: new Date(Date.now() + 30 * 60 * 1_000).toISOString(),
      simulated: true,
    });
  } catch (error) {
    return apiError(
      "INVALID_QUOTE_REQUEST",
      error instanceof Error ? error.message : "Invalid quote request.",
    );
  }
}

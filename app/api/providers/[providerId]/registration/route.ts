import { apiError, apiSuccess } from "@/src/api/response";
import { LocalProviderRegistry } from "@/src/providers/registry";

export async function GET(
  _request: Request,
  context: { params: Promise<{ providerId: string }> },
) {
  const { providerId } = await context.params;
  const provider = await new LocalProviderRegistry().get(providerId);
  if (!provider) return apiError("PROVIDER_NOT_FOUND", "Provider not found.", 404);
  return apiSuccess({
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name: provider.name,
    description: provider.description,
    services: [
      {
        name: "HTTP",
        endpoint: `${provider.endpoint}/execute`,
        version: "1.0.0",
      },
    ],
    x402Support: false,
    active: provider.active,
    registrations: [],
    verificationStatus: provider.verificationStatus,
  });
}

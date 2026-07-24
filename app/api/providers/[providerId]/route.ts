import { apiError, apiSuccess } from "@/src/api/response";
import { LocalProviderRegistry } from "@/src/providers/registry";

export async function GET(
  _request: Request,
  context: { params: Promise<{ providerId: string }> },
) {
  const { providerId } = await context.params;
  const provider = await new LocalProviderRegistry().get(providerId);
  return provider
    ? apiSuccess(provider)
    : apiError("PROVIDER_NOT_FOUND", "Provider was not found.", 404, false);
}

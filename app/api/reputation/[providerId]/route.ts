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
    providerId,
    averageRating: provider.averageRating,
    completedJobs: provider.completedJobs,
    failedJobs: provider.failedJobs,
    source: "LOCAL",
    onChainVerified: false,
    feedback: [],
  });
}

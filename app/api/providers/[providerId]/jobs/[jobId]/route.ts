import { apiSuccess } from "@/src/api/response";

export async function GET(
  _request: Request,
  context: { params: Promise<{ providerId: string; jobId: string }> },
) {
  const { providerId, jobId } = await context.params;
  return apiSuccess({
    jobId,
    providerId,
    state: "COMPLETED",
    simulated: true,
    validation: "PASSED",
    transactionHash: null,
  });
}

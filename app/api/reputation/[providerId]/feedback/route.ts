import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/src/api/response";
import { assertMutationRequest } from "@/src/api/security";

const FeedbackSchema = z.object({
  taskId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1_000),
  confirmed: z.literal(true),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ providerId: string }> },
) {
  try {
    assertMutationRequest(request);
    const body = FeedbackSchema.parse(await request.json());
    const { providerId } = await context.params;
    return apiSuccess({
      feedbackId: `local_feedback_${body.taskId}_${providerId}`,
      ...body,
      providerId,
      source: "LOCAL",
      transactionHash: null,
      submissionStatus: "DEMO_ONLY",
    });
  } catch (error) {
    return apiError(
      "FEEDBACK_FAILED",
      error instanceof Error ? error.message : "Feedback failed.",
    );
  }
}

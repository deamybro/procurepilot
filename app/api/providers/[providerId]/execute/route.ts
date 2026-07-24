import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/src/api/response";
import { assertMutationRequest } from "@/src/api/security";
import { executeResearch } from "@/src/providers/research";
import { executeWeb3Risk } from "@/src/providers/web3-risk";
import { executeWebsiteAudit } from "@/src/providers/website-audit";

const BodySchema = z.object({
  paymentStatus: z.literal("settled"),
  input: z.record(z.string(), z.unknown()),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ providerId: string }> },
) {
  try {
    assertMutationRequest(request);
    const body = BodySchema.parse(await request.json());
    const { providerId } = await context.params;
    const result =
      providerId === "provider_research"
        ? await executeResearch(body.input as never)
        : providerId === "provider_website"
          ? await executeWebsiteAudit(body.input as never)
          : providerId === "provider_web3"
            ? await executeWeb3Risk(body.input as never)
            : null;
    return result
      ? apiSuccess(result)
      : apiError("PROVIDER_NOT_EXECUTABLE", "Provider has no built-in executor.", 404);
  } catch (error) {
    return apiError(
      "EXECUTION_FAILED",
      error instanceof Error ? error.message : "Provider execution failed.",
    );
  }
}

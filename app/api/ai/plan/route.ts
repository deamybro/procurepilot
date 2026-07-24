import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/src/api/response";
import { assertMutationRequest } from "@/src/api/security";
import { GeminiPlanner } from "@/src/planners/gemini";
import { ScriptedDemoPlanner } from "@/src/planners/scripted";

const RequestSchema = z.object({
  goal: z.string().min(10).max(4_000),
  maximumBudget: z.string().regex(/^\d+(\.\d{1,6})?$/),
  preferredToken: z.literal("USDC"),
  deadline: z.string().datetime().nullable().optional(),
  outputRequirements: z.array(z.string().min(3)).max(10).optional(),
  planner: z.enum(["scripted", "gemini"]).default("scripted"),
});

export async function POST(request: NextRequest) {
  try {
    assertMutationRequest(request);
    const input = RequestSchema.parse(await request.json());
    const planner =
      input.planner === "gemini"
        ? new GeminiPlanner()
        : new ScriptedDemoPlanner();
    const result = await planner.plan(input);
    return apiSuccess(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Planning failed.";
    return apiError("PLAN_FAILED", message, 400);
  }
}

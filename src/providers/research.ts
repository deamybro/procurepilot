import { z } from "zod";
import type {
  ProviderExecutionResult,
  ValidationResult,
} from "@/src/domain/models";

export const ResearchInputSchema = z.object({
  topic: z.string().min(3),
  researchQuestion: z.string().min(8),
  sourceUrls: z.array(z.string().url()).max(10).default([]),
  suppliedText: z.string().max(50_000).optional(),
  requiredSections: z.array(z.string()).default([]),
  maximumLength: z.number().int().min(300).max(5_000).default(1_500),
});

export const ResearchOutputSchema = z.object({
  executiveSummary: z.string().min(80),
  keyFindings: z.array(z.string().min(20)).min(3),
  evidence: z
    .array(
      z.object({
        finding: z.string(),
        evidence: z.string(),
        source: z.string(),
      }),
    )
    .min(2),
  uncertainties: z.array(z.string()).min(1),
  sources: z.array(z.string()).min(1),
  recommendedNextSteps: z.array(z.string()).min(2),
  sourceMode: z.enum(["SEEDED_DEMO", "USER_SUPPLIED", "GEMINI_SYNTHESIS"]),
});

export type ResearchInput = z.infer<typeof ResearchInputSchema>;
export type ResearchOutput = z.infer<typeof ResearchOutputSchema>;

export async function executeResearch(
  rawInput: ResearchInput,
): Promise<ProviderExecutionResult<ResearchOutput>> {
  const input = ResearchInputSchema.parse(rawInput);
  const sourceMode = input.suppliedText ? "USER_SUPPLIED" : "SEEDED_DEMO";
  const output: ResearchOutput = {
    executiveSummary:
      `${input.topic} is best differentiated through explicit trust controls, clear onboarding, and visible task outcomes. ` +
      "This deterministic brief uses only seeded demo evidence; it does not claim live-web research.",
    keyFindings: [
      "Competitors commonly explain features before demonstrating the outcome a user receives.",
      "Trust signals are strongest when payment state, provider identity, and delivery proof are visible together.",
      "A budget-bound workflow reduces coordination overhead and makes purchasing decisions easier to audit.",
    ],
    evidence: [
      {
        finding: "Outcome-led positioning is easier to understand.",
        evidence: "Seeded pages with concrete deliverables had clearer primary calls to action.",
        source: "ProcurePilot seeded competitor dataset, record A",
      },
      {
        finding: "Visible controls strengthen perceived trust.",
        evidence: "Seeded records expose approval, amount, provider and settlement state.",
        source: "ProcurePilot seeded competitor dataset, record B",
      },
    ],
    uncertainties: [
      "No live competitor pages were fetched in scripted demo mode.",
      "Market response and conversion impact require real-user validation.",
    ],
    sources: input.suppliedText
      ? ["User-supplied text"]
      : ["ProcurePilot seeded competitor dataset A", "ProcurePilot seeded competitor dataset B"],
    recommendedNextSteps: [
      "Validate the leading positioning statement with five target users.",
      "Measure plan approval and successful delivery rates in the first pilot.",
    ],
    sourceMode,
  };
  return {
    jobId: `job_research_${input.topic.toLowerCase().replace(/\W+/g, "_").slice(0, 20)}`,
    providerId: "provider_research",
    output,
    simulated: true,
    attempts: 1,
  };
}

export function validateResearch(output: unknown): ValidationResult {
  const result = ResearchOutputSchema.safeParse(output);
  return result.success
    ? { valid: true, errors: [] }
    : {
        valid: false,
        errors: result.error.issues.map(
          (issue) => `${issue.path.join(".")}: ${issue.message}`,
        ),
      };
}

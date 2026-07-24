import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { LocalProviderRegistry } from "@/src/providers/registry";
import { ScriptedDemoPlanner } from "./scripted";
import type { PlanRequest, Planner, PlannerResult } from "./planner";

export const GeminiDraftSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(2_000),
  capabilities: z
    .array(
      z.enum(["research-brief", "website-audit", "web3-basic-risk"]),
    )
    .min(1)
    .max(3),
  outputRequirements: z.array(z.string().min(3)).min(1).max(8),
  constraints: z.array(z.string().min(3)).max(8),
  assumptions: z.array(z.string().min(3)).max(8),
  risks: z.array(z.string().min(3)).max(8),
});

export type GeminiDraft = z.infer<typeof GeminiDraftSchema>;

export class GeminiPlanner implements Planner {
  readonly label = "Gemini Planner";
  private readonly fallback: ScriptedDemoPlanner;

  constructor(
    private readonly apiKey = process.env.GEMINI_API_KEY,
    private readonly model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    registry = new LocalProviderRegistry(),
  ) {
    this.fallback = new ScriptedDemoPlanner(registry);
  }

  async plan(request: PlanRequest): Promise<PlannerResult> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: this.apiKey });
    const schema = z.toJSONSchema(GeminiDraftSchema, {
      target: "draft-7",
      unrepresentable: "any",
    });
    const prompt = [
      "Convert this procurement goal into a small capability plan.",
      "Never propose payment execution, credentials, private keys, or a budget change.",
      "Allowed capabilities: research-brief, website-audit, web3-basic-risk.",
      `Goal: ${request.goal}`,
      `Maximum budget: ${request.maximumBudget} ${request.preferredToken}`,
    ].join("\n");

    const requestPromise = ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: schema,
        temperature: 0.1,
        maxOutputTokens: 1_200,
      },
    });
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini planner timed out.")), 12_000),
    );
    const response = await Promise.race([requestPromise, timeout]);
    const draft = GeminiDraftSchema.parse(JSON.parse(response.text ?? "{}"));

    // The model only decomposes the goal. Deterministic code still selects
    // providers, calculates all money and enforces the budget.
    const deterministic = await this.fallback.plan({
      ...request,
      goal: `${request.goal}\nCapabilities: ${draft.capabilities.join(", ")}`,
      outputRequirements: draft.outputRequirements,
    });
    return {
      ...deterministic,
      plannerLabel: `${this.label} (${this.model})`,
      simulated: false,
      intent: {
        ...deterministic.intent,
        title: draft.title,
        description: draft.description,
        constraints: [
          ...new Set([
            ...deterministic.intent.constraints,
            ...draft.constraints,
          ]),
        ],
      },
      plan: {
        ...deterministic.plan,
        risks: [...new Set([...deterministic.plan.risks, ...draft.risks])],
        assumptions: [
          ...new Set([...deterministic.plan.assumptions, ...draft.assumptions]),
        ],
      },
    };
  }
}

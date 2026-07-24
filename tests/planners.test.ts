import { describe, expect, it } from "vitest";
import { GeminiDraftSchema } from "@/src/planners/gemini";
import { ScriptedDemoPlanner } from "@/src/planners/scripted";

describe("scripted planner and quote comparison", () => {
  it("creates a deterministic multi-provider competitor plan within budget", async () => {
    const planner = new ScriptedDemoPlanner();
    const result = await planner.plan({
      goal: "Analyse three competitors for a crypto wallet product.",
      maximumBudget: "5.00",
      preferredToken: "USDC",
    });
    expect(result.plannerLabel).toBe("Scripted Demo Planner");
    expect(result.plan.subtasks).toHaveLength(2);
    expect(result.plan.estimatedTotal).toBe("2.3");
    expect(Number(result.plan.estimatedTotal)).toBeLessThanOrEqual(5);
  });

  it("marks a plan above budget as non-approvable risk", async () => {
    const result = await new ScriptedDemoPlanner().plan({
      goal: "Analyse competitors and audit their websites.",
      maximumBudget: "1.00",
      preferredToken: "USDC",
    });
    expect(Number(result.plan.estimatedTotal)).toBeGreaterThan(1);
    expect(result.plan.risks.join(" ")).toContain("cannot be approved");
  });

  it("selects a fallback provider when one exists", async () => {
    const result = await new ScriptedDemoPlanner().plan({
      goal: "Create a focused research brief about wallet positioning.",
      maximumBudget: "3.00",
      preferredToken: "USDC",
    });
    expect(result.plan.subtasks[0].fallbackProviderIds).toContain(
      "provider_alt_research",
    );
  });
});

describe("Gemini structured-response validation", () => {
  it("accepts only the supported structured planner output", () => {
    expect(
      GeminiDraftSchema.parse({
        title: "Wallet competitor analysis",
        description: "Compare positioning and produce a concise report.",
        capabilities: ["website-audit", "research-brief"],
        outputRequirements: ["Executive summary"],
        constraints: ["Do not exceed budget"],
        assumptions: ["Seeded data may be used"],
        risks: ["No live browsing"],
      }).capabilities,
    ).toHaveLength(2);
    expect(() =>
      GeminiDraftSchema.parse({
        title: "Invalid",
        description: "Tries to execute unsupported work.",
        capabilities: ["send-private-key"],
        outputRequirements: ["x"],
        constraints: [],
        assumptions: [],
        risks: [],
      }),
    ).toThrow();
  });
});

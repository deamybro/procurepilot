import { randomUUID } from "node:crypto";
import { ProcurementIntentSchema, ProcurementPlanSchema } from "@/src/domain/models";
import { evaluateBudget } from "@/src/domain/budget";
import { calculateFee } from "@/src/domain/money";
import { rankProviders } from "@/src/domain/ranking";
import { LocalProviderRegistry } from "@/src/providers/registry";
import type { PlanRequest, Planner, PlannerResult } from "./planner";

function requestId(prefix: string): string {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

function inferCapabilities(goal: string): string[] {
  const text = goal.toLowerCase();
  const result: string[] = [];
  if (
    text.includes("competitor") ||
    text.includes("research") ||
    text.includes("analysis")
  ) {
    result.push("research-brief");
  }
  if (
    text.includes("website") ||
    text.includes("landing") ||
    text.includes("competitor")
  ) {
    result.push("website-audit");
  }
  if (
    text.includes("contract") ||
    text.includes("risk") ||
    text.includes("check this wallet") ||
    text.includes("wallet address")
  ) {
    result.push("web3-basic-risk");
  }
  return [...new Set(result.length > 0 ? result : ["research-brief"])];
}

function titleFor(goal: string): string {
  const compact = goal.replace(/\s+/g, " ").trim();
  return compact.length > 72 ? `${compact.slice(0, 69)}…` : compact;
}

export class ScriptedDemoPlanner implements Planner {
  readonly label = "Scripted Demo Planner";

  constructor(
    private readonly registry = new LocalProviderRegistry(),
    private readonly now = () => new Date(),
  ) {}

  async plan(request: PlanRequest): Promise<PlannerResult> {
    const createdAt = this.now().toISOString();
    const reqId = requestId("req");
    const capabilities = inferCapabilities(request.goal);
    const providers = await this.registry.list();
    const subtasks = capabilities.map((capability, index) => {
      const ranking = rankProviders(
        providers,
        capability,
        request.preferredToken,
        "goat-testnet",
      );
      if (!ranking[0]) {
        throw new Error(`No provider supports ${capability}.`);
      }
      const selected = providers.find(
        (provider) => provider.providerId === ranking[0].providerId,
      );
      if (!selected) throw new Error("Ranked provider is unavailable.");
      return {
        subtaskId: `subtask_${index + 1}`,
        title:
          capability === "website-audit"
            ? "Audit positioning and page structure"
            : capability === "web3-basic-risk"
              ? "Create basic Web3 risk overview"
              : "Synthesize the research brief",
        description: `Procure a validated ${capability} deliverable.`,
        capabilityRequired: capability,
        selectedProviderId: selected.providerId,
        quotedPrice: selected.basePrice,
        expectedOutput: `${capability} structured result`,
        dependencies: index === 0 ? [] : [`subtask_${index}`],
        fallbackProviderIds: ranking.slice(1).map((score) => score.providerId),
        validationCriteria: [
          "Required sections are present",
          "Observed facts and inferences are separated",
          "Simulated sources are explicitly labelled",
        ],
      };
    });
    const providerCost = subtasks
      .map((subtask) => subtask.quotedPrice)
      .reduce((sum, value) => {
        const [a, b = ""] = sum.split(".");
        const [c, d = ""] = value.split(".");
        const total =
          BigInt(a) * 1_000_000n +
          BigInt(b.padEnd(6, "0")) +
          BigInt(c) * 1_000_000n +
          BigInt(d.padEnd(6, "0"));
        return `${total / 1_000_000n}.${(total % 1_000_000n)
          .toString()
          .padStart(6, "0")}`;
      }, "0");
    const orchestrationFee = calculateFee(providerCost, {
      type: "FLAT",
      amount: "0.25",
    });
    const budget = evaluateBudget(
      { subtasks, orchestrationFee },
      request.maximumBudget,
    );
    const planId = requestId("plan");
    const intent = ProcurementIntentSchema.parse({
      requestId: reqId,
      userGoal: request.goal,
      title: titleFor(request.goal),
      description: `Procure ${capabilities.join(", ")} within ${request.maximumBudget} ${request.preferredToken}.`,
      maximumBudget: request.maximumBudget,
      preferredToken: request.preferredToken,
      deadline: request.deadline ?? null,
      requiredCapabilities: capabilities,
      outputRequirements:
        request.outputRequirements?.length
          ? request.outputRequirements
          : ["One complete, validated final deliverable"],
      approvalMode: "PLAN_TOTAL",
      constraints: [
        "Never exceed the approved budget",
        "Explicit approval before payment",
        "Use labelled simulated payments in demo mode",
      ],
      createdAt,
    });
    const plan = ProcurementPlanSchema.parse({
      planId,
      requestId: reqId,
      summary: `${subtasks.length} provider job${subtasks.length === 1 ? "" : "s"} selected by deterministic ranking.`,
      subtasks,
      selectedProviders: [...new Set(subtasks.map((s) => s.selectedProviderId))],
      alternativeProviders: [
        ...new Set(subtasks.flatMap((s) => s.fallbackProviderIds)),
      ],
      estimatedProviderCost: budget.providerCost,
      orchestrationFee,
      estimatedTotal: budget.total,
      budgetRemaining: budget.remaining,
      risks: budget.allowed
        ? [
            "Demo results use seeded data unless an integration is explicitly configured.",
          ]
        : [
            ...budget.errors,
            "This plan cannot be approved until its scope or provider selection changes.",
          ],
      assumptions: [
        "Quotes are fixed for 30 minutes.",
        "GOAT testnet is the only supported real-payment chain.",
      ],
      approvalRequired: true,
      createdAt,
      expiresAt: new Date(this.now().getTime() + 30 * 60 * 1_000).toISOString(),
    });
    return {
      plannerLabel: this.label,
      simulated: true,
      intent,
      plan,
      providers,
    };
  }
}

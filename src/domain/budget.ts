import type { ProcurementPlan } from "./models";
import { addAmounts, subtractAmounts, toAtomic } from "./money";

export interface BudgetEvaluation {
  allowed: boolean;
  providerCost: string;
  total: string;
  remaining: string;
  errors: string[];
}

export function evaluateBudget(
  plan: Pick<ProcurementPlan, "subtasks" | "orchestrationFee">,
  maximumBudget: string,
): BudgetEvaluation {
  const providerCost = addAmounts(
    ...plan.subtasks.map((subtask) => subtask.quotedPrice),
  );
  const total = addAmounts(providerCost, plan.orchestrationFee);
  const allowed = toAtomic(total) <= toAtomic(maximumBudget);
  return {
    allowed,
    providerCost,
    total,
    remaining: allowed ? subtractAmounts(maximumBudget, total) : "0",
    errors: allowed
      ? []
      : [`Estimated total ${total} exceeds budget ${maximumBudget}.`],
  };
}

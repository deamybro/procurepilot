import type {
  ProcurementIntent,
  ProcurementPlan,
  Provider,
} from "@/src/domain/models";

export interface PlanRequest {
  goal: string;
  maximumBudget: string;
  preferredToken: string;
  deadline?: string | null;
  outputRequirements?: string[];
}

export interface PlannerResult {
  plannerLabel: string;
  simulated: boolean;
  intent: ProcurementIntent;
  plan: ProcurementPlan;
  providers: Provider[];
}

export interface Planner {
  readonly label: string;
  plan(request: PlanRequest): Promise<PlannerResult>;
}

import type { ProviderJobState, TaskState } from "./models";

const taskTransitions: Record<TaskState, readonly TaskState[]> = {
  DRAFT: ["PLANNING", "CANCELLED"],
  PLANNING: ["DISCOVERING_PROVIDERS", "FAILED", "CANCELLED"],
  DISCOVERING_PROVIDERS: ["AWAITING_APPROVAL", "FAILED", "CANCELLED"],
  AWAITING_APPROVAL: ["APPROVED", "CANCELLED", "FAILED"],
  APPROVED: ["PAYMENT_CREATING", "CANCELLED"],
  PAYMENT_CREATING: ["PAYMENT_AUTHORIZING", "FAILED", "CANCELLED"],
  PAYMENT_AUTHORIZING: ["PAYMENT_TRANSFERRING", "FAILED", "CANCELLED"],
  PAYMENT_TRANSFERRING: ["PROVIDER_WORKING", "FAILED"],
  PROVIDER_WORKING: ["VALIDATING_OUTPUT", "FAILED"],
  VALIDATING_OUTPUT: [
    "PROVIDER_WORKING",
    "AGGREGATING",
    "PARTIALLY_COMPLETED",
    "FAILED",
  ],
  AGGREGATING: ["COMPLETED", "PARTIALLY_COMPLETED", "FAILED"],
  COMPLETED: [],
  PARTIALLY_COMPLETED: [],
  CANCELLED: [],
  FAILED: [],
};

const jobTransitions: Record<ProviderJobState, readonly ProviderJobState[]> = {
  PROPOSED: ["SELECTED", "FAILED"],
  SELECTED: ["PAYMENT_PENDING", "FAILED"],
  PAYMENT_PENDING: ["PAID", "FAILED"],
  PAID: ["RUNNING", "REFUNDED", "FAILED"],
  RUNNING: ["OUTPUT_SUBMITTED", "FAILED"],
  OUTPUT_SUBMITTED: ["VALIDATED", "REJECTED_OUTPUT"],
  VALIDATED: ["COMPLETED"],
  REJECTED_OUTPUT: ["RUNNING", "REFUNDED", "FAILED"],
  REFUNDED: [],
  COMPLETED: [],
  FAILED: [],
};

export function canTransitionTask(from: TaskState, to: TaskState): boolean {
  return taskTransitions[from].includes(to);
}

export function transitionTask(from: TaskState, to: TaskState): TaskState {
  if (!canTransitionTask(from, to)) {
    throw new Error(`Invalid task transition: ${from} -> ${to}`);
  }
  return to;
}

export function canTransitionJob(
  from: ProviderJobState,
  to: ProviderJobState,
): boolean {
  return jobTransitions[from].includes(to);
}

export function transitionJob(
  from: ProviderJobState,
  to: ProviderJobState,
): ProviderJobState {
  if (!canTransitionJob(from, to)) {
    throw new Error(`Invalid provider-job transition: ${from} -> ${to}`);
  }
  return to;
}

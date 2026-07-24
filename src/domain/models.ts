import { z } from "zod";

export const TaskStateSchema = z.enum([
  "DRAFT",
  "PLANNING",
  "DISCOVERING_PROVIDERS",
  "AWAITING_APPROVAL",
  "APPROVED",
  "PAYMENT_CREATING",
  "PAYMENT_AUTHORIZING",
  "PAYMENT_TRANSFERRING",
  "PROVIDER_WORKING",
  "VALIDATING_OUTPUT",
  "AGGREGATING",
  "COMPLETED",
  "PARTIALLY_COMPLETED",
  "CANCELLED",
  "FAILED",
]);

export const ProviderJobStateSchema = z.enum([
  "PROPOSED",
  "SELECTED",
  "PAYMENT_PENDING",
  "PAID",
  "RUNNING",
  "OUTPUT_SUBMITTED",
  "VALIDATED",
  "REJECTED_OUTPUT",
  "REFUNDED",
  "COMPLETED",
  "FAILED",
]);

export type TaskState = z.infer<typeof TaskStateSchema>;
export type ProviderJobState = z.infer<typeof ProviderJobStateSchema>;

export const ProviderSchema = z.object({
  providerId: z.string().min(3),
  name: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().min(10),
  capabilities: z.array(z.string().min(2)).min(1),
  inputSchema: z.record(z.string(), z.unknown()),
  outputSchema: z.record(z.string(), z.unknown()),
  pricingModel: z.enum(["FLAT", "PER_URL", "PER_CHECK"]),
  basePrice: z.string().regex(/^\d+(\.\d{1,6})?$/),
  supportedTokens: z.array(z.string()).min(1),
  supportedChains: z.array(z.string()).min(1),
  endpoint: z.string().startsWith("/"),
  x402Enabled: z.boolean(),
  erc8004AgentId: z.string().nullable(),
  erc8004Registry: z.string().nullable(),
  payoutAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  averageRating: z.number().min(0).max(5),
  completedJobs: z.number().int().nonnegative(),
  failedJobs: z.number().int().nonnegative(),
  averageCompletionTime: z.number().positive(),
  active: z.boolean(),
  source: z.enum(["BUILT_IN", "LOCAL", "ERC8004"]),
  verificationStatus: z.enum([
    "LOCAL_PROFILE",
    "ERC8004_REGISTERED",
    "ERC8004_VERIFIED_TESTNET",
    "REGISTRATION_NOT_CONFIGURED",
  ]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Provider = z.infer<typeof ProviderSchema>;

export const ProcurementIntentSchema = z.object({
  requestId: z.string().min(3),
  userGoal: z.string().min(10).max(4_000),
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(2_000),
  maximumBudget: z.string().regex(/^\d+(\.\d{1,6})?$/),
  preferredToken: z.string().min(2).max(12),
  deadline: z.string().datetime().nullable(),
  requiredCapabilities: z.array(z.string()).min(1),
  outputRequirements: z.array(z.string()).min(1),
  approvalMode: z.enum(["EVERY_PAYMENT", "PLAN_TOTAL"]),
  constraints: z.array(z.string()),
  createdAt: z.string().datetime(),
});

export type ProcurementIntent = z.infer<typeof ProcurementIntentSchema>;

export const PlanSubtaskSchema = z.object({
  subtaskId: z.string().min(3),
  title: z.string().min(3),
  description: z.string().min(5),
  capabilityRequired: z.string().min(2),
  selectedProviderId: z.string().min(3),
  quotedPrice: z.string().regex(/^\d+(\.\d{1,6})?$/),
  expectedOutput: z.string().min(3),
  dependencies: z.array(z.string()),
  fallbackProviderIds: z.array(z.string()),
  validationCriteria: z.array(z.string()).min(1),
});

export const ProcurementPlanSchema = z.object({
  planId: z.string().min(3),
  requestId: z.string().min(3),
  summary: z.string().min(10),
  subtasks: z.array(PlanSubtaskSchema).min(1),
  selectedProviders: z.array(z.string()).min(1),
  alternativeProviders: z.array(z.string()),
  estimatedProviderCost: z.string(),
  orchestrationFee: z.string(),
  estimatedTotal: z.string(),
  budgetRemaining: z.string(),
  risks: z.array(z.string()),
  assumptions: z.array(z.string()),
  approvalRequired: z.literal(true),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

export type ProcurementPlan = z.infer<typeof ProcurementPlanSchema>;
export type PlanSubtask = z.infer<typeof PlanSubtaskSchema>;

export const AuditEventSchema = z.object({
  eventId: z.string(),
  taskId: z.string(),
  actor: z.string(),
  action: z.string(),
  previousState: z.string().nullable(),
  nextState: z.string().nullable(),
  paymentDecision: z
    .enum(["APPROVED", "CONFIRMATION_REQUIRED", "REJECTED"])
    .nullable(),
  provider: z.string().nullable(),
  timestamp: z.string().datetime(),
  traceId: z.string(),
  idempotencyKey: z.string().nullable(),
  transactionHash: z.string().nullable(),
  proof: z.string().nullable(),
  error: z.string().nullable(),
  environmentMode: z.enum(["demo", "ai-demo", "goat-testnet"]),
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;

export interface ProviderScore {
  providerId: string;
  capabilityMatch: number;
  priceScore: number;
  reputationScore: number;
  reliabilityScore: number;
  speedScore: number;
  finalScore: number;
  reasons: string[];
}

export interface ProviderExecutionResult<T = unknown> {
  jobId: string;
  providerId: string;
  output: T;
  simulated: boolean;
  attempts: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

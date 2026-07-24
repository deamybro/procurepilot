import { isAddress, keccak256, toHex } from "viem";
import { z } from "zod";
import { toAtomic } from "./money";

export const PaymentRequestSchema = z.object({
  providerId: z.string(),
  orderId: z.string(),
  recipient: z.string(),
  token: z.string(),
  tokenAddress: z.string(),
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/),
  quotedAmount: z.string().regex(/^\d+(\.\d{1,6})?$/),
  chain: z.string(),
  quoteExpiry: z.string().datetime(),
  taskId: z.string(),
  subtaskId: z.string(),
  idempotencyKey: z.string(),
  taskTotal: z.string(),
  currentDailySpend: z.string(),
  sufficientBalance: z.boolean(),
  eip712Valid: z.boolean(),
  alreadyCompleted: z.boolean(),
});

export type PaymentRequest = z.infer<typeof PaymentRequestSchema>;

export interface PaymentPolicy {
  maximumTaskBudget: string;
  maximumSinglePayment: string;
  maximumDailySpend: string;
  allowedTokens: string[];
  allowedTokenAddresses: string[];
  allowedChains: string[];
  allowedProviders: string[];
  blockedProviders: string[];
  allowedRecipients: string[];
  blockedRecipients: string[];
  requireConfirmationForNewProvider: boolean;
  confirmationThreshold: string;
  rejectChangedRecipient: boolean;
  rejectChangedAmount: boolean;
  rejectDuplicateOrder: boolean;
  rejectExpiredQuote: boolean;
  requireSufficientBalance: boolean;
  enabled: boolean;
}

export type PaymentDecision =
  | "APPROVED"
  | "CONFIRMATION_REQUIRED"
  | "REJECTED";

export interface PaymentEvaluation {
  decision: PaymentDecision;
  reasons: string[];
  canonicalHash: `0x${string}`;
}

export interface PaymentGuardContext {
  approvedHash?: string;
  usedOrderIds: Set<string>;
  usedIdempotencyKeys: Set<string>;
  approvedRecipient?: string;
  approvedAmount?: string;
  approvedToken?: string;
}

export function canonicalPaymentHash(
  request: Pick<
    PaymentRequest,
    | "providerId"
    | "orderId"
    | "recipient"
    | "token"
    | "amount"
    | "chain"
    | "quoteExpiry"
    | "taskId"
    | "subtaskId"
  >,
): `0x${string}` {
  const canonical = [
    request.providerId,
    request.orderId,
    request.recipient.toLowerCase(),
    request.token.toUpperCase(),
    toAtomic(request.amount).toString(),
    request.chain,
    new Date(request.quoteExpiry).toISOString(),
    request.taskId,
    request.subtaskId,
  ].join("|");
  return keccak256(toHex(canonical));
}

export function evaluatePayment(
  rawRequest: PaymentRequest,
  policy: PaymentPolicy,
  context: PaymentGuardContext,
  now = new Date(),
): PaymentEvaluation {
  const request = PaymentRequestSchema.parse(rawRequest);
  const hash = canonicalPaymentHash(request);
  if (!policy.enabled) {
    return { decision: "REJECTED", reasons: ["Payment policy is disabled."], canonicalHash: hash };
  }

  const rejected: string[] = [];
  const confirmation: string[] = [];
  const recipient = request.recipient.toLowerCase();
  const tokenAddress = request.tokenAddress.toLowerCase();

  if (!isAddress(request.recipient) || /^0x0{40}$/i.test(request.recipient)) {
    rejected.push("Invalid or zero recipient address.");
  }
  if (policy.blockedProviders.includes(request.providerId)) {
    rejected.push("Provider is blocked.");
  }
  if (
    policy.allowedProviders.length > 0 &&
    !policy.allowedProviders.includes(request.providerId)
  ) {
    rejected.push("Provider is not allowlisted.");
  }
  if (!policy.allowedChains.includes(request.chain)) {
    rejected.push("Unsupported chain.");
  }
  if (!policy.allowedTokens.includes(request.token)) {
    rejected.push("Unsupported token.");
  }
  if (
    !policy.allowedTokenAddresses
      .map((value) => value.toLowerCase())
      .includes(tokenAddress)
  ) {
    rejected.push("Token address does not match the allowlist.");
  }
  if (policy.blockedRecipients.map((v) => v.toLowerCase()).includes(recipient)) {
    rejected.push("Recipient is blocked.");
  }
  if (
    policy.allowedRecipients.length > 0 &&
    !policy.allowedRecipients.map((v) => v.toLowerCase()).includes(recipient)
  ) {
    rejected.push("Recipient is not allowlisted.");
  }
  if (toAtomic(request.amount) > toAtomic(request.quotedAmount)) {
    rejected.push("Amount exceeds the provider quote.");
  }
  if (toAtomic(request.amount) > toAtomic(policy.maximumSinglePayment)) {
    rejected.push("Amount exceeds the single-payment limit.");
  }
  if (toAtomic(request.taskTotal) > toAtomic(policy.maximumTaskBudget)) {
    rejected.push("Task total exceeds policy budget.");
  }
  if (
    toAtomic(request.currentDailySpend) + toAtomic(request.amount) >
    toAtomic(policy.maximumDailySpend)
  ) {
    rejected.push("Daily spend limit would be exceeded.");
  }
  if (
    policy.rejectDuplicateOrder &&
    context.usedOrderIds.has(request.orderId)
  ) {
    rejected.push("Duplicate order ID.");
  }
  if (context.usedIdempotencyKeys.has(request.idempotencyKey)) {
    rejected.push("Duplicate idempotency key.");
  }
  if (
    policy.rejectExpiredQuote &&
    new Date(request.quoteExpiry).getTime() <= now.getTime()
  ) {
    rejected.push("Quote has expired.");
  }
  if (
    policy.rejectChangedRecipient &&
    context.approvedRecipient &&
    context.approvedRecipient.toLowerCase() !== recipient
  ) {
    rejected.push("Recipient changed after approval.");
  }
  if (
    policy.rejectChangedAmount &&
    context.approvedAmount &&
    toAtomic(context.approvedAmount) !== toAtomic(request.amount)
  ) {
    rejected.push("Amount changed after approval.");
  }
  if (
    context.approvedToken &&
    context.approvedToken.toUpperCase() !== request.token.toUpperCase()
  ) {
    rejected.push("Token changed after approval.");
  }
  if (policy.requireSufficientBalance && !request.sufficientBalance) {
    rejected.push("Insufficient balance.");
  }
  if (!request.eip712Valid) rejected.push("Malformed EIP-712 data.");
  if (request.alreadyCompleted) rejected.push("Payment is already completed.");
  if (context.approvedHash && context.approvedHash !== hash) {
    rejected.push("Payment details no longer match the approved hash.");
  }
  if (
    policy.requireConfirmationForNewProvider &&
    !policy.allowedProviders.includes(request.providerId)
  ) {
    confirmation.push("New provider requires confirmation.");
  }
  if (toAtomic(request.amount) >= toAtomic(policy.confirmationThreshold)) {
    confirmation.push("Amount meets the confirmation threshold.");
  }

  if (rejected.length > 0) {
    return { decision: "REJECTED", reasons: rejected, canonicalHash: hash };
  }
  if (confirmation.length > 0) {
    return {
      decision: "CONFIRMATION_REQUIRED",
      reasons: confirmation,
      canonicalHash: hash,
    };
  }
  return {
    decision: "APPROVED",
    reasons: ["All deterministic payment checks passed."],
    canonicalHash: hash,
  };
}

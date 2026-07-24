import { describe, expect, it } from "vitest";
import { ProcurementIntentSchema } from "@/src/domain/models";
import { evaluateBudget } from "@/src/domain/budget";
import { calculateFee } from "@/src/domain/money";
import {
  canonicalPaymentHash,
  evaluatePayment,
  type PaymentRequest,
} from "@/src/domain/payment-guard";
import {
  canTransitionJob,
  canTransitionTask,
  transitionTask,
} from "@/src/domain/state-machine";
import {
  DEFAULT_PAYMENT_POLICY,
  DEMO_TOKEN_ADDRESS,
} from "@/src/payments/policy";
import { BUILT_IN_PROVIDERS } from "@/src/providers/seeds";

const request: PaymentRequest = {
  providerId: "provider_website",
  orderId: "order_001",
  recipient: "0x2222222222222222222222222222222222222222",
  token: "USDC",
  tokenAddress: DEMO_TOKEN_ADDRESS,
  amount: "0.85",
  quotedAmount: "0.85",
  chain: "goat-testnet",
  quoteExpiry: "2026-07-24T12:00:00.000Z",
  taskId: "task_001",
  subtaskId: "subtask_001",
  idempotencyKey: "idem_001",
  taskTotal: "1.10",
  currentDailySpend: "0",
  sufficientBalance: true,
  eip712Valid: true,
  alreadyCompleted: false,
};

describe("task parsing and state machines", () => {
  it("rejects a goal that is too short", () => {
    expect(() =>
      ProcurementIntentSchema.parse({
        requestId: "req_1",
        userGoal: "short",
      }),
    ).toThrow();
  });

  it("validates every allowed task and provider-job transition", () => {
    expect(canTransitionTask("DRAFT", "PLANNING")).toBe(true);
    expect(canTransitionTask("DRAFT", "COMPLETED")).toBe(false);
    expect(canTransitionJob("PAID", "RUNNING")).toBe(true);
    expect(canTransitionJob("PAID", "COMPLETED")).toBe(false);
    expect(() => transitionTask("DRAFT", "COMPLETED")).toThrow(
      "Invalid task transition",
    );
  });
});

describe("budget and fees", () => {
  it("uses bigint-safe arithmetic for the flat orchestration fee", () => {
    expect(calculateFee("2.05", { type: "FLAT", amount: "0.25" })).toBe(
      "0.25",
    );
    expect(
      calculateFee("3.00", { type: "PERCENT", basisPoints: 500 }),
    ).toBe("0.15");
  });

  it("blocks plans above budget", () => {
    const result = evaluateBudget(
      {
        subtasks: [
          {
            subtaskId: "sub_1",
            title: "Research",
            description: "Research task",
            capabilityRequired: "research-brief",
            selectedProviderId: "provider_research",
            quotedPrice: "1.20",
            expectedOutput: "Brief",
            dependencies: [],
            fallbackProviderIds: [],
            validationCriteria: ["Sections present"],
          },
        ],
        orchestrationFee: "0.25",
      },
      "1.00",
    );
    expect(result.allowed).toBe(false);
    expect(result.total).toBe("1.45");
  });
});

describe("payment guard, hashing and approval binding", () => {
  const context = {
    usedOrderIds: new Set<string>(),
    usedIdempotencyKeys: new Set<string>(),
    approvedRecipient: request.recipient,
    approvedAmount: request.amount,
    approvedToken: request.token,
  };

  it("creates a stable canonical hash", () => {
    expect(canonicalPaymentHash(request)).toBe(canonicalPaymentHash({ ...request }));
    expect(canonicalPaymentHash(request)).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it("approves an unchanged allowlisted request", () => {
    const result = evaluatePayment(
      request,
      DEFAULT_PAYMENT_POLICY,
      context,
      new Date("2026-07-23T12:00:00.000Z"),
    );
    expect(result.decision).toBe("APPROVED");
  });

  it("rejects duplicate order and idempotency keys", () => {
    const result = evaluatePayment(
      request,
      DEFAULT_PAYMENT_POLICY,
      {
        ...context,
        usedOrderIds: new Set([request.orderId]),
        usedIdempotencyKeys: new Set([request.idempotencyKey]),
      },
      new Date("2026-07-23T12:00:00.000Z"),
    );
    expect(result.decision).toBe("REJECTED");
    expect(result.reasons).toContain("Duplicate order ID.");
    expect(result.reasons).toContain("Duplicate idempotency key.");
  });

  it("rejects a changed recipient after approval", () => {
    const changed = {
      ...request,
      recipient: BUILT_IN_PROVIDERS[0].payoutAddress,
    };
    const result = evaluatePayment(
      changed,
      DEFAULT_PAYMENT_POLICY,
      {
        ...context,
        approvedHash: canonicalPaymentHash(request),
      },
      new Date("2026-07-23T12:00:00.000Z"),
    );
    expect(result.decision).toBe("REJECTED");
    expect(result.reasons).toContain("Recipient changed after approval.");
    expect(result.reasons).toContain(
      "Payment details no longer match the approved hash.",
    );
  });

  it("rejects expired, malformed and already-completed payments", () => {
    const result = evaluatePayment(
      {
        ...request,
        quoteExpiry: "2026-07-22T12:00:00.000Z",
        eip712Valid: false,
        alreadyCompleted: true,
      },
      DEFAULT_PAYMENT_POLICY,
      context,
      new Date("2026-07-23T12:00:00.000Z"),
    );
    expect(result.decision).toBe("REJECTED");
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Quote has expired.",
        "Malformed EIP-712 data.",
        "Payment is already completed.",
      ]),
    );
  });
});

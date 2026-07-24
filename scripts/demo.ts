import { canonicalPaymentHash, evaluatePayment } from "@/src/domain/payment-guard";
import { MockMerchantGateway } from "@/src/payments/mock-gateway";
import {
  DEFAULT_PAYMENT_POLICY,
  DEMO_TOKEN_ADDRESS,
} from "@/src/payments/policy";
import { ScriptedDemoPlanner } from "@/src/planners/scripted";

async function main() {
  const result = await new ScriptedDemoPlanner().plan({
    goal: "Analyse three competitors for a crypto wallet product.",
    maximumBudget: "5.00",
    preferredToken: "USDC",
  });
  if (Number(result.plan.estimatedTotal) > 5) {
    throw new Error("Demo plan exceeded budget.");
  }
  const subtask = result.plan.subtasks[0];
  const provider = result.providers.find(
    (item) => item.providerId === subtask.selectedProviderId,
  );
  if (!provider) throw new Error("Selected provider is missing.");
  const paymentRequest = {
    providerId: provider.providerId,
    orderId: `order_${result.plan.planId}`,
    recipient: provider.payoutAddress,
    token: "USDC",
    tokenAddress: DEMO_TOKEN_ADDRESS,
    amount: subtask.quotedPrice,
    quotedAmount: subtask.quotedPrice,
    chain: "goat-testnet",
    quoteExpiry: result.plan.expiresAt,
    taskId: result.intent.requestId,
    subtaskId: subtask.subtaskId,
    idempotencyKey: `idem_${result.plan.planId}`,
    taskTotal: result.plan.estimatedTotal,
    currentDailySpend: "0",
    sufficientBalance: true,
    eip712Valid: true,
    alreadyCompleted: false,
  };
  const approvedHash = canonicalPaymentHash(paymentRequest);
  const decision = evaluatePayment(
    paymentRequest,
    DEFAULT_PAYMENT_POLICY,
    {
      approvedHash,
      usedOrderIds: new Set(),
      usedIdempotencyKeys: new Set(),
      approvedRecipient: paymentRequest.recipient,
      approvedAmount: paymentRequest.amount,
      approvedToken: "USDC",
    },
  );
  if (decision.decision === "REJECTED") {
    throw new Error(decision.reasons.join(" "));
  }
  const gateway = new MockMerchantGateway();
  const created = gateway.createOrder({
    orderId: paymentRequest.orderId,
    recipient: paymentRequest.recipient,
    token: paymentRequest.token,
    amount: paymentRequest.amount,
  });
  gateway.authorize(created.paymentId);
  const settled = gateway.transfer(created.paymentId);
  console.log(
    JSON.stringify(
      {
        product: "ProcurePilot",
        mode: "SCRIPTED_DEMO",
        planner: result.plannerLabel,
        planTotal: `${result.plan.estimatedTotal} USDC`,
        paymentId: settled.paymentId,
        paymentStatus: settled.status,
        proof: settled.proof,
        transactionHash: null,
        note: "SIMULATED PAYMENT — no blockchain transaction occurred.",
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

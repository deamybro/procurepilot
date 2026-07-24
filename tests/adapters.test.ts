import { describe, expect, it } from "vitest";
import {
  NoopWalletProvider,
  type WalletProvider,
} from "@goatnetwork/agentkit/core";
import {
  cancelPaymentAction,
  createPaymentAction,
  erc8004GetReputationAction,
  erc8004RegisterAgentAction,
  paymentStatusAction,
  submitSignatureAction,
  transferPaymentAction,
} from "@goatnetwork/agentkit/plugins";
import { ActionProvider } from "@goatnetwork/agentkit/providers";
import {
  ERC8004_ACTION_NAMES,
  X402_ACTION_NAMES,
} from "@/src/integrations/agentkit-actions";
import { MockMerchantGateway } from "@/src/payments/mock-gateway";

describe("official AgentKit adapter boundaries", () => {
  it("exposes the exact installed x402 action names", () => {
    const merchant = {} as never;
    const payer = {} as never;
    const names = [
      createPaymentAction(merchant).name,
      submitSignatureAction(merchant, payer).name,
      transferPaymentAction(payer).name,
      paymentStatusAction(merchant).name,
      cancelPaymentAction(merchant).name,
    ];
    expect(names).toEqual(X402_ACTION_NAMES);
  });

  it("exposes the official ERC-8004 boundary", () => {
    const wallet = new NoopWalletProvider() as WalletProvider;
    expect(erc8004RegisterAgentAction(wallet).name).toBe(
      ERC8004_ACTION_NAMES[0],
    );
    expect(erc8004GetReputationAction(wallet).name).toBe(
      "erc8004.get_reputation",
    );
    const registry = new ActionProvider();
    registry.register(erc8004GetReputationAction(wallet));
    expect(registry.get("erc8004.get_reputation").name).toBe(
      "erc8004.get_reputation",
    );
  });
});

describe("mock x402 gateway", () => {
  it("runs a labelled settlement flow and prevents duplicate orders", () => {
    const gateway = new MockMerchantGateway();
    const created = gateway.createOrder({
      orderId: "order_demo_1",
      recipient: "0x1111111111111111111111111111111111111111",
      token: "USDC",
      amount: "1.20",
    });
    expect(created.paymentId).toMatch(/^sim_pay_/);
    expect(gateway.authorize(created.paymentId).status).toBe("authorized");
    const settled = gateway.transfer(created.paymentId);
    expect(settled.status).toBe("settled");
    expect(settled.proof).toMatch(/^SIMULATED_SETTLEMENT:/);
    expect(() =>
      gateway.createOrder({
        orderId: "order_demo_1",
        recipient: created.recipient,
        token: "USDC",
        amount: "1.20",
      }),
    ).toThrow("DUPLICATE_ORDER");
  });

  it("never produces a transaction hash in demo mode", () => {
    const gateway = new MockMerchantGateway();
    const payment = gateway.createOrder({
      orderId: "order_demo_2",
      recipient: "0x1111111111111111111111111111111111111111",
      token: "USDC",
      amount: "1.20",
    });
    expect(payment).not.toHaveProperty("transactionHash");
  });
});

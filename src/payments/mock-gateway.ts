import { randomUUID } from "node:crypto";

export type MockPaymentStatus =
  | "created"
  | "authorized"
  | "settled"
  | "cancelled"
  | "failed"
  | "expired";

export interface MockPayment {
  paymentId: string;
  orderId: string;
  recipient: string;
  token: string;
  amount: string;
  status: MockPaymentStatus;
  simulated: true;
  proof: string | null;
}

export class MockMerchantGateway {
  private readonly payments = new Map<string, MockPayment>();
  private readonly orders = new Map<string, string>();

  createOrder(input: Omit<MockPayment, "paymentId" | "status" | "simulated" | "proof">): MockPayment {
    if (this.orders.has(input.orderId)) {
      throw new Error("DUPLICATE_ORDER");
    }
    const payment: MockPayment = {
      ...input,
      paymentId: `sim_pay_${randomUUID().slice(0, 12)}`,
      status: "created",
      simulated: true,
      proof: null,
    };
    this.payments.set(payment.paymentId, payment);
    this.orders.set(input.orderId, payment.paymentId);
    return payment;
  }

  authorize(paymentId: string): MockPayment {
    const payment = this.require(paymentId);
    if (payment.status !== "created") throw new Error("PAYMENT_NOT_CREATED");
    payment.status = "authorized";
    return { ...payment };
  }

  transfer(paymentId: string): MockPayment {
    const payment = this.require(paymentId);
    if (payment.status !== "authorized") throw new Error("PAYMENT_NOT_AUTHORIZED");
    payment.status = "settled";
    payment.proof = `SIMULATED_SETTLEMENT:${payment.paymentId}`;
    return { ...payment };
  }

  status(paymentId: string): MockPayment {
    return { ...this.require(paymentId) };
  }

  cancel(paymentId: string): MockPayment {
    const payment = this.require(paymentId);
    if (!["created", "authorized"].includes(payment.status)) {
      throw new Error("PAYMENT_NOT_CANCELLABLE");
    }
    payment.status = "cancelled";
    return { ...payment };
  }

  private require(paymentId: string): MockPayment {
    const payment = this.payments.get(paymentId);
    if (!payment) throw new Error("PAYMENT_NOT_FOUND");
    return payment;
  }
}

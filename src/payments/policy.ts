import type { PaymentPolicy } from "@/src/domain/payment-guard";
import { BUILT_IN_PROVIDERS } from "@/src/providers/seeds";

export const DEMO_TOKEN_ADDRESS =
  "0x7777777777777777777777777777777777777777";

export const DEFAULT_PAYMENT_POLICY: PaymentPolicy = {
  maximumTaskBudget: "10.00",
  maximumSinglePayment: "5.00",
  maximumDailySpend: "25.00",
  allowedTokens: ["USDC"],
  allowedTokenAddresses: [DEMO_TOKEN_ADDRESS],
  allowedChains: ["goat-testnet"],
  allowedProviders: BUILT_IN_PROVIDERS.map((provider) => provider.providerId),
  blockedProviders: [],
  allowedRecipients: BUILT_IN_PROVIDERS.map(
    (provider) => provider.payoutAddress,
  ),
  blockedRecipients: [],
  requireConfirmationForNewProvider: true,
  confirmationThreshold: "2.00",
  rejectChangedRecipient: true,
  rejectChangedAmount: true,
  rejectDuplicateOrder: true,
  rejectExpiredQuote: true,
  requireSufficientBalance: true,
  enabled: true,
};

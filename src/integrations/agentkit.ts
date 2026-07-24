import "server-only";

import { JsonRpcProvider, Wallet } from "ethers";
import {
  EvmWalletProvider,
  ExecutionRuntime,
  PolicyEngine,
  type WalletProvider,
} from "@goatnetwork/agentkit/core";
import {
  EvmPayerWalletAdapter,
  HttpMerchantGatewayAdapter,
  cancelPaymentAction,
  createPaymentAction,
  erc8004GetAgentWalletAction,
  erc8004GetClientsAction,
  erc8004GetMetadataAction,
  erc8004GetReputationAction,
  erc8004GiveFeedbackAction,
  erc8004RegisterAgentAction,
  erc8004RevokeFeedbackAction,
  erc8004SetAgentURIAction,
  erc8004SetMetadataAction,
  paymentStatusAction,
  submitSignatureAction,
  transferPaymentAction,
} from "@goatnetwork/agentkit/plugins";
import { ActionProvider } from "@goatnetwork/agentkit/providers";
import { z } from "zod";
import {
  ERC8004_ACTION_NAMES,
  X402_ACTION_NAMES,
} from "./agentkit-actions";

export { ERC8004_ACTION_NAMES, X402_ACTION_NAMES } from "./agentkit-actions";

export function registerX402Actions(
  provider: ActionProvider,
  merchant: HttpMerchantGatewayAdapter,
  payer: EvmPayerWalletAdapter,
): void {
  provider.register(createPaymentAction(merchant));
  provider.register(submitSignatureAction(merchant, payer));
  provider.register(transferPaymentAction(payer));
  provider.register(paymentStatusAction(merchant));
  provider.register(cancelPaymentAction(merchant));
}

export function registerErc8004Actions(
  provider: ActionProvider,
  wallet: WalletProvider,
): void {
  provider.register(erc8004RegisterAgentAction(wallet));
  provider.register(erc8004SetAgentURIAction(wallet));
  provider.register(erc8004GetMetadataAction(wallet));
  provider.register(erc8004SetMetadataAction(wallet));
  provider.register(erc8004GetAgentWalletAction(wallet));
  provider.register(erc8004GiveFeedbackAction(wallet));
  provider.register(erc8004RevokeFeedbackAction(wallet));
  provider.register(erc8004GetReputationAction(wallet));
  provider.register(erc8004GetClientsAction(wallet));
}

const TestnetConfigSchema = z.object({
  mode: z.literal("goat-testnet"),
  rpcUrl: z.string().url(),
  merchantBaseUrl: z.string().url(),
  merchantApiKey: z.string().min(8),
  privateKey: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});

export function createGoatTestnetRuntime(rawConfig: z.infer<typeof TestnetConfigSchema>) {
  const config = TestnetConfigSchema.parse(rawConfig);
  const rpc = new JsonRpcProvider(config.rpcUrl, 48816);
  const signer = new Wallet(config.privateKey, rpc);
  const wallet = new EvmWalletProvider(signer, rpc, "goat-testnet");
  const payer = new EvmPayerWalletAdapter(signer);
  const merchant = new HttpMerchantGatewayAdapter(config.merchantBaseUrl, {
    headers: { Authorization: `Bearer ${config.merchantApiKey}` },
    timeoutMs: 12_000,
  });
  const actions = new ActionProvider();
  registerX402Actions(actions, merchant, payer);
  registerErc8004Actions(actions, wallet);
  const policy = new PolicyEngine({
    allowedNetworks: ["goat-testnet"],
    maxRiskWithoutConfirm: "low",
    writeEnabled: true,
  });
  const runtime = new ExecutionRuntime(policy, {
    maxRetries: 1,
    retryDelayMs: 250,
  });
  return { actions, runtime, wallet, merchant, payer };
}

export function inspectInstalledActionNames(): {
  x402: readonly string[];
  erc8004: readonly string[];
} {
  // These names are derived from the installed 0.2.3 action definitions and
  // are also asserted in tests against live factory outputs.
  return { x402: X402_ACTION_NAMES, erc8004: ERC8004_ACTION_NAMES };
}

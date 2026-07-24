import "server-only";
import { inspectInstalledActionNames } from "./agentkit";

export type IntegrationState =
  | "CONFIGURED"
  | "WORKING"
  | "NOT_CONFIGURED"
  | "DEMO_ONLY"
  | "ERROR";

export interface IntegrationStatus {
  id: string;
  label: string;
  state: IntegrationState;
  detail: string;
}

async function rpcHealth(): Promise<IntegrationStatus> {
  const url =
    process.env.GOAT_TESTNET_RPC_URL ??
    "https://rpc.testnet3.goat.network";
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_chainId",
        params: [],
      }),
      signal: AbortSignal.timeout(3_000),
    });
    const payload = (await response.json()) as { result?: string };
    return payload.result === "0xbeb0"
      ? {
          id: "goat-rpc",
          label: "GOAT RPC",
          state: "WORKING",
          detail: "Testnet3 returned chain 48816.",
        }
      : {
          id: "goat-rpc",
          label: "GOAT RPC",
          state: "ERROR",
          detail: "RPC responded with an unexpected chain.",
        };
  } catch {
    return {
      id: "goat-rpc",
      label: "GOAT RPC",
      state: "ERROR",
      detail: "Health check could not reach testnet3.",
    };
  }
}

export async function getIntegrationStatuses(): Promise<IntegrationStatus[]> {
  const actionNames = inspectInstalledActionNames();
  const mode = process.env.NEXT_PUBLIC_APP_MODE ?? "demo";
  const walletConfigured = /^0x[a-fA-F0-9]{64}$/.test(
    process.env.GOAT_PRIVATE_KEY ?? "",
  );
  const merchantConfigured = Boolean(
    process.env.GOAT_X402_BASE_URL &&
      process.env.GOAT_X402_API_KEY &&
      process.env.GOAT_X402_API_SECRET &&
      process.env.GOAT_X402_MERCHANT_ID,
  );
  return [
    {
      id: "gemini",
      label: "Gemini AI",
      state: process.env.GEMINI_API_KEY ? "CONFIGURED" : "NOT_CONFIGURED",
      detail: process.env.GEMINI_API_KEY
        ? "Key is present; no paid health-check call was made."
        : "Falls back to the scripted planner.",
    },
    {
      id: "scripted",
      label: "Scripted planner",
      state: "WORKING",
      detail: "Deterministic planner is available without credentials.",
    },
    await rpcHealth(),
    {
      id: "agentkit",
      label: "GOAT AgentKit",
      state: actionNames.x402.length === 5 ? "WORKING" : "ERROR",
      detail: `${actionNames.x402.length} x402 and ${actionNames.erc8004.length} ERC-8004 actions mapped.`,
    },
    {
      id: "x402-payer",
      label: "x402 payer actions",
      state: walletConfigured && merchantConfigured ? "CONFIGURED" : "DEMO_ONLY",
      detail: walletConfigured && merchantConfigured
        ? "Credentials are configured; no transaction has been broadcast."
        : "Official actions are installed; mock settlement is active.",
    },
    {
      id: "x402-merchant",
      label: "x402 merchant",
      state: merchantConfigured ? "CONFIGURED" : "DEMO_ONLY",
      detail: merchantConfigured
        ? "Server credentials are present; live order not attempted."
        : "Built-in provider routes use the labelled mock gateway.",
    },
    {
      id: "wallet",
      label: "Testnet wallet",
      state: walletConfigured ? "CONFIGURED" : "NOT_CONFIGURED",
      detail: walletConfigured
        ? "Server-side testnet key is present."
        : "No wallet configured; demo mode cannot broadcast.",
    },
    {
      id: "erc8004",
      label: "ERC-8004 identity",
      state: process.env.ERC8004_AGENT_ID ? "CONFIGURED" : "NOT_CONFIGURED",
      detail: process.env.ERC8004_AGENT_ID
        ? "Agent ID is configured but not marked verified without an on-chain read."
        : "Provider profiles remain local.",
    },
    {
      id: "storage",
      label: "Storage",
      state: "DEMO_ONLY",
      detail: "IndexedDB records remain in this browser.",
    },
    {
      id: "deployment",
      label: "Deployment",
      state: process.env.SITE_URL ? "CONFIGURED" : "NOT_CONFIGURED",
      detail: process.env.SITE_URL
        ? "A deployment URL is configured."
        : "Local build only.",
    },
    {
      id: "mode",
      label: "Runtime mode",
      state: mode === "demo" ? "DEMO_ONLY" : "CONFIGURED",
      detail: `Current requested mode: ${mode}.`,
    },
  ];
}

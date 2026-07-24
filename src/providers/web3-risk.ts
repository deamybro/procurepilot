import { isAddress } from "viem";
import { z } from "zod";
import type {
  ProviderExecutionResult,
  ValidationResult,
} from "@/src/domain/models";

export const Web3RiskInputSchema = z.object({
  network: z.string().min(3),
  address: z.string(),
  desiredChecks: z.array(z.string()).min(1),
});

export const Web3RiskOutputSchema = z.object({
  network: z.string(),
  address: z.string(),
  riskOverview: z.string().min(40),
  observedFacts: z.array(z.string()).min(2),
  warnings: z.array(z.string()).min(1),
  confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
  manualChecks: z.array(z.string()).min(2),
  disclaimer: z.string().includes("not a professional security audit"),
  sourceMode: z.literal("DETERMINISTIC_DEMO"),
});

export async function executeWeb3Risk(
  rawInput: z.infer<typeof Web3RiskInputSchema>,
): Promise<ProviderExecutionResult<z.infer<typeof Web3RiskOutputSchema>>> {
  const input = Web3RiskInputSchema.parse(rawInput);
  const valid = isAddress(input.address);
  const output = {
    network: input.network,
    address: input.address,
    riskOverview: valid
      ? "The address is structurally valid. Demo mode did not query RPC state, bytecode, balances, metadata or allowances."
      : "The supplied value is not a valid EVM address and should not be used for a transaction.",
    observedFacts: [
      `Address format: ${valid ? "valid EVM address" : "invalid"}`,
      `Requested network: ${input.network}`,
      "RPC observation: not performed in scripted demo mode",
    ],
    warnings: valid
      ? ["No on-chain state was queried; ownership and code behaviour are unknown."]
      : ["Malformed address is a critical input error."],
    confidence: valid ? ("MEDIUM" as const) : ("HIGH" as const),
    manualChecks: [
      "Verify the address independently in the GOAT testnet explorer.",
      "Review contract source, ownership and token approvals before interaction.",
    ],
    disclaimer:
      "This is a basic deterministic risk overview, not a professional security audit.",
    sourceMode: "DETERMINISTIC_DEMO" as const,
  };
  return {
    jobId: `job_risk_${input.address.slice(2, 10) || "invalid"}`,
    providerId: "provider_web3",
    output,
    simulated: true,
    attempts: 1,
  };
}

export function validateWeb3Risk(
  output: unknown,
  input: z.infer<typeof Web3RiskInputSchema>,
): ValidationResult {
  const result = Web3RiskOutputSchema.safeParse(output);
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      ),
    };
  }
  const errors = [
    result.data.address.toLowerCase() !== input.address.toLowerCase()
      ? "Address does not match request."
      : "",
    result.data.network !== input.network ? "Network does not match request." : "",
    result.data.riskOverview.toLowerCase().includes("vulnerability detected")
      ? "Unsupported vulnerability claim."
      : "",
  ].filter(Boolean);
  return { valid: errors.length === 0, errors };
}

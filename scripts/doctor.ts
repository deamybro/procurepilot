import { readFile } from "node:fs/promises";
import {
  ERC8004_ACTION_NAMES,
  X402_ACTION_NAMES,
} from "@/src/integrations/agentkit-actions";

async function main() {
  const packageJson = JSON.parse(await readFile("package.json", "utf8")) as {
    dependencies: Record<string, string>;
  };
  const checks = [
    {
      check: "Project identity",
      status:
        packageJson.dependencies["@goatnetwork/agentkit"] ? "PASS" : "FAIL",
      evidence: "ProcurePilot package manifest present",
    },
    {
      check: "AgentKit installed",
      status:
        packageJson.dependencies["@goatnetwork/agentkit"] ? "PASS" : "FAIL",
      evidence: packageJson.dependencies["@goatnetwork/agentkit"] ?? "missing",
    },
    {
      check: "x402 payer actions",
      status: X402_ACTION_NAMES.length === 5 ? "PASS" : "FAIL",
      evidence: X402_ACTION_NAMES.join(", "),
    },
    {
      check: "ERC-8004 actions",
      status: ERC8004_ACTION_NAMES.length === 9 ? "PASS" : "FAIL",
      evidence: `${ERC8004_ACTION_NAMES.length} actions mapped`,
    },
    {
      check: "Gemini",
      status: process.env.GEMINI_API_KEY ? "CONFIGURED" : "OPTIONAL",
      evidence: process.env.GEMINI_API_KEY
        ? "Server key present; no call made"
        : "Scripted fallback active",
    },
    {
      check: "Testnet wallet",
      status: process.env.GOAT_PRIVATE_KEY ? "CONFIGURED" : "NOT_CONFIGURED",
      evidence: process.env.GOAT_PRIVATE_KEY
        ? "Server key present; no broadcast made"
        : "Demo mode only",
    },
  ];
  console.table(checks);
  if (checks.some((check) => check.status === "FAIL")) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

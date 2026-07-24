import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name: "ProcurePilot",
    description:
      "An AI procurement agent that plans, purchases and coordinates digital services.",
    services: [
      { name: "HTTP", endpoint: "/api/ai/plan", version: "1.0.0" },
      { name: "Provider Registry", endpoint: "/api/providers", version: "1.0.0" },
    ],
    x402Support: false,
    active: true,
    registrations: [],
    supportedTrust: ["local-reputation"],
    verificationStatus: "REGISTRATION_NOT_CONFIGURED",
  });
}

# ProcurePilot Implementation Plan

ProcurePilot is a clean-slate procurement orchestration application. No code or
branding is copied from prior Pharos projects.

## Verified upstream baseline

- GOAT AgentKit `0.2.3` is pinned through the lockfile.
- The installed package exports `ActionProvider`, all five x402 payer action
  factories, `HttpMerchantGatewayAdapter`, `EvmPayerWalletAdapter`, and all nine
  ERC-8004 action factories.
- Installed action names were inspected at runtime:
  `goat.x402.payment.create`, `goat.x402.payment.submitSignature`,
  `goat.x402.payment.transfer`, `goat.x402.payment.status`,
  `goat.x402.payment.cancel`.
- GOAT testnet3 is `goat-testnet`, chain `48816`, RPC
  `https://rpc.testnet3.goat.network`.
- DIRECT is the standard x402 mode.
- Google recommends the `@google/genai` SDK. The default remains
  `gemini-2.5-flash`, which supports structured output and has a free tier.

## Delivery phases

1. Domain core: strict schemas, state machines, ranking, budget math, payment
   policy, approval hashing, repository contracts.
2. Providers: research brief, website audit, Web3 basic risk, deterministic
   validators and safe demo data.
3. Scripted demo: deterministic planner, mock x402 gateway, orchestration,
   retries, audit trail and all eight attack/failure scenarios.
4. Gemini: server-only structured planning with timeouts and Zod validation;
   deterministic enforcement remains authoritative.
5. AgentKit/x402: real official imports and action registration behind a
   configuration-gated testnet adapter. No broadcast from demo mode.
6. ERC-8004: official action registration boundary, registration documents,
   local/on-chain verification labels.
7. Product UI: responsive dashboard, plan approval, run timeline, providers,
   payments, reputation, audit, integrations and documentation.
8. Hardening: SSRF protection, sanitisation, idempotency, secret redaction,
   request limits and explicit limitations.
9. Verification: typecheck, lint, Vitest, Playwright, scripted demo, doctor and
   production build.

## Safety gates

- Real payment code is unreachable unless `NEXT_PUBLIC_APP_MODE=goat-testnet`,
  all server credentials pass validation, and an approval hash still matches.
- The user must explicitly approve any real blockchain transaction.
- No private key or merchant secret is exposed to browser code or logs.
- Missing Gemini, wallet, merchant or ERC-8004 configuration degrades to a
  labelled deterministic demo.
- Real x402, ERC-8004 registration, faucet, GitHub push and deployment remain
  unclaimed until evidence exists.

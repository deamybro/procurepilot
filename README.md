# ProcurePilot

> Tell the agent what you need. It finds, buys and coordinates the services
> required to deliver it.

ProcurePilot is an AI procurement agent that turns a goal and maximum budget
into a complete digital-service purchasing workflow. It discovers providers,
compares cost and reputation, proposes a deterministic budget-safe plan, gates
payments behind user approval, coordinates provider outputs and returns one
finished deliverable.

## Value proposition

Digital services are fragmented across agents, APIs and vendors. ProcurePilot
removes the manual coordination: the user approves one transparent plan while
the system handles provider selection, payment controls, execution, validation
and aggregation.

## Problem

- Users must discover and compare specialist providers manually.
- AI recommendations can silently ignore budgets or trade-offs.
- Payment details can drift after a user has approved them.
- Provider output is untrusted and often lacks deterministic validation.
- Simulated and on-chain evidence are frequently blurred.

## Solution

ProcurePilot separates probabilistic planning from deterministic authority.
Gemini may decompose a goal when configured, but code selects eligible
providers, computes totals, enforces policy, binds approval to a canonical hash
and validates every output.

## Example

> Analyse three competitors for a crypto wallet product. Spend no more than
> 5 USDC.

The scripted demo selects Website Audit Agent and Research Brief Agent for
2.05 USDC, adds a separately disclosed 0.25 USDC orchestration fee, records
labelled simulated settlements, validates both outputs and assembles one report.

## Architecture

```text
Next.js UI / API
       |
Planner interface ---- ScriptedDemoPlanner / GeminiPlanner
       |
Domain engine -------- states, ranking, budget, payment guard
       |
Provider registry ---- built-in / local / ERC-8004 adapter boundary
       |
Payment gateway ------ MockMerchantGateway / official AgentKit x402 boundary
       |
Storage ------------- Dexie IndexedDB / in-memory test adapters
```

See [docs/architecture.md](docs/architecture.md).

## User flow

Goal → parse → decompose → discover → compare → plan → approve → payment guard
→ x402 payment → provider execution → validation → aggregation → feedback →
deliverable.

Task and provider-job transitions are explicit and invalid transitions throw.

## Built-in providers

| Provider              | Capability               | Demo price | Demo behavior                                          |
| --------------------- | ------------------------ | ---------: | ------------------------------------------------------ |
| Research Brief Agent  | Research synthesis       |  1.20 USDC | Seeded or supplied sources; never claims live research |
| Website Audit Agent   | Static positioning audit |  0.85 USDC | Seeded demo; SSRF-safe live boundary                   |
| Web3 Basic Risk Agent | Scoped address overview  |  1.10 USDC | Deterministic facts and non-audit disclaimer           |

Two additional local comparison profiles make ranking and fallback behavior
visible without presenting them as on-chain identities.

## AI planner

`ScriptedDemoPlanner` is deterministic and always available. `GeminiPlanner`
uses the official `@google/genai` SDK, structured output, a 12-second timeout
and Zod validation when `GEMINI_API_KEY` exists. The default model is
`gemini-2.5-flash`. AI output cannot authorize or execute payment.

## Provider ranking

Default weights:

- capability match 35%
- price 20%
- reputation 20%
- completion reliability 15%
- speed 10%

All component scores and human-readable reasons are exposed.

## x402 payments

`@goatnetwork/agentkit` 0.2.3 is installed and imported by the server-only
testnet adapter. The exact registered payer actions are:

- `goat.x402.payment.create`
- `goat.x402.payment.submitSignature`
- `goat.x402.payment.transfer`
- `goat.x402.payment.status`
- `goat.x402.payment.cancel`

The default mode is DIRECT. Demo mode uses `MockMerchantGateway`, IDs beginning
with `sim_`, and `SIMULATED_SETTLEMENT:` proofs. It never generates a fake
transaction hash.

## ERC-8004 identity and reputation

All nine official AgentKit action factories are registered by the optional
testnet boundary. No agent ID is configured or claimed. Built-in providers are
`LOCAL PROFILE`; `/registration.json` truthfully sets `x402Support: false`.

## Payment safety

The deterministic guard validates recipient, chain, token and token address,
quote, per-payment/task/daily limits, duplicate order and idempotency keys,
expiry, post-approval changes, balance, typed data, previous settlement and
approval hash. A deterministic rejection cannot be overridden by AI.

## Demo mode

No API key, wallet, merchant account or faucet funds are required:

```bash
npm install
npm run dev
npm run demo
```

The interface and exported records say `SIMULATED PAYMENT`. Local demo storage
is not an immutable blockchain audit trail.

## Free AI mode

1. Copy `.env.example` to ignored `.env.local`.
2. Add `GEMINI_API_KEY` directly in that local file.
3. Keep `GEMINI_MODEL=gemini-2.5-flash` or choose another free-tier model you
   have independently verified.
4. Set `NEXT_PUBLIC_APP_MODE=ai-demo`.

Do not paste a key into chat or expose it through `NEXT_PUBLIC_*`.

## GOAT testnet mode

GOAT testnet3 uses network `goat-testnet`, chain `48816`, RPC
`https://rpc.testnet3.goat.network` and explorer
`https://explorer.testnet3.goat.network`.

The optional server adapter requires a valid testnet-only private key and
merchant credentials in `.env.local`. It is intentionally not reachable from
demo mode. Obtain explicit user approval immediately before any real
transaction. Never use a mainnet key or seed phrase.

## Quick start

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run dev
```

Node 22.13+ and npm are expected.

## Environment variables

See [.env.example](.env.example). Public variables contain only mode and public
chain metadata. Wallet and merchant credentials are server-only.

## Testing

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
npm run demo
npm run doctor
```

Tests cover states, ranking, budget and fees, payment policy and hashing,
duplicate/recipient attacks, provider validators, SSRF, Gemini structure,
Dexie, mock x402 and official AgentKit action boundaries.

## Deployment

The public demo is deployed on Vercel at
[procurepilot-goat.vercel.app](https://procurepilot-goat.vercel.app). It is
stateless on the server and persists records only in browser IndexedDB. No paid
add-on or custom domain is required. See [docs/deployment.md](docs/deployment.md).
Free personal tiers are not suitable for unlimited production use.

## Security limitations

- Scripted research is not live web research.
- Website fetching is not enabled by default.
- Web3 demo mode does not query RPC state.
- Local reputation is not verified on-chain.
- IndexedDB is device-local and user-modifiable.
- No real x402 payment or ERC-8004 feedback has been completed in this repo.

See [SECURITY.md](SECURITY.md) and [docs/security.md](docs/security.md).

## Roadmap

- Verify injected-wallet testnet signing.
- Complete a merchant-approved DIRECT testnet settlement.
- Register and verify built-in providers through ERC-8004.
- Add user-approved paid retry/fallback controls.
- Add production persistence adapters without changing the domain layer.

## Previous work

The builder previously developed Pharos SafeGuard and Pharos PermitGuard.
ProcurePilot is a separate clean-slate product.

## License

MIT. See [LICENSE](LICENSE).

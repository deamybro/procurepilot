# Form Claims Checklist

| Claim | Status | Evidence |
| --- | --- | --- |
| AgentKit installed | YES | `@goatnetwork/agentkit` 0.2.3 in manifest and lockfile |
| x402 payer actions registered | YES | Five official factories in `src/integrations/agentkit.ts`; action-name tests pass |
| x402 merchant flow working | YES, DEMO ONLY | Built-in mock merchant routes; `sim_` IDs; no real merchant claim |
| Real GOAT testnet payment completed | NO | No transaction link |
| ERC-8004 identity integrated | YES, ADAPTER BOUNDARY ONLY | Nine official actions registered; no agent ID |
| ERC-8004 reputation integrated | YES, ADAPTER BOUNDARY ONLY | Read/feedback factories registered; no on-chain evidence |
| Gemini AI working | NO | Code and validation exist; no key configured or live call evidenced |
| Scripted demo working | YES | `npm run demo` and automated tests |
| Faucet requested | MANUAL USER CONFIRMATION REQUIRED | Not requested |
| ClawUp used | NO | No evidence or dependency |
| Deployment working | NO | No external deployment performed or URL claimed |

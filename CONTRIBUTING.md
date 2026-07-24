# Contributing

1. Create a focused branch.
2. Never commit `.env.local`, wallet material or merchant credentials.
3. Preserve the demo/testnet boundary and simulation labels.
4. Add tests for every state transition, payment decision or provider claim.
5. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run build`.
6. Keep docs and `docs/form-claims-checklist.md` aligned with evidence.

Changes that enable a real transfer require separate review of approval binding,
idempotency, recipient/token/amount revalidation and log redaction.

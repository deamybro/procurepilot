# GOAT Testnet Setup

1. Keep `NEXT_PUBLIC_APP_MODE=demo` until all local tests pass.
2. Create ignored `.env.local` from `.env.example`.
3. Add only a dedicated testnet wallet key locally; never a seed phrase.
4. Obtain merchant test credentials and supported token details through the
   official process.
5. Confirm RPC chain ID `48816`.
6. Obtain faucet funds manually.
7. Inspect recipient, token, amount, expiry, approval hash and typed data.
8. Ask for explicit user approval immediately before the transaction.
9. Record the explorer URL only after confirmed settlement.

No testnet transaction has been attempted by this repository.

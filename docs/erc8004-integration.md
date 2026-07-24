# ERC-8004 Integration

The optional AgentKit boundary registers all nine documented actions for
registration, agent URI, metadata, payout wallet, feedback, revocation,
reputation and clients. GOAT testnet resolves the identity registry at
`0x556089008Fc0a60cD09390Eca93477ca254A5522`.

No agent ID or feedback transaction exists. `/registration.json` contains no
registrations and says `x402Support: false`. The UI therefore displays
`REGISTRATION NOT CONFIGURED`, not verified.

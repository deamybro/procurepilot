# Threat Model and Abuse Cases

| Threat | Control | Residual limitation |
| --- | --- | --- |
| Malicious provider metadata | Schema validation, sanitised rendering | Local owner can edit browser storage |
| Fake reputation | Source and verification labels | Local ratings are not independently verified |
| Recipient replacement | Approval hash and pre-transfer comparison | Real adapter awaits testnet validation |
| Quote manipulation | Expiry, quoted-amount and hash checks | Merchant availability is external |
| Prompt injection in output | Delimit/sanitise; deterministic validation | Semantic deception still needs review |
| Duplicate payment | Order and idempotency sets | Distributed store not included |
| AI exceeds budget | Bigint deterministic budget engine | Bad user-entered budget remains user error |
| AI bypasses confirmation | AI has no payment adapter authority | Server operator still controls configuration |
| SSRF | Protocol/hostname/IP checks, timeouts and no script execution | DNS rebinding requires production resolver pinning |
| Poisoned external content | Output treated as untrusted | Live fetch is disabled in MVP |
| Merchant credential leak | Server-only variables and redaction | Host compromise remains out of scope |
| Replayed signature | Idempotency, expiry and completed-state checks | Real signature store not yet exercised |
| False simulated claims | `sim_` IDs and visible labels | Screenshots can be altered outside the app |

Mutation routes also enforce JSON, a 64 KiB declared request limit and
same-origin checks. Production should add trusted-proxy-aware rate limiting,
DNS resolution pinning and durable atomic idempotency.

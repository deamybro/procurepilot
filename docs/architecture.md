# Architecture

ProcurePilot uses ports and adapters. `src/domain` contains schemas, states,
ranking, money and payment policy with no infrastructure authority.
`src/providers` implements the registry and built-in services. `src/planners`
contains scripted and Gemini planners. `src/payments` separates the mock
merchant from the official AgentKit testnet boundary in `src/integrations`.

Browser demo records live in Dexie IndexedDB; server tests use in-memory
repositories. Next.js routes validate external input and return one response
shape. The UI may display or request actions but cannot sign with a server key.

Trust boundaries:

1. User input → Zod validation.
2. LLM output → structured schema then deterministic recomputation.
3. Provider metadata/output → untrusted, sanitised and validated.
4. Approval → canonical details hash.
5. Payment adapter → revalidation immediately before authorization and transfer.
6. Storage/export → local, mutable and visibly labelled.

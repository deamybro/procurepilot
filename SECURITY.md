# Security Policy

## Reporting

Do not open a public issue containing a private key, merchant secret, access
token or exploit payload. Contact the maintainer privately and include only the
minimum reproducible information.

## Operational rules

- Use only testnet credentials.
- Store secrets in ignored `.env.local`; never in browser variables or storage.
- Require explicit user approval immediately before a real transaction.
- Treat provider metadata, websites and outputs as untrusted.
- Keep `NEXT_PUBLIC_APP_MODE=demo` unless testnet configuration is intentional.

## Implemented controls

Zod validation, strict TypeScript, bigint-safe token math, explicit state
machines, SSRF URL rejection, request-size and same-origin checks, secret
redaction, provider-output sanitisation, canonical approval hashes, duplicate
order/idempotency detection, quote expiry, balance checks, transfer revalidation
and labelled simulation evidence.

## Limitations

The MVP is a hackathon-grade local demo. Rate limiting is process-local/documented
rather than distributed. IndexedDB is user-controlled. Demo provider data and
reputation are not independently verified. No professional smart-contract
vulnerability audit is performed.

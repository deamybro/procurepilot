# Procurement Flow

The task lifecycle is:

`DRAFT → PLANNING → DISCOVERING_PROVIDERS → AWAITING_APPROVAL → APPROVED →
PAYMENT_CREATING → PAYMENT_AUTHORIZING → PAYMENT_TRANSFERRING →
PROVIDER_WORKING → VALIDATING_OUTPUT → AGGREGATING → COMPLETED`

Cancellation and failure are explicit terminal branches. Validation may retry a
provider once without a second payment. Additional paid work requires new user
approval. The fallback provider list is computed during planning but cannot
spend automatically.

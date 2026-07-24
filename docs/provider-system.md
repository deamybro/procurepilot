# Provider System

`ProviderRegistry` lists, resolves, discovers and adds local profiles. Every
provider declares identity, capabilities, serialisable input/output schemas,
pricing, tokens, chains, endpoint, payment and ERC-8004 metadata, operational
stats, source and verification status.

Built-in executors implement research, website-audit and Web3-risk outputs.
Validators reject missing sections, URL/address/network mismatch, unsupported
claims and absent disclaimers. Local seed data is never labelled ERC-8004
verified.

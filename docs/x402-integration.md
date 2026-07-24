# x402 Integration

Installed package: `@goatnetwork/agentkit` 0.2.3.

Official factories registered by the optional server adapter:

- `createPaymentAction`
- `submitSignatureAction`
- `transferPaymentAction`
- `paymentStatusAction`
- `cancelPaymentAction`

Runtime names are asserted in tests. DIRECT is the selected mode. The adapter
uses `HttpMerchantGatewayAdapter`, `EvmPayerWalletAdapter`, `ActionProvider`,
`PolicyEngine` and `ExecutionRuntime`.

Demo routes use `MockMerchantGateway`; this is not described as AgentKit and
cannot broadcast. Real mode still requires approved testnet credentials, wallet
funding and explicit transaction approval.

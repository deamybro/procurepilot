export const X402_ACTION_NAMES = [
  "goat.x402.payment.create",
  "goat.x402.payment.submitSignature",
  "goat.x402.payment.transfer",
  "goat.x402.payment.status",
  "goat.x402.payment.cancel",
] as const;

export const ERC8004_ACTION_NAMES = [
  "erc8004.register_agent",
  "erc8004.set_agent_uri",
  "erc8004.get_metadata",
  "erc8004.set_metadata",
  "erc8004.get_agent_wallet",
  "erc8004.give_feedback",
  "erc8004.revoke_feedback",
  "erc8004.get_reputation",
  "erc8004.get_clients",
] as const;

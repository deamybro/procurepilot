export interface DemoScenario {
  id: string;
  title: string;
  category: "HAPPY_PATH" | "CONTROL_TEST";
  prompt: string;
  budget: string;
  token: "USDC";
  expected: string;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "competitor-analysis",
    title: "Competitor analysis",
    category: "HAPPY_PATH",
    prompt:
      "Analyse three competitors for a crypto wallet product. Keep total spending under 5 USDC.",
    budget: "5.00",
    token: "USDC",
    expected: "Two providers complete and a combined report is returned.",
  },
  {
    id: "website-improvement",
    title: "Website improvement",
    category: "HAPPY_PATH",
    prompt:
      "Audit my landing page and give me the five most important improvements for under 2 USDC.",
    budget: "2.00",
    token: "USDC",
    expected: "Website Audit Agent completes a single-provider flow.",
  },
  {
    id: "web3-risk",
    title: "Web3 basic risk",
    category: "HAPPY_PATH",
    prompt:
      "Check this contract and create a basic risk summary for under 2 USDC.",
    budget: "2.00",
    token: "USDC",
    expected: "A clearly scoped non-audit report is returned.",
  },
  {
    id: "budget-exceeded",
    title: "Budget exceeded",
    category: "CONTROL_TEST",
    prompt: "Create a competitor analysis with a maximum budget of 1 USDC.",
    budget: "1.00",
    token: "USDC",
    expected: "Approval is blocked and no payment is created.",
  },
  {
    id: "low-reputation",
    title: "Low-reputation provider",
    category: "CONTROL_TEST",
    prompt: "Audit a landing page and prioritise quality over the cheapest quote.",
    budget: "2.00",
    token: "USDC",
    expected: "The higher-quality provider wins with an explanation.",
  },
  {
    id: "duplicate-payment",
    title: "Duplicate payment attack",
    category: "CONTROL_TEST",
    prompt: "Execute the same provider order twice.",
    budget: "2.00",
    token: "USDC",
    expected: "The second payment is rejected and audited.",
  },
  {
    id: "recipient-changed",
    title: "Recipient changed",
    category: "CONTROL_TEST",
    prompt: "Change the provider recipient after plan approval.",
    budget: "2.00",
    token: "USDC",
    expected: "The approval hash is invalidated.",
  },
  {
    id: "output-failure",
    title: "Provider output failure",
    category: "CONTROL_TEST",
    prompt: "Return an incomplete provider output.",
    budget: "3.00",
    token: "USDC",
    expected: "One safe retry occurs with no hidden second charge.",
  },
];

import { describe, expect, it } from "vitest";
import { rankProviders } from "@/src/domain/ranking";
import { LocalProviderRegistry } from "@/src/providers/registry";
import {
  executeResearch,
  validateResearch,
} from "@/src/providers/research";
import {
  executeWeb3Risk,
  validateWeb3Risk,
} from "@/src/providers/web3-risk";
import {
  assertSafePublicUrl,
  executeWebsiteAudit,
  validateWebsiteAudit,
} from "@/src/providers/website-audit";

describe("provider registry, capability matching and scoring", () => {
  it("discovers matching active providers", async () => {
    const providers = await new LocalProviderRegistry().discover("website-audit");
    expect(providers.map((provider) => provider.providerId)).toEqual(
      expect.arrayContaining(["provider_website", "provider_budget_audit"]),
    );
  });

  it("ranks the reputable provider above the cheaper low-reputation provider", async () => {
    const providers = await new LocalProviderRegistry().list();
    const ranking = rankProviders(
      providers,
      "website-audit",
      "USDC",
      "goat-testnet",
    );
    expect(ranking[0].providerId).toBe("provider_website");
    expect(ranking[0].reasons).toHaveLength(5);
  });
});

describe("provider output validation", () => {
  it("executes and validates research output", async () => {
    const result = await executeResearch({
      topic: "wallet positioning",
      researchQuestion: "How should a wallet build trust?",
      sourceUrls: [],
      requiredSections: [],
      maximumLength: 1_000,
    });
    expect(result.simulated).toBe(true);
    expect(result.output.sourceMode).toBe("SEEDED_DEMO");
    expect(validateResearch(result.output).valid).toBe(true);
    expect(validateResearch({ executiveSummary: "" }).valid).toBe(false);
  });

  it("executes and validates a website audit against the requested origin", async () => {
    const result = await executeWebsiteAudit({
      url: "https://example.com/landing",
      targetAudience: "Web3 founders",
      auditGoal: "Improve positioning",
    });
    expect(
      validateWebsiteAudit(result.output, "https://example.com/landing").valid,
    ).toBe(true);
    expect(
      validateWebsiteAudit(result.output, "https://different.example").valid,
    ).toBe(false);
  });

  it("executes and validates a scoped Web3 overview", async () => {
    const input = {
      network: "goat-testnet",
      address: "0x1111111111111111111111111111111111111111",
      desiredChecks: ["address format"],
    };
    const result = await executeWeb3Risk(input);
    expect(validateWeb3Risk(result.output, input).valid).toBe(true);
    expect(result.output.disclaimer).toContain("not a professional security audit");
  });
});

describe("SSRF protection", () => {
  it.each([
    "http://localhost",
    "http://127.0.0.1",
    "http://10.0.0.1",
    "http://169.254.169.254/latest/meta-data",
    "ftp://example.com/file",
    "http://service.internal",
  ])("blocks unsafe URL %s", (url) => {
    expect(() => assertSafePublicUrl(url)).toThrow();
  });

  it("allows an HTTPS public hostname", () => {
    expect(assertSafePublicUrl("https://example.com/path").hostname).toBe(
      "example.com",
    );
  });
});

import { isIP } from "node:net";
import { z } from "zod";
import type {
  ProviderExecutionResult,
  ValidationResult,
} from "@/src/domain/models";

export const WebsiteAuditInputSchema = z.object({
  url: z.string().url(),
  targetAudience: z.string().min(3),
  auditGoal: z.string().min(3),
});

export const WebsiteAuditOutputSchema = z.object({
  requestedUrl: z.string().url(),
  positioningSummary: z.string().min(40),
  strengths: z.array(z.string()).min(2),
  weaknesses: z.array(z.string()).min(2),
  missingInformation: z.array(z.string()).min(1),
  recommendations: z.array(z.string()).min(3),
  priorities: z.array(z.string()).min(3),
  observedChecks: z.array(z.string()).min(3),
  sourceMode: z.enum(["SEEDED_DEMO", "FETCHED_STATIC_HTML"]),
});

export function assertSafePublicUrl(rawUrl: string): URL {
  const url = new URL(rawUrl);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are accepted.");
  }
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  const blockedNames = new Set([
    "localhost",
    "localhost.localdomain",
    "metadata.google.internal",
    "host.docker.internal",
  ]);
  if (
    blockedNames.has(hostname) ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("Internal hostnames are blocked.");
  }
  const ipVersion = isIP(hostname);
  if (ipVersion === 4) {
    const [a, b] = hostname.split(".").map(Number);
    if (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    ) {
      throw new Error("Private, local, link-local and reserved IPs are blocked.");
    }
  }
  if (
    ipVersion === 6 &&
    (hostname === "::1" ||
      hostname.startsWith("fc") ||
      hostname.startsWith("fd") ||
      hostname.startsWith("fe80"))
  ) {
    throw new Error("Private, local and link-local IPv6 addresses are blocked.");
  }
  return url;
}

export async function executeWebsiteAudit(
  rawInput: z.infer<typeof WebsiteAuditInputSchema>,
): Promise<
  ProviderExecutionResult<z.infer<typeof WebsiteAuditOutputSchema>>
> {
  const input = WebsiteAuditInputSchema.parse(rawInput);
  const url = assertSafePublicUrl(input.url);
  const output = {
    requestedUrl: url.toString(),
    positioningSummary:
      "The seeded demo page communicates a credible product category, but the first screen does not yet connect the promise to a specific user outcome.",
    strengths: [
      "The page has a clear primary heading and one dominant call to action.",
      "The visible structure moves from problem framing to product capabilities.",
    ],
    weaknesses: [
      "The value proposition relies on category language instead of a measurable result.",
      "Proof and objection handling appear too late in the seeded page structure.",
    ],
    missingInformation: [
      "No explicit delivery time, budget example, or trust explanation is visible in the seeded snapshot.",
    ],
    recommendations: [
      "Rewrite the hero around the finished result and maximum spend.",
      "Place one proof point and one workflow preview above the fold.",
      "Explain approval and payment controls next to the primary call to action.",
    ],
    priorities: [
      "P1 — sharpen the outcome-led headline",
      "P2 — add trust and proof",
      "P3 — expose the three-step workflow",
    ],
    observedChecks: [
      "page title",
      "meta description",
      "heading hierarchy",
      "visible calls to action",
      "mobile viewport metadata",
    ],
    sourceMode: "SEEDED_DEMO" as const,
  };
  return {
    jobId: `job_site_${url.hostname.replace(/\W+/g, "_")}`,
    providerId: "provider_website",
    output,
    simulated: true,
    attempts: 1,
  };
}

export function validateWebsiteAudit(
  output: unknown,
  requestedUrl: string,
): ValidationResult {
  const result = WebsiteAuditOutputSchema.safeParse(output);
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      ),
    };
  }
  if (new URL(result.data.requestedUrl).origin !== new URL(requestedUrl).origin) {
    return { valid: false, errors: ["Returned URL does not match request."] };
  }
  return { valid: true, errors: [] };
}

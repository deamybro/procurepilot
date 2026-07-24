import type { NextRequest } from "next/server";

const MAX_REQUEST_BYTES = 64 * 1024;

export function assertMutationRequest(request: NextRequest): void {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > MAX_REQUEST_BYTES) throw new Error("REQUEST_TOO_LARGE");
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    throw new Error("CROSS_ORIGIN_MUTATION_BLOCKED");
  }
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("JSON_REQUIRED");
  }
}

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

type Mode = "demo" | "ai-demo" | "goat-testnet";

function mode(): Mode {
  const value = process.env.NEXT_PUBLIC_APP_MODE;
  return value === "ai-demo" || value === "goat-testnet" ? value : "demo";
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      ok: true,
      data,
      error: null,
      meta: { traceId: `trace_${randomUUID()}`, mode: mode() },
    },
    { status },
  );
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  recoverable = true,
) {
  return NextResponse.json(
    {
      ok: false,
      data: null,
      error: { code, message, recoverable },
      meta: { traceId: `trace_${randomUUID()}`, mode: mode() },
    },
    { status },
  );
}

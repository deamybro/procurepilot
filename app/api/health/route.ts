import { apiSuccess } from "@/src/api/response";

export async function GET() {
  return apiSuccess({
    service: "ProcurePilot",
    status: "ok",
    mode: process.env.NEXT_PUBLIC_APP_MODE ?? "demo",
    timestamp: new Date().toISOString(),
  });
}

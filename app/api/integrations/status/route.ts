import { apiSuccess } from "@/src/api/response";
import { getIntegrationStatuses } from "@/src/integrations/status";

export async function GET() {
  return apiSuccess(await getIntegrationStatuses());
}

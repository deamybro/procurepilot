import { apiSuccess } from "@/src/api/response";
import { LocalProviderRegistry } from "@/src/providers/registry";

export async function GET() {
  return apiSuccess(await new LocalProviderRegistry().list());
}

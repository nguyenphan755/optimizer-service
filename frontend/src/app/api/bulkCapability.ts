import { apiJson } from "@/app/api/http";
import type { BulkCapabilityResponse } from "@/app/api/types";

export async function postBulkCapability(
  items: { material_code: string; description_file?: string | null }[]
): Promise<BulkCapabilityResponse> {
  return apiJson<BulkCapabilityResponse>(`/api/v1/search/bulk-capability`, {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

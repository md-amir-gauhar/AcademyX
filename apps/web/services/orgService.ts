import axios from "axios";
import { endpoints } from "@/lib/api/endpoints";
import { env } from "@/lib/env";
import { toApiError } from "@/lib/api/errors";
import type { OrgConfig } from "@/types/org";
import type { ApiSuccess } from "@/types/api";

export async function fetchOrgConfig(slug: string): Promise<OrgConfig> {
  try {
    const res = await axios.get<ApiSuccess<OrgConfig>>(
      `${env.apiUrl.replace(/\/$/, "")}/api${endpoints.orgConfig(slug)}`,
      { headers: { Accept: "application/json" } }
    );
    return res.data.data;
  } catch (err) {
    throw toApiError(err);
  }
}

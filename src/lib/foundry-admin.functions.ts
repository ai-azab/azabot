import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Return setup health without ever disclosing the Foundry API key. */
export const getFoundrySettingsStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error || !data) throw new Error("غير مصرح لك بعرض إعدادات Foundry");

    const endpoint = process.env.FOUNDRY_PROJECT_ENDPOINT || "";
    let endpointHost = "";
    try {
      if (endpoint) endpointHost = new URL(endpoint).host;
    } catch {
      // Invalid endpoint is reported as unconfigured.
    }
    return {
      endpointConfigured: Boolean(endpointHost),
      endpointHost,
      credentialConfigured: Boolean(process.env.FOUNDRY_API_KEY),
      modelConfigured: Boolean(process.env.FOUNDRY_MODEL),
    };
  });

export interface DiscoveredFoundryAgent {
  name: string;
  description: string;
  version: string | null;
}

/** Read-only remote discovery; no changes to Foundry or Supabase. */
export const discoverFoundryAgents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DiscoveredFoundryAgent[]> => {
    const { data: admin, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error || !admin) throw new Error("غير مصرح لك بعرض وكلاء Foundry");
    const endpoint = process.env.FOUNDRY_PROJECT_ENDPOINT;
    const token = process.env.FOUNDRY_ACCESS_TOKEN || process.env.FOUNDRY_API_KEY;
    if (!endpoint || !token) throw new Error("يلزم إعداد بيانات اتصال Foundry على الخادم");
    const root = new URL(endpoint);
    if (root.protocol !== "https:" || !root.hostname.endsWith(".services.ai.azure.com")) {
      throw new Error("عنوان مشروع Foundry غير صالح");
    }
    const records: DiscoveredFoundryAgent[] = [];
    const seen = new Set<string>();
    let after: string | null = null;
    for (let page = 0; page < 20; page++) {
      const url = new URL(root.toString().replace(/\/+$/, "") + "/agents");
      url.searchParams.set("api-version", "v1");
      url.searchParams.set("limit", "100");
      if (after) url.searchParams.set("after", after);
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: "Bearer " + token,
          ...(process.env.FOUNDRY_ACCESS_TOKEN ? {} : { "api-key": token }),
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error("فشل اكتشاف وكلاء Foundry (HTTP " + response.status + "). تحقق من صلاحيات الاعتماد.");
      const result = await response.json() as {
        data?: Array<{ id?: string; name?: string; description?: string; version?: string | number; latest_version?: string | number; versions?: { latest?: { version?: string | number; description?: string } } }>;
        has_more?: boolean;
        last_id?: string;
      };
      for (const item of Array.isArray(result.data) ? result.data : []) {
        if (!item.name || seen.has(item.name)) continue;
        seen.add(item.name);
        records.push({
          name: item.name,
          description: item.description || "",
          version: item.versions?.latest?.version != null ? String(item.versions.latest.version) : item.latest_version != null ? String(item.latest_version) : item.version != null ? String(item.version) : null,
        });
      }
      if (!result.has_more || !result.last_id || result.last_id === after) break;
      after = result.last_id;
      if (page === 19) throw new Error("تجاوز عدد الوكلاء نطاق الفحص الحالي");
    }
    return records;
  });

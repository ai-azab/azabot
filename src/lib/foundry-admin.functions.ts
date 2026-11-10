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

/** Server-side Foundry v1 transport. Never return tokens to the browser. */
const API_SCOPE = "https://ai.azure.com/.default";
let cache: { token: string; until: number } | null = null;

export function foundryBase(): string {
  const raw =
    process.env.FOUNDRY_PROJECT_ENDPOINT ||
    process.env.AZURE_FOUNDRY_PROJECT_ENDPOINT ||
    process.env.AZURE_EXISTING_AIPROJECT_ENDPOINT ||
    process.env.AZURE_AI_FOUNDRY_ENDPOINT;
  if (!raw) throw new Error("FOUNDRY_PROJECT_ENDPOINT is missing");
  const url = new URL(raw);
  if (
    url.protocol !== "https:" ||
    !url.hostname.endsWith(".services.ai.azure.com") ||
    !/^\/api\/projects\/[A-Za-z0-9._-]+\/?$/.test(url.pathname)
  ) throw new Error("Invalid Microsoft Foundry project endpoint");
  return url.toString().replace(/\/+$/, "");
}

function serverApiKey(): string | null {
  const key = process.env.FOUNDRY_API_KEY ||
    process.env.AZURE_FOUNDRY_ACCOUNT_KEY ||
    process.env.AZURE_FOUNDRY_ACCOUNT_KEY1 ||
    process.env.AZURE_FOUNDRY_ACCOUNT_KEY2;
  return key?.trim() || null;
}

async function accessToken(): Promise<string> {
  if (cache && cache.until > Date.now() + 60_000) return cache.token;
  const tenant = process.env.FOUNDRY_TENANT_ID;
  const client = process.env.FOUNDRY_CLIENT_ID;
  const secret = process.env.FOUNDRY_CLIENT_SECRET;
  if (tenant && client && secret) {
    const response = await fetch(
      `https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: client,
          client_secret: secret,
          scope: API_SCOPE,
        }),
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!response.ok) throw new Error(`Foundry Entra authentication failed (HTTP ${response.status})`);
    const json = await response.json() as { access_token?: string; expires_in?: number };
    if (!json.access_token) throw new Error("Foundry access token is missing");
    cache = {
      token: json.access_token,
      until: Date.now() + Math.max(60, json.expires_in ?? 3600) * 1000,
    };
    return cache.token;
  }
  // Explicit access token supports short-lived manual diagnostics; production should use Entra credentials.
  const provided = process.env.FOUNDRY_ACCESS_TOKEN;
  if (provided) return provided;
  throw new Error("FOUNDRY_TENANT_ID / FOUNDRY_CLIENT_ID / FOUNDRY_CLIENT_SECRET required");
}

export async function foundryRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const base = foundryBase();
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error("Invalid Foundry path");
  const headers = new Headers(init.headers);
  // Use short-lived Entra tokens when configured; otherwise use the existing
  // Foundry project API key via the documented api-key header.
  const hasEntra = Boolean(
    process.env.FOUNDRY_ACCESS_TOKEN ||
    (process.env.FOUNDRY_TENANT_ID && process.env.FOUNDRY_CLIENT_ID && process.env.FOUNDRY_CLIENT_SECRET)
  );
  if (hasEntra) {
    headers.set("Authorization", `Bearer ${await accessToken()}`);
    headers.delete("api-key");
  } else {
    const key = serverApiKey();
    if (!key) throw new Error("Foundry credentials missing: configure FOUNDRY_API_KEY or Microsoft Entra");
    headers.delete("Authorization");
    headers.set("api-key", key);
  }
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  const response = await fetch(base + path, {
    ...init,
    headers,
    signal: init.signal ?? AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    // Never return Azure response bodies, which may contain sensitive content.
    throw new Error(`Foundry request failed (HTTP ${response.status}, path ${path.split("?")[0]})`);
  }
  return await response.json() as T;
}

export function foundryCredentialsPresent(): boolean {
  return Boolean(serverApiKey() || process.env.FOUNDRY_ACCESS_TOKEN ||
    (process.env.FOUNDRY_TENANT_ID && process.env.FOUNDRY_CLIENT_ID && process.env.FOUNDRY_CLIENT_SECRET));
}

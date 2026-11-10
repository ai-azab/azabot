export interface AzureOpenAIConfig {
  endpoint: string;
  apiKey: string;
  deployment: string;
  apiVersion: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  enabled: boolean;
}

export const DEFAULT_AZURE_CONFIG: AzureOpenAIConfig = {
  endpoint: "",
  apiKey: "",
  deployment: "",
  apiVersion: "2024-08-01-preview",
  temperature: 0.7,
  maxTokens: 800,
  systemPrompt:
    "أنت مساعد ذكي ومحترف يجيب باللغة العربية بشكل واضح ومختصر، وتساعد المستخدم في استفساراته حول المنتج والخدمات.",
  enabled: false,
};

const LS_KEY = "azab.admin.azure";

export function loadAzureConfig(): AzureOpenAIConfig {
  if (typeof window === "undefined") return DEFAULT_AZURE_CONFIG;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_AZURE_CONFIG;
    const stored = JSON.parse(raw) as Partial<AzureOpenAIConfig>;
    // Discard old plaintext API credentials persisted by previous releases.
    window.localStorage.removeItem(LS_KEY);
    return { ...DEFAULT_AZURE_CONFIG, ...stored, apiKey: "" };
  } catch {
    return DEFAULT_AZURE_CONFIG;
  }
}

export function saveAzureConfig(cfg: AzureOpenAIConfig) {
  if (typeof window === "undefined") return;
  // Never persist Azure API credentials or integration parameters in browser storage.
  // The connection remains usable for an in-session administrator test only.
  window.localStorage.removeItem(LS_KEY);
  void cfg;
}

export interface TrainingExample {
  id: string;
  question: string;
  answer: string;
  createdAt: number;
}

const LS_TRAINING = "azab.admin.training";

export function loadTrainingExamples(): TrainingExample[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_TRAINING);
    return raw ? (JSON.parse(raw) as TrainingExample[]) : [];
  } catch {
    return [];
  }
}

export function saveTrainingExamples(items: TrainingExample[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_TRAINING, JSON.stringify(items));
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, XCircle, ExternalLink, ShieldCheck } from "lucide-react";
import { getFoundrySettingsStatus } from "@/lib/foundry-admin.functions";
import { AgentsPage } from "./admin.agents";

export const Route = createFileRoute("/admin/foundry")({
  component: FoundrySettingsPage,
});

function FoundrySettingsPage() {
  const loadStatus = useServerFn(getFoundrySettingsStatus);
  const status = useQuery({
    queryKey: ["admin", "foundry", "status"],
    queryFn: () => loadStatus(),
  });
  const checks = [
    { label: "FOUNDRY_PROJECT_ENDPOINT", ok: status.data?.endpointConfigured },
    { label: "FOUNDRY_API_KEY", ok: status.data?.credentialConfigured },
    { label: "FOUNDRY_MODEL", ok: status.data?.modelConfigured },
  ];

  return (
    <div dir="rtl" className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">إعدادات وكلاء Microsoft Foundry</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          اربط وكلاء مشروع Foundry بواجهة عزبوت: أدخل الاسم والإصدار لكل وكيل، ثم فعّله ليظهر في زر تبديل الوكلاء.
          يتم تنفيذ الطلبات عبر الخادم، ولا تُحفظ مفاتيح Foundry في المتصفح.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {checks.map((check) => (
            <div key={check.label} className="rounded-xl border border-slate-200 bg-[#f4f5fb] p-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                {status.isLoading ? (
                  <span className="h-4 w-4 animate-pulse rounded-full bg-slate-300" />
                ) : check.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                {check.label}
              </div>
            </div>
          ))}
        </div>
        {status.data?.endpointHost && (
          <p dir="ltr" className="mt-3 break-all text-xs text-muted-foreground">
            {status.data.endpointHost}
          </p>
        )}
        {status.error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            تعذر فحص إعدادات الاتصال: {(status.error as Error).message}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
          <ShieldCheck className="h-4 w-4" />
          <span>تُضبط بيانات الاتصال في متغيرات بيئة الخادم فقط.</span>
          <a
            href="https://learn.microsoft.com/en-us/azure/ai-foundry/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline"
          >
            Microsoft Foundry <ExternalLink className="h-3 w-3" />
          </a>
          <Link to="/admin/integration" className="underline">إعدادات Azure OpenAI السابقة</Link>
        </div>
      </section>
      <AgentsPage />
    </div>
  );
}

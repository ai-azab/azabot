# Azabot

مساعد ذكي للصيانة والعمليات من AlazabDev: واجهة دردشة/صوت + لوحة إدارة + وكلاء متخصصين (Azure AI Foundry) فوق Supabase.

## Stack

TanStack Start (React 19, Vite 7) · Tailwind 4 + shadcn/ui · Supabase (Auth, Postgres, Edge Functions) · Cloudflare Workers · Azure AI Foundry · Bun

## Structure

- `src/routes` — الصفحات (`help` بوابة العملاء، `admin.*`, `support.*`, `embed`) و`api/public/agents/$slug`
- `src/lib/agents` — تعريفات الوكلاء ومحرك التنفيذ (`az-model-core`)
- `src/components/chatbot` — الودجت (نص + صوت)
- `supabase/` — migrations و edge functions

## Run

```bash
cp .env.example .env
bun install
bun run dev
```

Checks: `bun run lint && bun run typecheck && bun run build`

## API

`POST /api/public/agents/<slug>` — `Authorization: Bearer <supabase access token>`, body: `{ message, history? }`

## بوابة العملاء (`/help`)

صفحة عامة: شات كامل الشاشة مع وكيل الصيانة، وأسئلة شائعة. تفتح جلسة Supabase مجهولة تلقائياً، لذلك لازم تفعّل **Authentication → Sign In / Providers → Allow anonymous sign-ins** في المشروع.

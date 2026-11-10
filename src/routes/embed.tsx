import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChatbotWidget } from "@/components/chatbot/ChatbotWidget";

export const Route = createFileRoute("/embed")({
  component: EmbedPage,
  head: () => ({
    meta: [
      { title: "عزبوت — نافذة الدردشة المدمجة" },
      {
        name: "description",
        content: "نافذة الدردشة المدمجة لمساعد عزبوت، تُحمَّل داخل أي موقع عبر كود التضمين.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "عزبوت — نافذة الدردشة المدمجة" },
      {
        property: "og:description",
        content: "نافذة الدردشة المدمجة لمساعد عزبوت لأي موقع إلكتروني.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function trustedParentOrigin(): string | null {
  try {
    if (!document.referrer) return null;
    const parent = new URL(document.referrer);
    const allowed = parent.protocol === "https:" &&
      (parent.hostname === "alazab.com" || parent.hostname.endsWith(".alazab.com"));
    return allowed ? parent.origin : null;
  } catch { return null; }
}

function EmbedPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Transparent page so only the widget shows over the host site.
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    document.body.style.overflow = "hidden";
    const target = trustedParentOrigin();
    if (target && window.parent !== window) window.parent.postMessage({ source: "azabot", type: "ready" }, target);
  }, []);

  const notify = (open: boolean) => {
    const target = trustedParentOrigin();
    if (target && window.parent !== window) window.parent.postMessage({ source: "azabot", type: open ? "open" : "close" }, target);
  };

  const notifyState = (state: "collapsed" | "expanded" | "open" | "agents") => {
    const target = trustedParentOrigin();
    if (target && window.parent !== window) window.parent.postMessage({ source: "azabot", type: "layout", state }, target);
  };

  if (!mounted) return null;

  return (
    <div dir="rtl" className="h-dvh w-full bg-transparent">
      <ChatbotWidget onOpenChange={notify} onStateChange={notifyState} />
    </div>
  );
}

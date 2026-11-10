import { useState } from "react";
import { ChatButton } from "./ChatButton";
import { ChatWindow } from "./ChatWindow";
import { useChatSession } from "./useChatSession";

export function ChatbotWidget({
  onOpenChange,
  onStateChange,
}: {
  /** Notified whenever the chat window is opened or closed (used by the embed page). */
  onOpenChange?: (open: boolean) => void;
  onStateChange?: (state: "collapsed" | "expanded" | "open") => void;
} = {}) {
  const [open, setOpen] = useState(false);
  const [launcherExpanded, setLauncherExpanded] = useState(false);
  const [callRequest, setCallRequest] = useState(0);

  const setOpenState = (next: boolean) => {
    setOpen(next);
    if (next) setLauncherExpanded(false);
    onOpenChange?.(next);
    onStateChange?.(next ? "open" : "collapsed");
  };
  const setLauncherState = (expanded: boolean) => {
    setLauncherExpanded(expanded);
    onStateChange?.(expanded ? "expanded" : "collapsed");
  };
  const startCall = () => {
    setCallRequest((value) => value + 1);
    setOpenState(true);
  };
  const {
    hydrated,
    sessionState,
    messages,
    setMessages,
    settings,
    setSettings,
    conversationId,
    setConversationId,
    selectedAgentId,
    setSelectedAgentId,
  } = useChatSession({ ensureSession: true });

  if (!hydrated) return null;

  if (sessionState === "unavailable") {
    return <div dir="rtl" role="alert" className="fixed bottom-4 right-4 z-[9999] max-w-xs rounded-xl border border-red-200 bg-white p-3 text-sm text-red-700 shadow-lg">
      لا يمكن بدء جلسة الزائر حاليًا. يجب تفعيل Anonymous Sign-ins في Supabase Authentication.
    </div>;
  }
  if (sessionState !== "ready") return null;

  return (
    <>
      <ChatWindow
        open={open}
        messages={messages}
        setMessages={setMessages}
        conversationId={conversationId}
        setConversationId={setConversationId}
        settings={settings}
        setSettings={setSettings}
        callRequest={callRequest}
        selectedAgentId={selectedAgentId}
        onClose={() => setOpenState(false)}
      />
      <ChatButton
        isOpen={open}
        isExpanded={launcherExpanded}
        selectedAgentId={selectedAgentId}
        onSelectAgent={(agent) => {
          if (agent.id !== selectedAgentId) {
            setSelectedAgentId(agent.id);
            setConversationId("");
            setMessages([]);
          }
        }}
        onExpand={() => setLauncherState(true)}
        onCollapse={() => setLauncherState(false)}
        onOpenChat={() => setOpenState(true)}
        onStartCall={startCall}
      />
    </>
  );
}

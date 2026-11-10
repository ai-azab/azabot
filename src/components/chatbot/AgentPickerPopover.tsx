"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Boxes,
  Building2,
  Check,
  CreditCard,
  DollarSign,
  Package,
  Wrench,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { listPublicAgents } from "@/lib/agents/dispatcher.functions";

export interface AgentItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  isDefault: boolean;
}

interface AgentPickerPopoverProps {
  selectedAgentId?: string;
  onSelectAgent?: (agent: AgentItem) => void;
  onOpenChange?: (open: boolean) => void;
}

const iconBySlug = {
  azabot: Bot,
  maint: Wrench,
  payments: CreditCard,
  finance: DollarSign,
  project: Building2,
  bim: Boxes,
  prod: Package,
} as const;

export function AgentPickerPopover({ selectedAgentId, onSelectAgent, onOpenChange }: AgentPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    listPublicAgents()
      .then((items) => {
        if (active) setAgents(items);
      })
      .catch(() => {
        if (active) setError(true);
      }).finally(() => { if (active) setLoading(false); });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => { onOpenChange?.(open); }, [open, onOpenChange]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    const onEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const selected = useMemo(
    () =>
      agents.find((agent) => agent.id === selectedAgentId) ??
      agents.find((agent) => agent.isDefault) ??
      agents[0],
    [agents, selectedAgentId],
  );

  const SelectedIcon = selected
    ? (iconBySlug[selected.slug as keyof typeof iconBySlug] ?? Bot)
    : Bot;

  return (
    <div ref={rootRef} className="relative min-w-0">
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={selected ? `اختيار الوكيل: ${selected.name}` : "اختيار الوكيل"}
        title={selected?.name ?? "اختيار الوكيل"}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-azab-amber text-azab-navy transition hover:brightness-95"
      >
        <SelectedIcon className="h-4 w-4" />
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-[calc(100%+10px)] left-1/2 z-[10020] w-[min(320px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:left-auto sm:right-0 sm:translate-x-0"
        >
          <p className="px-2 pb-2 pt-1 text-right text-[11px] font-medium text-muted-foreground">
            الوكلاء المتاحون
          </p>

          <div className="max-h-[min(420px,60dvh)] space-y-1 overflow-y-auto overscroll-contain">
            {agents.map((agent) => {
              const Icon = iconBySlug[agent.slug as keyof typeof iconBySlug] ?? Bot;
              const active = agent.id === selected?.id;

              return (
                <Button
                  variant="ghost"
                  key={agent.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onSelectAgent?.(agent);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex h-auto w-full items-center gap-2 rounded-md px-2 py-2 text-right transition",
                    active ? "bg-azab-soft" : "hover:bg-azab-soft",
                  )}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center text-primary">
                    {active ? <Check className="h-4 w-4" /> : null}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-foreground">
                      {agent.name}
                    </span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {agent.description}
                    </span>
                  </span>

                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-azab-soft text-primary">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

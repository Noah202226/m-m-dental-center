"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search, Home, Users, Package, FileText, Settings, Plus, UserPlus } from "lucide-react";
import { cn } from "../../lib/utils";
import { Dialog, DialogContent } from "./Dialog";

export function CommandPalette({
  open,
  onOpenChange,
  onSelectAction,
  patients = [],
}) {
  React.useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onOpenChange]);

  const runCommand = (command) => {
    onOpenChange(false);
    command();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 max-w-xl border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <CommandPrimitive className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-transparent">
          <div className="flex items-center border-b border-[hsl(var(--border))] px-3.5">
            <Search className="mr-2.5 h-4 w-4 shrink-0 opacity-50 text-[hsl(var(--foreground))]" />
            <CommandPrimitive.Input
              placeholder="Type a command or search patients..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-[hsl(var(--muted-foreground))] disabled:cursor-not-allowed disabled:opacity-50 text-[hsl(var(--foreground))]"
            />
            <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-1.5 font-mono text-[10px] font-medium text-[hsl(var(--muted-foreground))]">
              ESC
            </kbd>
          </div>

          <CommandPrimitive.List className="max-h-[320px] overflow-y-auto p-2">
            <CommandPrimitive.Empty className="py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
              No results found.
            </CommandPrimitive.Empty>

            <CommandPrimitive.Group heading="Navigation" className="text-xs font-medium text-[hsl(var(--muted-foreground))] px-2 py-1.5 [&_[cmdk-group-heading]]:text-[hsl(var(--muted-foreground))] [&_[cmdk-group-heading]]:font-semibold">
              <CommandPrimitive.Item
                onSelect={() => runCommand(() => onSelectAction("nav", "dashboard"))}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-amber-500/15 hover:text-amber-400 aria-selected:bg-amber-500/15 aria-selected:text-amber-400 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Dashboard Overview</span>
              </CommandPrimitive.Item>
              <CommandPrimitive.Item
                onSelect={() => runCommand(() => onSelectAction("nav", "patients"))}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-amber-500/15 hover:text-amber-400 aria-selected:bg-amber-500/15 aria-selected:text-amber-400 transition-colors"
              >
                <Users className="h-4 w-4" />
                <span>Patients Directory</span>
              </CommandPrimitive.Item>
              <CommandPrimitive.Item
                onSelect={() => runCommand(() => onSelectAction("nav", "products"))}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-amber-500/15 hover:text-amber-400 aria-selected:bg-amber-500/15 aria-selected:text-amber-400 transition-colors"
              >
                <Package className="h-4 w-4" />
                <span>Products & Supplies</span>
              </CommandPrimitive.Item>
              <CommandPrimitive.Item
                onSelect={() => runCommand(() => onSelectAction("nav", "reports"))}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-amber-500/15 hover:text-amber-400 aria-selected:bg-amber-500/15 aria-selected:text-amber-400 transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span>Sales & Expense Reports</span>
              </CommandPrimitive.Item>
              <CommandPrimitive.Item
                onSelect={() => runCommand(() => onSelectAction("nav", "settings"))}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-amber-500/15 hover:text-amber-400 aria-selected:bg-amber-500/15 aria-selected:text-amber-400 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Settings & Services</span>
              </CommandPrimitive.Item>
            </CommandPrimitive.Group>

            <CommandPrimitive.Separator className="my-1 h-px bg-[hsl(var(--border))]" />

            <CommandPrimitive.Group heading="Quick Actions" className="text-xs font-medium text-[hsl(var(--muted-foreground))] px-2 py-1.5 [&_[cmdk-group-heading]]:text-[hsl(var(--muted-foreground))] [&_[cmdk-group-heading]]:font-semibold">
              <CommandPrimitive.Item
                onSelect={() => runCommand(() => onSelectAction("action", "new-patient"))}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-amber-500/15 hover:text-amber-400 aria-selected:bg-amber-500/15 aria-selected:text-amber-400 transition-colors"
              >
                <UserPlus className="h-4 w-4 text-amber-500" />
                <span>Register New Patient</span>
              </CommandPrimitive.Item>
              <CommandPrimitive.Item
                onSelect={() => runCommand(() => onSelectAction("action", "add-expense"))}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-amber-500/15 hover:text-amber-400 aria-selected:bg-amber-500/15 aria-selected:text-amber-400 transition-colors"
              >
                <Plus className="h-4 w-4 text-emerald-500" />
                <span>Record Clinic Expense</span>
              </CommandPrimitive.Item>
            </CommandPrimitive.Group>

            {patients.length > 0 && (
              <>
                <CommandPrimitive.Separator className="my-1 h-px bg-[hsl(var(--border))]" />
                <CommandPrimitive.Group heading="Patients" className="text-xs font-medium text-[hsl(var(--muted-foreground))] px-2 py-1.5 [&_[cmdk-group-heading]]:text-[hsl(var(--muted-foreground))] [&_[cmdk-group-heading]]:font-semibold">
                  {patients.slice(0, 10).map((p) => (
                    <CommandPrimitive.Item
                      key={p.$id}
                      value={`${p.patientName || p.name} ${p.serviceName || ""}`}
                      onSelect={() =>
                        runCommand(() => onSelectAction("patient", p))
                      }
                      className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-amber-500/15 hover:text-amber-400 aria-selected:bg-amber-500/15 aria-selected:text-amber-400 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 opacity-60" />
                        <span className="font-medium">{p.patientName || p.name}</span>
                      </div>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        {p.serviceName || "Patient"}
                      </span>
                    </CommandPrimitive.Item>
                  ))}
                </CommandPrimitive.Group>
              </>
            )}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}

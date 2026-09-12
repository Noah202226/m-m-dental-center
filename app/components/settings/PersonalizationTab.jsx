"use client";

import { useEffect, useState } from "react";
import { usePersonalizationStore } from "../../stores/usePersonalizationStore";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Palette, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function PersonalizationTab() {
  const {
    clientTitle,
    clientInitial,
    fetchPersonalization,
    setClientTitle,
    setClientInitial,
  } = usePersonalizationStore();

  const [title, setTitle] = useState("");
  const [initial, setInitial] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPersonalization();
  }, [fetchPersonalization]);

  useEffect(() => {
    setTitle(clientTitle || "M&M Dental Center");
    setInitial(clientInitial || "MM");
  }, [clientTitle, clientInitial]);

  const handleSave = async () => {
    if (!title.trim()) return toast.error("Practice title cannot be empty");
    if (!initial.trim()) return toast.error("Profile initial cannot be empty");

    setLoading(true);
    try {
      await setClientTitle(title);
      await setClientInitial(initial);
      toast.success("Branding preferences saved! ✨", {
        description: `Header updated to "${title}" (${initial}).`,
      });
    } catch {
      toast.error("Failed to save branding preferences");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2 text-[hsl(var(--foreground))]">
          <Palette className="h-4 w-4 text-amber-500" />
          <span>Practice Branding & Title</span>
        </h3>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
          Customize the clinic name and avatar initials displayed across headers, invoices, and sidebars
        </p>
      </div>

      {/* Live Preview Card */}
      <div className="p-4 rounded-xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))] flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 flex items-center justify-center font-bold text-base shrink-0">
          {initial || "MM"}
        </div>
        <div>
          <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider block">
            Live Header Preview
          </span>
          <p className="text-base font-bold text-[hsl(var(--foreground))]">
            {title || "M&M Dental Center"}
          </p>
          <p className="text-[11px] text-amber-500 font-medium">
            Clinical Management System
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Profile Initial */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
            Avatar Initial (Max 2 characters)
          </label>
          <Input
            type="text"
            placeholder="MM"
            maxLength={2}
            value={initial}
            onChange={(e) => setInitial(e.target.value.toUpperCase())}
            disabled={loading}
            className="w-32 uppercase font-bold"
          />
        </div>

        {/* Client Software Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
            Practice / Clinic Display Name
          </label>
          <Input
            type="text"
            placeholder="e.g. M&M Dental Center"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />
        </div>

        <Button onClick={handleSave} loading={loading} className="gap-1.5">
          <Sparkles size={15} />
          <span>Save Branding</span>
        </Button>
      </div>
    </div>
  );
}

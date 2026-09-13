"use client";

import { useEffect, useState } from "react";
import { usePersonalizationStore } from "../../stores/usePersonalizationStore";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  Palette,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Building2,
  Check,
} from "lucide-react";
import { toast } from "sonner";

const ACCENT_COLORS = [
  { id: "gold", label: "M&M Gold", bg: "bg-amber-500", border: "border-amber-500" },
  { id: "emerald", label: "Dental Emerald", bg: "bg-emerald-500", border: "border-emerald-500" },
  { id: "sky", label: "Clinical Sky", bg: "bg-sky-500", border: "border-sky-500" },
  { id: "violet", label: "Modern Violet", bg: "bg-violet-500", border: "border-violet-500" },
  { id: "rose", label: "Warm Rose", bg: "bg-rose-500", border: "border-rose-500" },
];

export default function PersonalizationTab() {
  const {
    businessName,
    clientInitial,
    phone,
    email,
    address,
    accentColor,
    fetchPersonalization,
    savePersonalization,
    isLoading: storeLoading,
  } = usePersonalizationStore();

  const [form, setForm] = useState({
    businessName: "",
    initial: "",
    phone: "",
    email: "",
    address: "",
    accentColor: "gold",
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPersonalization();
  }, [fetchPersonalization]);

  useEffect(() => {
    setForm({
      businessName: businessName || "M&M Dental Center",
      initial: clientInitial || "MM",
      phone: phone || "",
      email: email || "",
      address: address || "",
      accentColor: accentColor || "gold",
    });
  }, [businessName, clientInitial, phone, email, address, accentColor]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!form.businessName.trim()) {
      return toast.error("Clinic name cannot be empty");
    }
    if (!form.initial.trim()) {
      return toast.error("Clinic initials cannot be empty");
    }

    setIsSaving(true);
    try {
      await savePersonalization({
        businessName: form.businessName.trim(),
        title: form.businessName.trim(),
        initial: form.initial.trim().toUpperCase(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        accentColor: form.accentColor,
      });
      toast.success("Clinic branding & contact info saved! ✨", {
        description: `Updated header and booking details for "${form.businessName}".`,
      });
    } catch {
      toast.error("Failed to save clinic personalization");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2 text-[hsl(var(--foreground))]">
          <Palette className="h-4 w-4 text-amber-500" />
          <span>Practice Branding & Clinic Identity</span>
        </h3>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
          Configure clinic name, avatar initials, and patient contact information shown across the management system and public booking portal
        </p>
      </div>

      {/* Live Previews Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Header Preview */}
        <div className="p-4 rounded-xl bg-[hsl(var(--muted))]/40 border border-[hsl(var(--border))] flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 flex items-center justify-center font-bold text-base shrink-0">
            {form.initial || "MM"}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider block">
              Header & Sidebar Preview
            </span>
            <p className="text-sm font-bold text-[hsl(var(--foreground))] truncate">
              {form.businessName || "M&M Dental Center"}
            </p>
            <p className="text-[11px] text-amber-500 font-medium">
              Clinical Management System
            </p>
          </div>
        </div>

        {/* Public Booking Card Preview */}
        <div className="p-4 rounded-xl bg-[hsl(var(--muted))]/40 border border-[hsl(var(--border))] flex flex-col justify-center space-y-1.5">
          <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider block">
            Public Booking Card Preview
          </span>
          <p className="text-xs font-semibold text-[hsl(var(--foreground))] truncate">
            {form.businessName || "M&M Dental Center"}
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] text-[hsl(var(--muted-foreground))]">
            {form.phone && (
              <span className="flex items-center gap-1">
                <Phone size={11} className="text-amber-500" />
                {form.phone}
              </span>
            )}
            {form.email && (
              <span className="flex items-center gap-1">
                <Mail size={11} className="text-amber-500" />
                {form.email}
              </span>
            )}
          </div>
          {form.address && (
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1 truncate">
              <MapPin size={11} className="text-amber-500 shrink-0" />
              {form.address}
            </p>
          )}
        </div>
      </div>

      {/* Input Fields */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Avatar Initial */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Avatar Initials (Max 2 chars)
            </label>
            <Input
              type="text"
              placeholder="MM"
              maxLength={2}
              value={form.initial}
              onChange={(e) => handleChange("initial", e.target.value.toUpperCase())}
              disabled={isSaving}
              className="uppercase font-bold tracking-widest text-center"
            />
          </div>

          {/* Business / Practice Name */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
              <Building2 size={13} className="text-amber-500" />
              <span>Practice / Clinic Display Name</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. M&M Dental Center"
              value={form.businessName}
              onChange={(e) => handleChange("businessName", e.target.value)}
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Contact Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
              <Phone size={13} className="text-amber-500" />
              <span>Clinic Phone / Mobile</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. 0917-123-4567"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              disabled={isSaving}
            />
          </div>

          {/* Contact Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
              <Mail size={13} className="text-amber-500" />
              <span>Official Clinic Email</span>
            </label>
            <Input
              type="email"
              placeholder="e.g. clinic@example.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Physical Address */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
            <MapPin size={13} className="text-amber-500" />
            <span>Clinic Physical Address</span>
          </label>
          <Input
            type="text"
            placeholder="e.g. Suite 201, Medical Plaza, Quezon City, Metro Manila"
            value={form.address}
            onChange={(e) => handleChange("address", e.target.value)}
            disabled={isSaving}
          />
        </div>

        {/* Accent Color Palette */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
            Brand Accent Color
          </label>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {ACCENT_COLORS.map((c) => {
              const isSelected = form.accentColor === c.id;
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => handleChange("accentColor", c.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                    isSelected
                      ? "border-amber-500 bg-amber-500/15 text-[hsl(var(--foreground))]"
                      : "border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))]"
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${c.bg} flex items-center justify-center text-black font-bold`}>
                    {isSelected && <Check size={10} className="text-white" />}
                  </span>
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" loading={isSaving || storeLoading} className="gap-1.5">
            <Sparkles size={15} />
            <span>Save Branding & Clinic Details</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

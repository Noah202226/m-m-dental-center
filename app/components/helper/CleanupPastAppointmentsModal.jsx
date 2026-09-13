"use client";

import React, { useState, useMemo } from "react";
import {
  Trash2,
  Download,
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  AlertTriangle,
  Loader2,
  Calendar,
  Info,
} from "lucide-react";
import { subMonths, format } from "date-fns";
import { databases } from "@/app/lib/appwrite";
import { notify } from "@/app/lib/notify";
import clsx from "clsx";

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
const COLLECTION_ID = "appointments";
const REQUIRED_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

// Helper to determine appointment status category
const getStatusCategory = (e) => {
  if (!e) return "pending";
  if (
    e.attendanceStatus === "not-attended" ||
    e.attendanceStatus === "cancelled" ||
    e.status === "cancelled" ||
    e.status === "declined"
  ) {
    return "cancelled";
  }
  if (e.attendanceStatus === "attended" || e.status === "completed") {
    return "attended";
  }
  return "pending";
};

export default function CleanupPastAppointmentsModal({
  isOpen,
  onClose,
  events = [],
  onPurgeSuccess,
}) {
  const [thresholdMonths, setThresholdMonths] = useState(2);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [backupDownloaded, setBackupDownloaded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Compute cutoff date and matching older appointments
  const { thresholdDate, candidates, keptCount, stats } = useMemo(() => {
    const cutoff = subMonths(new Date(), thresholdMonths);
    const older = events.filter((e) => new Date(e.date) < cutoff);
    const kept = events.length - older.length;

    const attended = older.filter((e) => getStatusCategory(e) === "attended").length;
    const cancelled = older.filter((e) => getStatusCategory(e) === "cancelled").length;
    const pending = older.length - attended - cancelled;

    return {
      thresholdDate: cutoff,
      candidates: older,
      keptCount: kept,
      stats: { attended, cancelled, pending },
    };
  }, [events, thresholdMonths]);

  // Client-side CSV Backup Generator
  const handleExportCSV = () => {
    if (candidates.length === 0) {
      notify.error("No appointments to export.");
      return;
    }

    try {
      const headers = [
        "Document ID",
        "Date",
        "Time",
        "Patient Name",
        "Phone",
        "Email",
        "Doctor",
        "Service",
        "Status",
        "Attendance",
        "Admin Notes",
      ];

      const rows = candidates.map((r) => {
        const patientName = `${r.firstName || r.name || ""} ${r.lastName || ""}`.trim();
        const cleanNotes = (r.notes || r.adminNote || "").replace(/"/g, '""');
        return [
          `"${r.$id || r.id || ""}"`,
          `"${r.date ? format(new Date(r.date), "yyyy-MM-dd") : ""}"`,
          `"${r.time || ""}"`,
          `"${patientName}"`,
          `"${r.phone || r.contact || ""}"`,
          `"${r.email || ""}"`,
          `"${r.doctor || r.dentist || ""}"`,
          `"${r.service || r.treatment || ""}"`,
          `"${r.status || ""}"`,
          `"${r.attendanceStatus || ""}"`,
          `"${cleanNotes}"`,
        ].join(",");
      });

      const csvString = [headers.join(","), ...rows].join("\r\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `manila_dental_appointments_backup_${thresholdMonths}mo_${format(
        new Date(),
        "yyyyMMdd_HHmm"
      )}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBackupDownloaded(true);
      notify.success(`Downloaded backup for ${candidates.length} appointments.`);
    } catch (err) {
      console.error("CSV export error:", err);
      notify.error("Failed to generate CSV backup.");
    }
  };

  // Batch Deletion Handler
  const handlePurge = async () => {
    if (candidates.length === 0) {
      notify.error("No older appointments found for this threshold.");
      return;
    }

    if (password !== REQUIRED_PASSWORD) {
      notify.error("Invalid authorization password.");
      return;
    }

    setIsDeleting(true);
    setProgress({ current: 0, total: candidates.length });

    const deletedIds = [];
    const BATCH_SIZE = 10;

    try {
      for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
        const batch = candidates.slice(i, i + BATCH_SIZE);

        await Promise.all(
          batch.map(async (doc) => {
            try {
              await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, doc.$id || doc.id);
              deletedIds.push(doc.$id || doc.id);
            } catch (err) {
              console.warn(`Failed to delete appointment ${doc.$id}:`, err);
            }
          })
        );

        setProgress({
          current: Math.min(i + BATCH_SIZE, candidates.length),
          total: candidates.length,
        });
      }

      notify.success(
        `Successfully purged ${deletedIds.length} appointments older than ${thresholdMonths} months.`
      );

      if (onPurgeSuccess) {
        onPurgeSuccess(deletedIds);
      }

      // Reset modal state and close
      setPassword("");
      setIsDeleting(false);
      setBackupDownloaded(false);
      onClose();
    } catch (error) {
      console.error("Purge error:", error);
      notify.error(`Encountered error during deletion: ${error.message}`);
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 w-full max-w-xl max-h-[92vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
        >
          <X size={20} />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-start gap-4 pr-8">
          <div className="w-13 h-13 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 border border-rose-500/20">
            <Trash2 size={26} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Purge Past Appointments
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
              Remove older completed and cancelled appointments to drastically speed up calendar rendering and network synchronization.
            </p>
          </div>
        </div>

        {/* Step 1: Select Threshold */}
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Calendar size={13} />
            1. Select Retention Period
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              {
                months: 2,
                title: "Keep 2 Months",
                badge: "Recommended",
                desc: "Purges before Jul 12",
              },
              {
                months: 3,
                title: "Keep 3 Months",
                badge: "Standard",
                desc: "Purges before Jun 12",
              },
              {
                months: 6,
                title: "Keep 6 Months",
                badge: "Conservative",
                desc: "Purges before Mar 12",
              },
            ].map(({ months, title, badge, desc }) => {
              const isSelected = thresholdMonths === months;
              return (
                <button
                  key={months}
                  type="button"
                  onClick={() => {
                    setThresholdMonths(months);
                    setBackupDownloaded(false);
                  }}
                  disabled={isDeleting}
                  className={clsx(
                    "p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                    isSelected
                      ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-500 ring-2 ring-rose-500/20 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:border-slate-300"
                  )}
                >
                  <div className="mb-1">
                    <span
                      className={clsx(
                        "text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider inline-block",
                        isSelected
                          ? "bg-rose-500 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      )}
                    >
                      {badge}
                    </span>
                  </div>
                  <div>
                    <span
                      className={clsx(
                        "text-xs font-black uppercase block",
                        isSelected ? "text-rose-600 dark:text-rose-400" : "text-slate-800 dark:text-slate-200"
                      )}
                    >
                      {title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                      {desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Visual Impact: Exactly what happens after purging */}
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Info size={13} />
            Summary: What will happen when you proceed
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Kept Card */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 flex flex-col justify-between space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Kept on Calendar
                </span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 tabular-nums">
                  {keptCount} records
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                {format(thresholdDate, "MMM d, yyyy")} → Today & Future
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                All appointments in the last {thresholdMonths} months and upcoming visits stay active.
              </p>
            </div>

            {/* Deleted Card */}
            <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 flex flex-col justify-between space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1">
                  <Trash2 size={12} />
                  Permanently Purged
                </span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 tabular-nums">
                  {candidates.length} records
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                Prior to {format(thresholdDate, "MMM d, yyyy")}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                Older records deleted to maximize calendar rendering and network sync speed.
              </p>
            </div>
          </div>

          {/* Breakdown of purged candidates */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-around text-center">
            <div>
              <span className="text-xs font-black text-slate-700 dark:text-slate-200 tabular-nums">
                {stats.attended}
              </span>
              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">
                Attended
              </span>
            </div>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="text-xs font-black text-slate-700 dark:text-slate-200 tabular-nums">
                {stats.cancelled}
              </span>
              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">
                Cancelled
              </span>
            </div>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="text-xs font-black text-slate-700 dark:text-slate-200 tabular-nums">
                {stats.pending}
              </span>
              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">
                Other / Past
              </span>
            </div>
          </div>
        </div>

        {/* Step 2: CSV Backup Button */}
        <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Download size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                Backup to CSV Before Purge
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Retain complete offline audit logs of these {candidates.length} records.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isDeleting || candidates.length === 0}
            className={clsx(
              "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
              backupDownloaded
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:scale-95"
            )}
          >
            {backupDownloaded ? (
              <>
                <CheckCircle2 size={14} /> Downloaded
              </>
            ) : (
              <>
                <Download size={14} /> Export CSV
              </>
            )}
          </button>
        </div>

        {/* Step 3: Admin Authorization Password */}
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Lock size={13} />
            3. Admin Authorization Required
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter admin authorization password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isDeleting || candidates.length === 0}
              className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Live Progress Bar during execution */}
        {isDeleting && (
          <div className="space-y-1.5 animate-in fade-in duration-200">
            <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Loader2 size={13} className="animate-spin text-rose-500" />
                Purging past records...
              </span>
              <span className="font-mono tabular-nums">
                {progress.current} / {progress.total} (
                {Math.round((progress.current / progress.total) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-rose-500 h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${(progress.current / progress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePurge}
            disabled={
              isDeleting ||
              candidates.length === 0 ||
              password !== REQUIRED_PASSWORD
            }
            className="flex-[2] py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/20 transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Purging...
              </>
            ) : (
              <>
                <Trash2 size={15} /> Confirm & Purge {candidates.length} Past Records
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

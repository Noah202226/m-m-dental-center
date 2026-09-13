"use client";

import { useState, useEffect, useCallback } from "react";
import { databases, DATABASE_ID, ID } from "../../lib/appwrite";
import { Permission, Role, Query } from "appwrite";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/Dialog";
import {
  Calendar,
  Clock,
  Save,
  Plus,
  Trash2,
  Copy,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Users,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const COLLECTION_ID = "clinic_schedules";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DEFAULT_DAY_CONFIG = {
  Monday:    { open: "09:00", close: "17:00", active: true,  capacity: 3 },
  Tuesday:   { open: "09:00", close: "17:00", active: true,  capacity: 3 },
  Wednesday: { open: "09:00", close: "17:00", active: true,  capacity: 3 },
  Thursday:  { open: "09:00", close: "17:00", active: true,  capacity: 3 },
  Friday:    { open: "09:00", close: "17:00", active: true,  capacity: 3 },
  Saturday:  { open: "09:00", close: "16:00", active: true,  capacity: 2 },
  Sunday:    { open: "00:00", close: "00:00", active: false, capacity: 0 },
};

export default function ClinicSchedulesTab() {
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Active form state
  const [scheduleName, setScheduleName] = useState("Regular Operating Hours");
  const [startDate, setStartDate] = useState("2025-01-01");
  const [endDate, setEndDate] = useState("2030-12-31");
  const [priority, setPriority] = useState(10);
  const [weeklyConfig, setWeeklyConfig] = useState(DEFAULT_DAY_CONFIG);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Schedules from Appwrite
  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.orderDesc("priority"),
      ]);
      const list = res.documents || [];
      setSchedules(list);

      if (list.length > 0) {
        // Select first schedule
        const active = list[0];
        loadScheduleIntoForm(active);
      } else {
        resetFormToDefault();
      }
    } catch (err) {
      console.error("Failed to load clinic schedules:", err);
      toast.error("Could not load clinic schedules from database");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const loadScheduleIntoForm = (schedule) => {
    setSelectedScheduleId(schedule.$id);
    setScheduleName(schedule.name || "Regular Operating Hours");
    setStartDate(
      schedule.startDate ? schedule.startDate.slice(0, 10) : "2025-01-01"
    );
    setEndDate(schedule.endDate ? schedule.endDate.slice(0, 10) : "2030-12-31");
    setPriority(schedule.priority ?? 10);

    try {
      const parsed = JSON.parse(schedule.config);
      // Merge with defaults in case any day is missing
      setWeeklyConfig({ ...DEFAULT_DAY_CONFIG, ...parsed });
    } catch (e) {
      console.warn("Could not parse schedule config:", e);
      setWeeklyConfig(DEFAULT_DAY_CONFIG);
    }
  };

  const resetFormToDefault = () => {
    setSelectedScheduleId(null);
    setScheduleName("Special / Seasonal Hours");
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    );
    setPriority(20);
    setWeeklyConfig(DEFAULT_DAY_CONFIG);
  };

  // Day field handlers
  const handleDayToggle = (day) => {
    setWeeklyConfig((prev) => {
      const current = prev[day] || {};
      const nextActive = !current.active;
      const isWeekend = day === "Saturday" || day === "Sunday";
      return {
        ...prev,
        [day]: {
          ...current,
          active: nextActive,
          open:
            nextActive && (!current.open || current.open === "00:00")
              ? "09:00"
              : current.open || "09:00",
          close:
            nextActive && (!current.close || current.close === "00:00")
              ? isWeekend
                ? "16:00"
                : "17:00"
              : current.close || "17:00",
          capacity:
            nextActive && (!current.capacity || current.capacity === 0)
              ? isWeekend
                ? 2
                : 3
              : current.capacity || 2,
        },
      };
    });
  };

  const handleDayChange = (day, field, value) => {
    setWeeklyConfig((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  // Productivity helpers
  const handleCopyMonToWeekdays = () => {
    const mondaySettings = weeklyConfig.Monday;
    setWeeklyConfig((prev) => ({
      ...prev,
      Tuesday:   { ...mondaySettings },
      Wednesday: { ...mondaySettings },
      Thursday:  { ...mondaySettings },
      Friday:    { ...mondaySettings },
    }));
    toast.success("Applied Monday hours & capacity to Tuesday – Friday! ⚡");
  };

  const handleResetStandardHours = () => {
    setWeeklyConfig(DEFAULT_DAY_CONFIG);
    toast.info("Reset operating matrix to standard 9AM–5PM hours");
  };

  // Save / Update Schedule
  const handleSaveSchedule = async (e) => {
    if (e) e.preventDefault();
    if (!scheduleName.trim()) {
      return toast.error("Please enter a schedule name");
    }

    setIsSaving(true);
    try {
      const payload = {
        name: scheduleName.trim(),
        startDate: new Date(startDate + "T00:00:00.000Z").toISOString(),
        endDate: new Date(endDate + "T23:59:59.999Z").toISOString(),
        priority: parseInt(priority, 10) || 10,
        config: JSON.stringify(weeklyConfig),
      };

      const permissions = [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ];

      if (selectedScheduleId) {
        // Update existing
        const updated = await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID,
          selectedScheduleId,
          payload
        );
        setSchedules((prev) =>
          prev.map((s) => (s.$id === updated.$id ? updated : s))
        );
        toast.success(`Schedule "${payload.name}" updated successfully! 🕒`);
      } else {
        // Create new
        const created = await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID,
          ID.unique(),
          payload,
          permissions
        );
        setSchedules((prev) => [created, ...prev]);
        setSelectedScheduleId(created.$id);
        toast.success(`New schedule "${payload.name}" created! 📅`);
      }
    } catch (err) {
      console.error("Error saving clinic schedule:", err);
      toast.error("Failed to save schedule");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Schedule
  const handleDeleteSchedule = async () => {
    if (!selectedScheduleId) return;
    setIsDeleting(true);
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID,
        selectedScheduleId
      );
      const remaining = schedules.filter((s) => s.$id !== selectedScheduleId);
      setSchedules(remaining);
      toast.success("Schedule deleted 🗑️");
      setShowDeleteModal(false);

      if (remaining.length > 0) {
        loadScheduleIntoForm(remaining[0]);
      } else {
        resetFormToDefault();
      }
    } catch (err) {
      console.error("Failed to delete schedule:", err);
      toast.error("Could not delete schedule");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2 text-[hsl(var(--foreground))]">
            <Calendar className="h-4 w-4 text-amber-500" />
            <span>Clinic Operating Schedules & Hours</span>
          </h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            Configure clinic opening times, active weekdays, and hourly patient capacity for appointment slot generation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetFormToDefault}
            className="gap-1.5 text-xs"
          >
            <Plus size={13} />
            <span>New Schedule</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchSchedules}
            disabled={loading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Schedule Tabs Selector (if multiple schedules exist) */}
      {schedules.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] shrink-0">
            Active Profiles:
          </span>
          {schedules.map((s) => {
            const isSelected = selectedScheduleId === s.$id;
            return (
              <button
                key={s.$id}
                onClick={() => loadScheduleIntoForm(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border ${
                  isSelected
                    ? "bg-amber-500/15 border-amber-500 text-amber-500"
                    : "border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))]"
                }`}
              >
                {s.name} (Priority {s.priority})
              </button>
            );
          })}
        </div>
      )}

      {/* Schedule Parameters Card */}
      <div className="p-4 rounded-xl bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[hsl(var(--border))]">
          <span className="text-xs font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
            <Clock size={14} className="text-amber-500" />
            <span>
              {selectedScheduleId ? "Editing Schedule Profile" : "Creating New Schedule Profile"}
            </span>
          </span>
          {selectedScheduleId && (
            <Badge variant="default" className="text-[10px]">
              ID: {selectedScheduleId.slice(0, 10)}...
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Schedule Name */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Schedule Name / Label
            </label>
            <Input
              type="text"
              placeholder="e.g. Regular Operating Hours"
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              disabled={isSaving}
              className="text-xs h-9"
            />
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] flex items-center justify-between">
              <span>Priority</span>
              <span className="text-[10px] text-amber-500 font-semibold">(1-100)</span>
            </label>
            <Input
              type="number"
              min={1}
              max={100}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={isSaving}
              className="text-xs h-9"
            />
          </div>

          {/* Validity Range */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Start Date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isSaving}
              className="text-xs h-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
              End Date
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isSaving}
              className="text-xs h-9"
            />
          </div>
          <div className="sm:col-span-3 flex items-end text-xs text-[hsl(var(--muted-foreground))] pb-1.5">
            Higher priority schedules override regular hours during overlapping date ranges (useful for Holiday closures or Ramadan/Summer schedules).
          </div>
        </div>
      </div>

      {/* Quick Tools */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
        <span className="text-xs font-semibold text-[hsl(var(--foreground))]">
          Weekly Operating Hours Matrix
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyMonToWeekdays}
            className="gap-1.5 text-xs h-8"
            title="Copy Monday times & capacity to Tue-Fri"
          >
            <Copy size={12} />
            <span>Copy Mon to Weekdays</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetStandardHours}
            className="gap-1.5 text-xs h-8 text-[hsl(var(--muted-foreground))]"
            title="Reset to 9:00 AM - 5:00 PM"
          >
            <RotateCcw size={12} />
            <span>Standard Hours</span>
          </Button>
        </div>
      </div>

      {/* Days Matrix */}
      <div className="space-y-2.5">
        {DAYS_OF_WEEK.map((day) => {
          const cfg = weeklyConfig[day] || {
            open: "09:00",
            close: "17:00",
            active: false,
            capacity: 0,
          };
          const isWeekend = day === "Saturday" || day === "Sunday";

          return (
            <div
              key={day}
              className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                cfg.active
                  ? "bg-[hsl(var(--card))] border-[hsl(var(--border))] shadow-sm"
                  : "bg-[hsl(var(--muted))]/20 border-[hsl(var(--border))]/60 opacity-75"
              }`}
            >
              {/* Day Identifier & Active Toggle */}
              <div className="flex items-center gap-3 w-48 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDayToggle(day)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                    cfg.active
                      ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/25"
                      : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:border-amber-500/40 hover:text-[hsl(var(--foreground))]"
                  }`}
                  title={cfg.active ? "Click to set Closed" : "Click to set Open"}
                >
                  {cfg.active ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <XCircle size={16} className="text-[hsl(var(--muted-foreground))]" />
                  )}
                  <span>{day}</span>
                </button>
                <span className="text-[11px] font-medium">
                  {cfg.active ? (
                    <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4">Open</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 opacity-75">Closed</Badge>
                  )}
                </span>
              </div>

              {/* Time & Capacity Controls */}
              {cfg.active ? (
                <div className="flex flex-wrap items-center gap-3 flex-1 sm:justify-end">
                  {/* Open Time */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                      Open:
                    </span>
                    <input
                      type="time"
                      value={cfg.open}
                      onChange={(e) => handleDayChange(day, "open", e.target.value)}
                      className="px-2 py-1 rounded-md text-xs bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Close Time */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                      Close:
                    </span>
                    <input
                      type="time"
                      value={cfg.close}
                      onChange={(e) => handleDayChange(day, "close", e.target.value)}
                      className="px-2 py-1 rounded-md text-xs bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Concurrent Patient Capacity */}
                  <div className="flex items-center gap-1.5 pl-2 border-l border-[hsl(var(--border))]">
                    <Users size={12} className="text-amber-500" />
                    <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                      Cap/slot:
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={cfg.capacity}
                      onChange={(e) =>
                        handleDayChange(day, "capacity", parseInt(e.target.value, 10) || 1)
                      }
                      className="w-14 px-2 py-1 rounded-md text-xs text-center bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Close Day button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDayToggle(day)}
                    className="h-7 px-2 text-[11px] text-[hsl(var(--muted-foreground))] hover:text-red-400 hover:bg-red-500/10"
                    title={`Mark ${day} Closed`}
                  >
                    Set Closed
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between sm:justify-end gap-3 flex-1">
                  <span className="text-xs text-[hsl(var(--muted-foreground))] italic">
                    Clinic is closed on {day}.
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDayToggle(day)}
                    className="h-7 text-xs gap-1.5 border-dashed border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/15"
                  >
                    <Plus size={12} />
                    <span>Open {day}</span>
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--border))]">
        {selectedScheduleId && schedules.length > 1 ? (
          <Button
            variant="ghost"
            onClick={() => setShowDeleteModal(true)}
            className="text-red-500 hover:text-red-400 hover:bg-red-500/10 gap-1.5 text-xs"
          >
            <Trash2 size={14} />
            <span>Delete Schedule</span>
          </Button>
        ) : (
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            {schedules.length <= 1 ? "Primary schedule cannot be deleted." : ""}
          </span>
        )}

        <Button
          onClick={handleSaveSchedule}
          loading={isSaving}
          className="gap-1.5"
        >
          <Save size={15} />
          <span>Save Schedule Settings</span>
        </Button>
      </div>

      {/* Delete Schedule Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span>Delete Operating Schedule?</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the schedule profile{" "}
              <strong className="text-[hsl(var(--foreground))]">
                "{scheduleName}"
              </strong>
              ? Active bookings will revert to the default operating calendar.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSchedule}
              loading={isDeleting}
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

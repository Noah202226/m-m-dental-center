"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  Clock,
  Loader2,
  Plus,
  Stethoscope,
  Trash2,
  User,
  Mail,
  X,
  AlertTriangle,
  Eye,
  FileText,
  Shield,
  Tag,
  ImageIcon,
  LayoutList,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Phone,
  Info,
  ShieldCheck,
  Edit3,
  Save,
  CheckCircle2,
  XCircle,
  CalendarPlus,
  UserCheck,
  ChevronDown,
  Search,
  Volume2,
  VolumeX,
  Bell,
  Sparkles,
  Radio,
  Check,
} from "lucide-react";
import { databases, client, storage, ID } from "@/app/lib/appwrite";
import { Query } from "appwrite";
import clsx from "clsx";
import { notify } from "@/app/lib/notify";
import { Toaster } from "react-hot-toast";

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  format,
} from "date-fns";
import { FiLoader } from "react-icons/fi";
import CleanupPastAppointmentsModal from "../helper/CleanupPastAppointmentsModal";

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
const COLLECTION_ID = "appointments";
const BUCKET_ID = process.env.NEXT_PUBLIC_STORAGE_BUCKET_ID;
const PATIENT_COLLECTION_ID = "patients";

// In-memory cache for active dentists to prevent redundant network fetches
let cachedDentists = null;

// Unified appointment status categorization (mutually exclusive across all views)
export const getAppointmentStatusCategory = (e) => {
  if (!e) return "pending";
  // 1. Cancelled / No-show
  if (
    e.attendanceStatus === "not-attended" ||
    e.attendanceStatus === "cancelled" ||
    e.status === "cancelled" ||
    e.status === "declined"
  ) {
    return "cancelled";
  }
  // 2. Attended / Completed
  if (e.attendanceStatus === "attended" || e.status === "completed") {
    return "attended";
  }
  // 3. Confirmed upcoming
  if (e.status === "confirmed") {
    return "confirmed";
  }
  // 4. Pending / Needs Review
  return "pending";
};

export default function AppointmentManager() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [isDeleting, setIsDeleting] = useState(null); // Tracks the ID being deleted

  const [isUpdating, setIsUpdating] = useState(null); // Stores the $id of the event being updated

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [isCleanupBannerDismissed, setIsCleanupBannerDismissed] = useState(false);

  // Past appointments older than 2 months for proactive optimization notification
  const pastAppointmentsOlderThanTwoMonths = useMemo(() => {
    const cutoff = subMonths(new Date(), 2);
    return events.filter((e) => new Date(e.date) < cutoff);
  }, [events]);

  const handlePurgeSuccess = (deletedIds) => {
    setEvents((prev) => prev.filter((e) => !deletedIds.includes(e.$id) && !deletedIds.includes(e.id)));
    if (selectedAppointment && (deletedIds.includes(selectedAppointment.$id) || deletedIds.includes(selectedAppointment.id))) {
      setSelectedAppointment(null);
    }
  };

  // Zero-latency native Web Audio API synthesizer chime (zero network delay)
  const playClinicChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Harmonic dual-bell chime: 880Hz (A5) -> 1320Hz (E6)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";

      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.12);

      osc2.frequency.setValueAtTime(1320, now);
      osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.18);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.04);
      osc1.stop(now + 0.7);
      osc2.stop(now + 0.7);
    } catch (e) {
      console.warn("Clinic chime audio unavailable:", e);
    }
  }, []);

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    if (nextState) {
      playClinicChime();
    }
  };

  const handleDelete = async (id) => {
    setIsDeleting(id);
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, id);
      notify.success("Appointment removed");
      setDeleteId(null);
      setEvents((prev) => prev.filter((e) => e.$id !== id && e.id !== id));
      setSelectedEvent(null);
      if (selectedAppointment?.$id === id || selectedAppointment?.id === id) {
        setSelectedAppointment(null);
      }
    } catch (error) {
      notify.error(`Failed to delete appointment: ${error.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });

  // New State for Details Panel
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [newEvent, setNewEvent] = useState({
    firstName: "",
    middleName: "", // Ensure this is "" not undefined
    lastName: "",
    email: "", // Ensure this is "" not undefined
    phone: "",
    date: "",
    birthdate: "",
    gender: "",
    civilStatus: "",
    occupation: "",
    address: "",
    notes: "",
    referralSource: "",
    emergencyToContact: "",
    emergencyToContactNumber: "",
    medicalHistory: [],
    status: "pending",
  });

  const [rescheduleEvent, setRescheduleEvent] = useState(null);
  const [newDateValue, setNewDateValue] = useState("");

  // Memoized fetch function for stable reference
  const fetchDocs = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.limit(5000),
        Query.orderDesc("$createdAt"),
      ]);

      const formatted = res.documents.map((doc) => ({
        ...doc,
        id: doc.$id,
        date: new Date(doc.date),
      }));

      setEvents(formatted);
    } catch (error) {
      setEvents([]);
      if (error?.code !== 404 && error?.type !== "collection_not_found") {
        console.warn("Appointments fetch notice:", error?.message || error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [DATABASE_ID, COLLECTION_ID]);

  // Initial Fetch
  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  // Realtime Subscription
  useEffect(() => {
    const channel = `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents`;

    const unsubscribe = client.subscribe(
      channel,
      (response) => {
        const { events: eventTypes, payload } = response;

        const isCreate = eventTypes.some((et) => et.includes("create"));
        const isUpdate = eventTypes.some((et) => et.includes("update"));
        const isDelete = eventTypes.some((et) => et.includes("delete"));

        // REAL-TIME NOTIFICATION CHIME: Play sound whenever a new appointment is booked!
        if (isCreate) {
          if (soundEnabled) {
            playClinicChime();
          }
          const patientName =
            payload.firstName ||
            payload.name ||
            payload.title ||
            "New Patient";
          notify.success(`New Appointment Booked: ${patientName}!`, {
            duration: 5000,
          });

          // Prepend newly created appointment to state immediately
          setEvents((prev) => {
            const formattedDoc = {
              ...payload,
              id: payload.$id,
              date: new Date(payload.date),
              isNewArrival: true,
            };
            return [...prev, formattedDoc].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
            );
          });
        }

        // LOGIC FOR DELETED APPOINTMENTS
        if (isDelete) {
          setEvents((prev) => prev.filter((e) => e.$id !== payload.$id && e.id !== payload.$id));
          if (selectedAppointment?.$id === payload.$id || selectedAppointment?.id === payload.$id) {
            setSelectedAppointment(null);
          }
        }

        // LOGIC FOR UPDATED APPOINTMENTS
        if (isUpdate) {
          setEvents((prev) =>
            prev.map((e) =>
              e.$id === payload.$id || e.id === payload.$id
                ? { ...payload, id: payload.$id, date: new Date(payload.date) }
                : e,
            ),
          );
        }
      },
    );

    return () => unsubscribe();
  }, [DATABASE_ID, COLLECTION_ID, soundEnabled, playClinicChime, selectedAppointment?.$id]);

  // Today's summary statistics for live clinic agenda
  const todayStats = useMemo(() => {
    const today = new Date();
    const todayList = events.filter((e) => isSameDay(new Date(e.date), today));
    return {
      totalToday: todayList.length,
      pendingToday: todayList.filter((e) => getAppointmentStatusCategory(e) === "pending").length,
      // Confirmed includes both upcoming confirmed and attended appointments (excluding cancelled)
      confirmedToday: todayList.filter((e) => {
        const cat = getAppointmentStatusCategory(e);
        return cat === "confirmed" || cat === "attended";
      }).length,
      attendedToday: todayList.filter((e) => getAppointmentStatusCategory(e) === "attended").length,
      cancelledToday: todayList.filter((e) => getAppointmentStatusCategory(e) === "cancelled").length,
    };
  }, [events]);

  const statusCounts = useMemo(() => {
    // Filter events to ONLY include the current visible month
    const monthlyEvents = events.filter((e) =>
      isSameMonth(new Date(e.date), currentMonth),
    );

    return {
      All: monthlyEvents.length,
      Pending: monthlyEvents.filter((e) => getAppointmentStatusCategory(e) === "pending").length,
      // Total confirmed count on selected month including attended appointments (excluding cancelled)
      Confirmed: monthlyEvents.filter((e) => {
        const cat = getAppointmentStatusCategory(e);
        return cat === "confirmed" || cat === "attended";
      }).length,
      Attended: monthlyEvents.filter((e) => getAppointmentStatusCategory(e) === "attended").length,
      Cancelled: monthlyEvents.filter((e) => getAppointmentStatusCategory(e) === "cancelled").length,
    };
  }, [events, currentMonth]);

  const filteredEvents = useMemo(() => {
    let list = events;

    // 1. Always filter by visible month to keep all calendar days & counts 100% in sync
    list = list.filter((e) => {
      const eventDate = e.date instanceof Date ? e.date : new Date(e.date);
      return isSameMonth(eventDate, currentMonth);
    });

    // 2. Tab status filter
    if (viewMode === "Pending") {
      list = list.filter((e) => getAppointmentStatusCategory(e) === "pending");
    } else if (viewMode === "Confirmed") {
      // Confirmed tab displays all confirmed appointments (both upcoming confirmed and attended)
      list = list.filter((e) => {
        const cat = getAppointmentStatusCategory(e);
        return cat === "confirmed" || cat === "attended";
      });
    } else if (viewMode === "Attended") {
      list = list.filter((e) => getAppointmentStatusCategory(e) === "attended");
    } else if (viewMode === "Cancelled") {
      list = list.filter((e) => getAppointmentStatusCategory(e) === "cancelled");
    }

    // 3. Instant Real-Time Search Filter (Comprehensive Multi-Field Match in current month)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((e) => {
        const fullName = `${e.firstName || ""} ${e.middleName || ""} ${e.lastName || ""}`.toLowerCase();
        const title = (e.title || e.name || e.patientName || "").toLowerCase();
        const phone = (e.phone || e.contact || e.mobile || e.emergencyToContactNumber || "").toLowerCase();
        const email = (e.email || "").toLowerCase();
        const dentist = (e.assignedDentist || e.dentist || "").toLowerCase();
        const notes = (e.notes || e.note || e.adminNote || "").toLowerCase();
        const service = (e.service || e.treatment || e.procedure || "").toLowerCase();
        const address = (e.address || "").toLowerCase();

        return (
          fullName.includes(q) ||
          title.includes(q) ||
          phone.includes(q) ||
          email.includes(q) ||
          dentist.includes(q) ||
          notes.includes(q) ||
          service.includes(q) ||
          address.includes(q)
        );
      });
    }

    // 4. Chronological sort
    return [...list].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [events, viewMode, currentMonth, searchQuery]);

  // High-performance O(1) date lookup map for calendar cells (derived from filteredEvents!)
  const eventsByDate = useMemo(() => {
    const map = new Map();
    for (const e of filteredEvents) {
      const d = e.date instanceof Date ? e.date : new Date(e.date);
      const key = format(d, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }
    // Sort day events by time once
    for (const list of map.values()) {
      list.sort((a, b) => {
        const parseTime = (timeStr) => {
          if (!timeStr) return "00:00";
          const [time, modifier] = timeStr.split(" ");
          let [hours, minutes] = time.split(":");
          if (hours === "12") hours = "00";
          if (modifier === "PM") hours = parseInt(hours, 10) + 12;
          return `${hours.toString().padStart(2, "0")}:${minutes}`;
        };
        return parseTime(a.time).localeCompare(parseTime(b.time));
      });
    }
    return map;
  }, [filteredEvents]);

  const dailyAppointments = useMemo(() => {
    if (!selectedDate) return [];

    return filteredEvents.filter((e) =>
      isSameDay(new Date(e.date), selectedDate),
    );
  }, [filteredEvents, selectedDate]);

  const [availableDentists, setAvailableDentists] = useState([]);
  const [isLoadingDentists, setIsLoadingDentists] = useState(true);

  // Fetch dentist with memory cache
  useEffect(() => {
    if (cachedDentists) {
      setAvailableDentists(cachedDentists);
      setIsLoadingDentists(false);
      return;
    }

    const loadDentists = async () => {
      try {
        setIsLoadingDentists(true);
        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID,
          "dentists",
          [Query.equal("isActive", true)],
        );
        cachedDentists = response.documents;
        setAvailableDentists(response.documents);
      } catch (error) {
        // Dentists collection is optional: gracefully fallback without console.error overlay
        cachedDentists = [];
        setAvailableDentists([]);
        if (error?.code !== 404 && error?.type !== "collection_not_found") {
          console.warn("Dentists collection notice:", error?.message || error);
        }
      } finally {
        setIsLoadingDentists(false);
      }
    };

    loadDentists();
  }, []);

  const handleUpdateStatus = async (
    event,
    newStatus,
    notes,
    newAttendance,
    assignedDentist,
    overrideDate = null,
    overrideTime = null
  ) => {
    if (!event) return;
    setIsUpdating(event.$id);

    console.log("Events: " + event + newStatus + notes + newAttendance);

    // Logic logic logic: Define what actually needs to change
    const isStatusAction = ["confirmed", "cancelled"].includes(newStatus);
    const isAttendanceAction = ["attended", "not-attended"].includes(
      newAttendance,
    );

    try {
      // Construct the update object dynamically
      const updateData = {
        dateKey: overrideDate ? new Date(overrideDate).toISOString().split("T")[0] : event.dateKey,
        date: overrideDate ? new Date(overrideDate).toISOString() : event.date,
        time: overrideTime || event.time,
        adminNote: notes,
      };

      // 1. Only update 'status' if it's a Confirm or Decline action
      if (isStatusAction) {
        updateData.status = newStatus;
      }

      if (assignedDentist) {
        updateData.assignedDentist = assignedDentist;
      }

      // 2. Only update 'attendanceStatus' if it's an Attendance action
      if (isAttendanceAction) {
        updateData.attendanceStatus = newAttendance;

        // OPTIONAL: If they are marked 'attended', you might want to
        // automatically set status to 'completed' as well.
        // if (newAttendance === "attended") {
        //   updateData.status = "completed";
        // }
      }

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        event.$id,
        updateData,
      );

      // 3. Save to Patients Collection (Only for confirmation)
      if (newStatus === "confirmed" && !event.patientId) {
        try {
          await databases.createDocument(
            DATABASE_ID,
            PATIENT_COLLECTION_ID,
            ID.unique(),
            {
              patientName: event.name || event.title || "Unknown Patient",
              email: event.email,
              firstName: event.firstName,
              lastName: event.lastName,
              middleName: event.middleName,
              contact: event.phone || "",
              birthdate: event.birthdate || "",
              gender: event.gender || "",
              civilStatus: event.civilStatus || "",
              occupation: event.occupation || "",
              address: event.address || "",
              emergencyToContact: event.emergencyToContact || "",
              emergencyToContactNumber: event.emergencyToContactNumber || "",
              photoFileId: event.photoFileId || "",
              medicalHistory: event.medicalHistory,
              referralSource: event.referralSource,
              note: notes || event.notes || "Initial record from booking.",
            },
          );
        } catch (patientErr) {
          console.warn("Patient creation error:", patientErr.message);
        }
      }

      // 4. Notification Logic (Only for Status changes)
      if (isStatusAction && event.status !== newStatus) {
        try {
          await fetch("/api/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: event.email,
              status: newStatus,
              patientName: event.name || event.title,
              date: overrideDate ? new Date(overrideDate).toISOString() : event.date,
              time: overrideTime || event.time,
              notes: notes || "No additional notes.",
            }),
          });
        } catch (nErr) {
          console.error("Notify fail", nErr);
        }
      }

      // SUCCESS ACTIONS
      // const successMsg = isStatusChanged
      //   ? `Appointment ${status}`
      //   : "Note saved successfully";

      notify.success(
        isStatusAction ? `Appointment ${newStatus}` : "Attendance updated",
      );

      setAdminNote("");
      setSelectedAppointment(null);
      // Instant optimistic update in local state (No slow network refetch)
      setEvents((prev) =>
        prev.map((item) => {
          if (item.$id === event.$id) {
            return {
              ...item,
              ...updateData,
              date: updateData.date ? new Date(updateData.date) : item.date,
              status: isStatusAction ? newStatus : item.status,
              attendanceStatus: isAttendanceAction
                ? newAttendance
                : item.attendanceStatus,
              assignedDentist: assignedDentist || item.assignedDentist,
              adminNote: notes !== undefined ? notes : item.adminNote,
            };
          }
          return item;
        }),
      );
    } catch (e) {
      notify.error(e.message);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleSave = async () => {
    // Basic validation for required fields
    if (
      !newEvent.firstName ||
      !newEvent.lastName ||
      !newEvent.date ||
      !newEvent.email
    ) {
      return notify.error(
        "First Name, Last Name, and Appointment Date are required",
      );
    }

    setIsSaving(true);
    try {
      const selectedDate = new Date(newEvent.date);

      // Constructing the full title (Handling middle name spacing)
      const middleInitial = newEvent.middleName
        ? ` ${newEvent.middleName} `
        : " ";
      const fullTitle = `${newEvent.firstName}${middleInitial}${newEvent.lastName}`;

      const payload = {
        title: fullTitle,
        firstName: newEvent.firstName,
        middleName: newEvent.middleName || "", // Added middle name
        lastName: newEvent.lastName,
        email: newEvent.email || "", // Ensure email is included
        phone: newEvent.phone || "",
        birthdate: newEvent.birthdate || "",
        gender: newEvent.gender || "",
        civilStatus: newEvent.civilStatus || "",
        occupation: newEvent.occupation || "",
        address: newEvent.address || "",
        date: selectedDate.toISOString(),
        dateKey: selectedDate.toISOString().split("T")[0],
        time: selectedDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        status: newEvent.status || "pending",
        attendanceStatus: "scheduled",
        referralSource: newEvent.referralSource || "Clinic Entry",
        notes: newEvent.notes || "",
        medicalHistory: newEvent.medicalHistory || [],
        emergencyToContact: newEvent.emergencyToContact || "",
        emergencyToContactNumber: newEvent.emergencyToContactNumber || "",
        isNewPatient: true,
        timestamp: new Date().toISOString(),
      };

      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        payload,
      );

      notify.success("Record created successfully");
      setShowModal(false);

      // Reset state
      setNewEvent({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        phone: "",
        date: "",
        birthdate: "",
        gender: "",
        civilStatus: "",
        occupation: "",
        address: "",
        notes: "",
        referralSource: "",
        emergencyToContact: "",
        emergencyToContactNumber: "",
        medicalHistory: [],
        status: "pending",
      });
    } catch (e) {
      notify.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReappointSave = async () => {
    if (!newDateValue || !rescheduleEvent)
      return notify.error("Please select a new date and time.");

    const selectedDate = new Date(newDateValue);

    // Optimistic
    setEvents((prev) =>
      prev.map((e) =>
        e.$id === rescheduleEvent.$id
          ? { ...e, status: "pending", date: selectedDate }
          : e,
      ),
    );

    try {
      const dateKey = selectedDate.toISOString().split("T")[0];
      const time = selectedDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        rescheduleEvent.$id,
        {
          status: "pending",
          date: selectedDate.toISOString(),
          dateKey,
          time,
        },
      );

      // Notify
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: rescheduleEvent.email,
          patientName: rescheduleEvent.title,
          date: selectedDate.toLocaleString(),
          status: "Rescheduled (Pending Review)",
          notes: rescheduleEvent.notes,
        }),
      });

      notify.success("Patient rescheduled.");
      setRescheduleEvent(null);
      setNewDateValue("");
    } catch (e) {
      notify.error(`Update failed: ${e.message}`);
    }
  };

  const getImageUrl = (fileId) => {
    if (!fileId) return null;
    return storage.getFilePreview(BUCKET_ID, fileId);
  };

  const [adminNote, setAdminNote] = useState(selectedEvent?.adminNote || "");
  const [approvedDateStr, setApprovedDateStr] = useState("");
  const [approvedTimeStr, setApprovedTimeStr] = useState("");

  // Update adminNote whenever the selectedAppointment changes
  useEffect(() => {
    setAdminNote(selectedAppointment?.adminNote || "");
    if (selectedAppointment) {
      setApprovedDateStr(selectedAppointment.dateKey || "");
      setApprovedTimeStr(selectedAppointment.time || "");
    }
  }, [selectedAppointment]);

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
            Synchronizing...
          </p>
        </div>
      </div>
    );

  return (
    <div className="w-full h-full flex flex-col min-h-0 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden">
      {/* FIXED TOP CONTROL DASHBOARD - NEVER SCROLLS AWAY */}
      <div className="flex-none shrink-0 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 pt-3 pb-0 border-b border-slate-200 dark:border-slate-800/80 z-20 flex flex-col gap-2.5 shadow-sm">
        {/* ROW 1: SECTION HEADER (TITLE, MONTH SELECTOR, SEARCH BAR & CHIME) */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-2.5 border-b border-slate-200/60 dark:border-slate-800/60">
          {/* Left: Title & Live Indicator */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Appointments
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>

          {/* Center: Prominent Month Navigator with Today Jump */}
          <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/70 shadow-sm w-fit">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200 hover:text-primary transition-all cursor-pointer active:scale-90"
              title="Previous Month"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
            <span className="text-base sm:text-lg font-black uppercase tracking-wide px-4 min-w-[180px] sm:min-w-[210px] text-center text-slate-900 dark:text-white select-none">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200 hover:text-primary transition-all cursor-pointer active:scale-90"
              title="Next Month"
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>

            {/* Jump to Present Month */}
            <button
              onClick={() => {
                setCurrentMonth(new Date());
                setSelectedDate(null);
              }}
              disabled={isSameMonth(currentMonth, new Date())}
              className={clsx(
                "px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ml-1.5",
                isSameMonth(currentMonth, new Date())
                  ? "bg-slate-200/60 dark:bg-slate-700/50 text-slate-400 cursor-default opacity-60"
                  : "bg-primary text-white hover:bg-primary/90 shadow-md active:scale-95"
              )}
              title={isSameMonth(currentMonth, new Date()) ? "Viewing present month" : "Jump back to present month"}
            >
              Today
            </button>
          </div>

          {/* Right: Search Bar, Cleanup Tool & Audio Alert Toggle */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="relative w-52 sm:w-64 lg:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search patient, phone, doctor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Quick Action: Cleanup Past Appointments */}
            <button
              onClick={() => setShowCleanupModal(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:border-rose-500/50 hover:text-rose-500 text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-xs cursor-pointer shrink-0"
              title="Database Maintenance: Purge past appointments older than 2+ months"
            >
              <Trash2 size={15} className="text-rose-500" />
              <span className="hidden xl:inline">Clean Old</span>
              {pastAppointmentsOlderThanTwoMonths.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  {pastAppointmentsOlderThanTwoMonths.length}
                </span>
              )}
            </button>

            <button
              onClick={toggleSound}
              className={clsx(
                "flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-xs cursor-pointer shrink-0",
                soundEnabled
                  ? "bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:border-primary/50"
                  : "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400"
              )}
              title={soundEnabled ? "Mute audio alerts" : "Enable sound chime alerts"}
            >
              {soundEnabled ? (
                <>
                  <Volume2 size={16} className="text-emerald-500" />
                  <span>Chime On</span>
                </>
              ) : (
                <>
                  <VolumeX size={16} className="text-rose-500" />
                  <span>Muted</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* DATABASE OPTIMIZATION NOTIFICATION BANNER */}
        {pastAppointmentsOlderThanTwoMonths.length > 0 && !isCleanupBannerDismissed && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-500/30 dark:border-amber-500/20 rounded-2xl text-xs shadow-xs">
            <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 font-bold min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span className="truncate">
                <strong className="text-amber-600 dark:text-amber-400">Database Optimization:</strong>{" "}
                You have <strong className="text-slate-900 dark:text-white font-black">{pastAppointmentsOlderThanTwoMonths.length}</strong> appointments older than 2 months. Purging completed/past records speeds up calendar loading.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowCleanupModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[11px] tracking-wider transition-all shadow-xs cursor-pointer active:scale-95"
              >
                Clean Up Records
              </button>
              <button
                onClick={() => setIsCleanupBannerDismissed(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Dismiss notice for this session"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ROW 2: FILTER TABS (LEFT) & TODAY'S CLINIC SNAPSHOT (RIGHT) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2.5">
          {/* LEFT: 5 Segmented Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/90 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl w-fit border border-slate-200/50 dark:border-slate-700/50">
            {[
              { mode: "All", dot: null, count: statusCounts["All"] ?? 0 },
              { mode: "Pending", dot: "bg-amber-400", count: statusCounts["Pending"] ?? 0 },
              { mode: "Confirmed", dot: "bg-blue-500", count: statusCounts["Confirmed"] ?? 0 },
              { mode: "Attended", dot: "bg-emerald-500", count: statusCounts["Attended"] ?? 0 },
              { mode: "Cancelled", dot: "bg-rose-500", count: statusCounts["Cancelled"] ?? 0 },
            ].map(({ mode, dot, count }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={clsx(
                  "px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-2 cursor-pointer",
                  viewMode === mode
                    ? "bg-white dark:bg-slate-700 shadow-xs text-primary-600 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
                )}
              >
                {dot && <span className={clsx("w-2 h-2 rounded-full shrink-0", dot, mode === "Pending" && "animate-pulse")} />}
                <span>{mode}</span>
                <span
                  className={clsx(
                    "px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black tabular-nums",
                    viewMode === mode
                      ? "bg-primary-100 dark:bg-primary/20 text-primary-600 dark:text-primary-300"
                      : "bg-slate-200/60 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400",
                  )}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* RIGHT: Today's Clinic Live Overview (Full text, crystal clear) */}
          <div className="flex flex-wrap items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xs w-fit">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white pr-1">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-slate-400 uppercase tracking-wider text-[11px]">Today:</span>
              <span className="text-sm font-black tabular-nums text-slate-900 dark:text-white">{todayStats.totalToday}</span>
            </div>

            <span className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-600 dark:text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-black tabular-nums">{todayStats.pendingToday}</span>
                <span className="text-xs font-bold">Pending</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs font-black tabular-nums">{todayStats.confirmedToday}</span>
                <span className="text-xs font-bold">Confirmed</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-black tabular-nums">{todayStats.attendedToday}</span>
                <span className="text-xs font-bold">Attended</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-xs font-black tabular-nums">{todayStats.cancelledToday}</span>
                <span className="text-xs font-bold">Cancelled</span>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: 7-DAY WEEKDAY HEADER (FIXED IN PLACE DIRECTLY ABOVE CALENDAR) */}
        {!selectedDate && (
          <div className="grid grid-cols-7 border-t border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
              <div
                key={dayName}
                className="py-2.5 text-center text-xs font-black uppercase tracking-wider text-slate-400 select-none"
              >
                {dayName}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* INDEPENDENT SCROLLABLE CALENDAR VIEW - ONLY THIS AREA SCROLLS */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-3 custom-scrollbar min-h-0">
            {!selectedDate ? (
              /* --- REGULAR CALENDAR GRID (Instant O(1) Lookup) --- */
              <div>
                {searchQuery.trim() && (
                  <div className="flex items-center justify-between gap-3 p-3 mb-3 bg-primary/10 border border-primary/20 rounded-2xl animate-in fade-in">
                    <div className="flex items-center gap-2.5">
                      <Search size={15} className="text-primary shrink-0" />
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Found <span className="text-primary font-black">{filteredEvents.length}</span> booking{filteredEvents.length === 1 ? "" : "s"} in {format(currentMonth, "MMMM yyyy")} matching <span className="text-primary font-black">"{searchQuery}"</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSearchQuery("")}
                      className="px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                    >
                      Clear Filter
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-7 border-t border-l border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden bg-white/50 dark:bg-slate-900/40 shadow-xs">
                {days.map((day) => {
                  const dayKey = format(day, "yyyy-MM-dd");
                  const dayEvents = eventsByDate.get(dayKey) || [];

                  return (
                    <div
                      key={day.toString()}
                      onClick={() =>
                        dayEvents.length > 0 && setSelectedDate(day)
                      }
                      className={clsx(
                        "min-h-[110px] md:min-h-[145px] p-2.5 border-r border-b border-slate-200 dark:border-slate-800/80 transition-all cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50",
                        !isSameMonth(day, currentMonth) &&
                          "opacity-20 pointer-events-none",
                        isSameDay(day, new Date()) && "bg-primary-50/10",
                      )}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span
                          className={clsx(
                            "text-sm font-black",
                            isSameDay(day, new Date())
                              ? "text-primary-600 underline decoration-2 underline-offset-4"
                              : "text-slate-400 dark:text-slate-400",
                          )}
                        >
                          {format(day, "d")}
                        </span>

                        {dayEvents.length > 0 && (
                          <span className="text-[11px] font-black bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-2 py-0.5 rounded-md min-w-[20px] text-center">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        {/* Now mapping through the sorted dayEvents */}
                        {dayEvents.slice(0, 4).map((e) => {
                          const statusCat = getAppointmentStatusCategory(e);
                          const isAttended = statusCat === "attended";
                          const isCancelled = statusCat === "cancelled";
                          const isApproved = statusCat === "confirmed";
                          const isRequested = statusCat === "pending";

                          return (
                            <div
                              key={e.$id}
                              className={clsx(
                                "hidden md:block px-3 py-2 rounded-xl text-xs font-bold truncate border transition-all shadow-sm",
                                isAttended &&
                                  "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400",
                                isCancelled &&
                                  "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400",
                                isApproved &&
                                  "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400",
                                isRequested &&
                                  "bg-amber-400/10 border-amber-400/30 text-amber-700 dark:text-amber-500 animate-pulse",
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={clsx(
                                    "w-2 h-2 rounded-full shrink-0",
                                    isAttended && "bg-emerald-500",
                                    isCancelled && "bg-rose-500",
                                    isApproved && "bg-blue-500",
                                    isRequested && "bg-amber-500",
                                  )}
                                />
                                <span className="opacity-75 tabular-nums text-[11px] font-semibold">
                                  {e.time}
                                </span>
                                <span className="capitalize font-extrabold truncate">
                                  {e.name || e.title}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {dayEvents.length > 4 && (
                          <p className="text-[10px] font-black text-slate-400 pl-2 uppercase tracking-wider mt-1">
                            + {dayEvents.length - 4} more
                          </p>
                        )}
                      </div>

                      {/* Mobile Indicators - also using sorted list */}
                      <div className="flex flex-wrap gap-1 md:hidden">
                        {dayEvents.map((e) => {
                          const cat = getAppointmentStatusCategory(e);
                          return (
                            <div
                              key={e.$id}
                              className={clsx(
                                "w-2 h-2 rounded-full ring-1 ring-white dark:ring-zinc-900",
                                cat === "attended" && "bg-emerald-500",
                                cat === "cancelled" && "bg-rose-500",
                                cat === "confirmed" && "bg-blue-500",
                                cat === "pending" && "bg-amber-400 animate-pulse",
                              )}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            ) : (
              /* --- DAY SELECTION MODE: Split View --- */
              <div className="flex flex-col lg:flex-row gap-6 animate-in slide-in-from-right-4 duration-500">
                {/* Left/Main Column: List of Appointments for that Day */}
                <div className="flex-1 space-y-6">
                  {/* Day Header Section */}
                  <div className="bg-slate-50/95 dark:bg-[#0f172a]/95 py-3 -mx-2 px-2 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedDate(null);
                        setSelectedAppointment(null);
                      }}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 hover:text-primary transition-all group cursor-pointer"
                    >
                      <div className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 transition-colors">
                        <ChevronLeft size={14} />
                      </div>
                      Back to Grid
                    </button>
                    <div className="text-right">
                      <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                        {selectedDate
                          ? format(selectedDate, "eeee")
                          : "Schedule"}
                      </h2>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none">
                        {selectedDate
                          ? format(selectedDate, "MMMM do, yyyy")
                          : "All Entries"}
                      </p>
                    </div>
                  </div>

                  {/* Grid of Appointments */}
                  <div className="grid gap-4">
                    {dailyAppointments.length > 0 ? (
                      [...dailyAppointments]
                        .sort((a, b) => {
                          // Helper to convert "hh:mm AM/PM" to a comparable 24hr string
                          const parseTime = (timeStr) => {
                            const [time, modifier] = timeStr.split(" ");
                            let [hours, minutes] = time.split(":");
                            if (hours === "12") hours = "00";
                            if (modifier === "PM")
                              hours = parseInt(hours, 10) + 12;
                            return `${hours.toString().padStart(2, "0")}:${minutes}`;
                          };
                          return parseTime(a.time).localeCompare(
                            parseTime(b.time),
                          );
                        })
                        .map((event) => {
                          const isSelected =
                            selectedAppointment?.$id === event.$id;

                          // Status Logic
                          const statusCat = getAppointmentStatusCategory(event);
                          const isAttended = statusCat === "attended";
                          const isCancelled = statusCat === "cancelled";
                          const isApproved = statusCat === "confirmed";
                          const isRequested = statusCat === "pending";

                          return (
                            <button
                              key={event.$id}
                              onClick={() => {
                                setSelectedAppointment(event);
                                console.log(event);
                              }}
                              className={clsx(
                                "w-full text-left p-1 rounded-[2rem] border transition-all duration-300 flex items-center group relative overflow-hidden hover:cursor-pointer mb-3",
                                isSelected
                                  ? "bg-primary/30 border-slate-900 dark:border-white shadow-xl shadow-slate-200 dark:shadow-none"
                                  : "bg-white dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 hover:border-primary/40 hover:shadow-md",
                              )}
                            >
                              {/* Time Badge - Color Coded */}
                              <div
                                className={clsx(
                                  "px-5 py-6 rounded-[1.8rem] flex flex-col items-center justify-center min-w-[90px] transition-all border-2",
                                  // GREEN: Attended
                                  isAttended &&
                                    "bg-emerald-500 border-emerald-600 text-white",
                                  // RED: Cancelled / No-Show
                                  isCancelled &&
                                    "bg-rose-500 border-rose-600 text-white",
                                  // BLUE: Approved
                                  isApproved &&
                                    "bg-blue-500 border-blue-600 text-white",
                                  // YELLOW: Requested
                                  isRequested &&
                                    "bg-amber-400 border-amber-500 text-amber-950 animate-pulse",
                                  // Selection override for border only
                                  isSelected &&
                                    "ring-2 ring-zinc-900 dark:ring-white ring-offset-2",
                                )}
                              >
                                <span className="text-lg font-black uppercase tracking-tighter tabular-nums">
                                  {event.time.split(" ")[0]}
                                </span>
                                <span className="text-sm font-bold opacity-80 uppercase">
                                  {event.time.split(" ")[1]}
                                </span>
                              </div>

                              {/* Content Section */}
                              <div className="flex-1 px-4 py-2">
                                <div className="flex items-center gap-2 mb-1">
                                  {isRequested && (
                                    <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
                                  )}
                                  <h4
                                    className={clsx(
                                      "font-black text-xl tracking-tight",
                                      isSelected
                                        ? "text-black dark:text-zinc-200"
                                        : "text-zinc-800 dark:text-zinc-100",
                                    )}
                                  >
                                    {event.title}
                                  </h4>
                                </div>
                                <p
                                  className={clsx(
                                    "text-sm line-clamp-1 italic",
                                    isSelected
                                      ? "text-zinc-700 dark:text-zinc-400"
                                      : "text-zinc-500 dark:text-zinc-500",
                                  )}
                                >
                                  {event.adminNote ||
                                    "No specific details provided."}
                                </p>
                              </div>

                              {/* Status Arrow */}
                              <div
                                className={clsx(
                                  "pr-6 transition-transform group-hover:translate-x-1",
                                  isSelected
                                    ? "text-zinc-900 dark:text-white"
                                    : "text-zinc-300 dark:text-zinc-700",
                                )}
                              >
                                <ChevronRight size={20} strokeWidth={3} />
                              </div>
                            </button>
                          );
                        })
                    ) : (
                      <div className="py-20 text-center space-y-3">
                        <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto text-zinc-300">
                          <Calendar size={32} />
                        </div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                          No appointments today
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Detail Sidebar */}
                <div className="lg:w-[600px] shrink-0">
                  {selectedAppointment ? (
                    <div
                      className={clsx(
                        "bg-white dark:bg-zinc-900 border rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in-95 overflow-y-auto no-scrollbar transition-all duration-500",
                        {
                          "border-zinc-200 dark:border-zinc-800":
                            getAppointmentStatusCategory(selectedAppointment) === "pending",
                          "border-emerald-500/30 dark:border-emerald-500/20 shadow-emerald-500/5":
                            getAppointmentStatusCategory(selectedAppointment) === "attended",
                          "border-blue-500/30 dark:border-blue-500/20 shadow-blue-500/5":
                            getAppointmentStatusCategory(selectedAppointment) === "confirmed",
                          "border-rose-500/30 dark:border-rose-500/20 opacity-90":
                            getAppointmentStatusCategory(selectedAppointment) === "cancelled",
                        },
                      )}
                    >
                      {/* Header: Status and ID */}
                      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm mb-6">
                        {/* Status Color Bar */}
                        <div
                          className={`h-1.5 w-full ${
                            getAppointmentStatusCategory(selectedAppointment) === "attended"
                              ? "bg-emerald-500"
                              : getAppointmentStatusCategory(selectedAppointment) === "cancelled"
                                ? "bg-rose-500"
                                : getAppointmentStatusCategory(selectedAppointment) === "confirmed"
                                  ? "bg-blue-500"
                                  : "bg-amber-400"
                          }`}
                        />

                        <div className="p-5">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1.5">
                              <h2 className="text-xl font-black tracking-tight dark:text-white">
                                {selectedAppointment.name || "Patient Record"}
                              </h2>

                              <div className="flex flex-col gap-1">
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                  Status:
                                  <span
                                    className={clsx(
                                      "font-black tracking-wider uppercase",
                                      getAppointmentStatusCategory(selectedAppointment) === "attended" && "text-emerald-500",
                                      getAppointmentStatusCategory(selectedAppointment) === "cancelled" && "text-rose-500",
                                      getAppointmentStatusCategory(selectedAppointment) === "confirmed" && "text-blue-500",
                                      getAppointmentStatusCategory(selectedAppointment) === "pending" && "text-amber-500",
                                    )}
                                  >
                                    {getAppointmentStatusCategory(selectedAppointment) === "attended"
                                      ? "Attended"
                                      : getAppointmentStatusCategory(selectedAppointment) === "cancelled"
                                        ? "Cancelled / No-Show"
                                        : getAppointmentStatusCategory(selectedAppointment) === "confirmed"
                                          ? "Confirmed"
                                          : "Pending Review"}
                                  </span>
                                </p>

                                {/* Styled Timestamp logic */}
                                <p className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                                  <span className="opacity-60">
                                    Last Action:
                                  </span>
                                  {selectedAppointment.attendanceStatus ? (
                                    <span className="text-zinc-800 dark:text-zinc-200">
                                      {selectedAppointment.attendanceStatus ===
                                      "attended"
                                        ? "✅ Attended"
                                        : "❌ Cancelled"}
                                      {" at "}
                                      {new Date(
                                        selectedAppointment.$updatedAt,
                                      ).toLocaleString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  ) : (
                                    <span className="italic opacity-50">
                                      No attendance recorded yet
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <span className="px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[9px] font-mono font-bold text-zinc-500">
                                ID:{" "}
                                {selectedAppointment.$id
                                  .slice(-6)
                                  .toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Main Profile Info */}
                      <div className="mb-8">
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-1 tracking-tight">
                          {selectedAppointment.title}
                        </h3>
                        <p className="text-primary-600 dark:text-primary-400 text-xs font-bold">
                          (
                          {selectedAppointment.occupation ||
                            "No occupation provided"}
                          )
                        </p>
                        <p className="text-primary-600 dark:text-primary-400 text-sm font-bold">
                          {selectedAppointment.address || "No address provided"}
                        </p>
                      </div>

                      {/* Detailed Data Grid */}
                      <div className="grid grid-cols-1 gap-6 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                        {/* Contact Section */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">
                            Contact Details
                          </h4>
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500">
                              <Mail size={16} />
                            </div>
                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              {selectedAppointment.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500">
                              <Phone size={16} />
                            </div>
                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              {selectedAppointment.phone || "+1 (555) 000-0000"}
                            </p>
                          </div>
                        </div>

                        {/* Schedule Section */}
                        <div className="space-y-4 pt-2">
                          <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">
                            Schedule
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                              <CalendarIcon
                                className="text-primary"
                                size={18}
                              />
                              <div>
                                <p className="text-[9px] font-bold text-zinc-400 uppercase">
                                  Date
                                </p>
                                <p className="text-xs font-black">
                                  {format(
                                    new Date(selectedAppointment.date),
                                    "MMM dd, yyyy",
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Clock className="text-primary" size={18} />
                              <div>
                                <p className="text-[9px] font-bold text-zinc-400 uppercase">
                                  Time
                                </p>
                                <p className="text-xs font-black">
                                  {selectedAppointment.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Notes Section */}
                        <div className="space-y-3 pt-2">
                          <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">
                            Patient Notes
                          </h4>
                          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                              {selectedAppointment.notes ||
                                "No additional notes provided by the patient."}
                            </p>
                          </div>
                        </div>

                        {/* MEDICAL HISTORY SECTION */}
                        <div className="space-y-3 pt-2">
                          <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">
                            Medical History
                          </h4>
                          {selectedAppointment.medicalHistory &&
                          selectedAppointment.medicalHistory.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {selectedAppointment.medicalHistory.map(
                                (item, index) => (
                                  <span
                                    key={index}
                                    className="px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-xl text-[10px] font-black uppercase tracking-tight"
                                  >
                                    {item}
                                  </span>
                                ),
                              )}
                            </div>
                          ) : (
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                              <p className="text-xs text-zinc-400 italic text-center">
                                No medical history on record.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* --- ADMIN ACTION SECTION --- */}
                        <div className="space-y-6 pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest flex items-center gap-2">
                              <Edit3 size={12} /> Internal Admin Note
                            </h4>
                            {/* Status Badge to show they are editing the right thing */}
                            <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[9px] font-bold text-zinc-500 uppercase">
                              ID: {selectedAppointment.$id.slice(-6)}
                            </span>
                          </div>

                          {/* --- DENTIST ASSIGNMENT SECTION --- */}
                          <div className="space-y-3 mb-6">
                            <h4 className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest flex items-center gap-2">
                              <UserCheck size={12} /> Assign Dentist : 👨‍⚕️{" "}
                              {selectedAppointment.assignedDentist
                                ? selectedAppointment.assignedDentist
                                : "No assigned dentist"}
                            </h4>

                            <div className="relative">
                              <select
                                value={
                                  selectedAppointment.assignedDentist || ""
                                }
                                onChange={(e) =>
                                  handleUpdateStatus(
                                    selectedAppointment,
                                    null,
                                    null,
                                    null,
                                    e.target.value, // New parameter for Dentist
                                  )
                                }
                                disabled={
                                  isUpdating === selectedAppointment.$id ||
                                  isLoadingDentists
                                }
                                className="w-full p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500/20 appearance-none transition-all cursor-pointer disabled:opacity-50"
                              >
                                <option value="" disabled>
                                  {isLoadingDentists
                                    ? "Loading practitioners..."
                                    : "Select a Dentist..."}
                                </option>

                                {/* Dynamic Options from Appwrite */}
                                {!isLoadingDentists &&
                                  availableDentists.map((dentist) => (
                                    <option
                                      key={dentist.$id}
                                      value={dentist.name}
                                    >
                                      {dentist.name}
                                    </option>
                                  ))}
                              </select>

                              {/* Custom Arrow Icon */}
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                                {isLoadingDentists ? (
                                  <FiLoader
                                    className="animate-spin"
                                    size={16}
                                  />
                                ) : (
                                  <ChevronDown size={16} />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Styled Current Note Display - Made it look like a "Read-Only" quote */}
                          {selectedAppointment.adminNote && (
                            <div className="relative group">
                              <div className="absolute -left-1 top-0 bottom-0 w-1 bg-amber-400 rounded-full" />
                              <div className="pl-4">
                                <p className="text-[10px] font-bold text-amber-600/70 dark:text-amber-500/50 uppercase tracking-tight">
                                  Previous Record
                                </p>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                  {selectedAppointment.adminNote}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Modern Textarea with Integrated Save Button */}
                          <div className="relative group">
                            <textarea
                              value={adminNote}
                              onChange={(e) => setAdminNote(e.target.value)}
                              disabled={isUpdating === selectedAppointment.$id}
                              placeholder="Type a new internal note here..."
                              className="w-full min-h-[120px] p-4 pb-14 text-sm bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all resize-none shadow-sm placeholder:text-zinc-400"
                            />

                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                              {/* Character Count or Status Hint */}
                              {adminNote &&
                                adminNote !== selectedAppointment.adminNote && (
                                  <span className="text-[10px] font-medium text-zinc-400 mr-2 animate-pulse">
                                    Unsaved changes...
                                  </span>
                                )}

                              <button
                                disabled={
                                  adminNote === selectedAppointment.adminNote ||
                                  !adminNote ||
                                  isUpdating === selectedAppointment.$id
                                }
                                onClick={() =>
                                  handleUpdateStatus(
                                    selectedAppointment,
                                    selectedAppointment.status,
                                    adminNote,
                                  )
                                }
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-0 disabled:pointer-events-none hover:shadow-lg shadow-zinc-900/20"
                              >
                                {isUpdating === selectedAppointment.$id ? (
                                  <>
                                    <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save size={14} />
                                    Save Note
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            {/* Changed <p> to <div> to allow internal <div> dots */}
                            <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                              {selectedAppointment.attendanceStatus ===
                              "attended" ? (
                                <>
                                  <div className="w-1 h-1 rounded-full bg-green-500" />
                                  <span>Marked Attended:</span>
                                  <span className="text-zinc-900 dark:text-zinc-200 font-black">
                                    {new Date(
                                      selectedAppointment.$updatedAt,
                                    ).toLocaleString([], {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </>
                              ) : selectedAppointment.attendanceStatus ===
                                "not-attended" ? (
                                <>
                                  <div className="w-1 h-1 rounded-full bg-red-500" />
                                  <span>Cancelled:</span>
                                  <span className="text-zinc-900 dark:text-zinc-200 font-black">
                                    {new Date(
                                      selectedAppointment.$updatedAt,
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </>
                              ) : (
                                <span className="opacity-50 italic">
                                  Waiting for check-in...
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quick Status Actions - Grid Layout for Modern Feel */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* COMPLETED BUTTON */}
                            <button
                              disabled={isUpdating}
                              // Completed (Attended) Button
                              onClick={() =>
                                handleUpdateStatus(
                                  selectedAppointment,
                                  null,
                                  adminNote,
                                  "attended",
                                )
                              }
                              className={`flex flex-col items-center justify-center gap-1.5 p-3 bg-white dark:bg-zinc-900 border rounded-2xl transition-all group disabled:opacity-50 ${
                                selectedAppointment.attendanceStatus ===
                                "attended"
                                  ? "border-green-500 bg-green-50/50 dark:bg-green-500/10 ring-2 ring-green-500/20"
                                  : "border-zinc-200 dark:border-zinc-800 hover:border-green-500/50 hover:bg-green-50/50"
                              }`}
                            >
                              <div
                                className={`p-2 rounded-lg transition-transform group-hover:scale-110 ${
                                  selectedAppointment.attendanceStatus ===
                                  "attended"
                                    ? "bg-green-500 text-white"
                                    : "bg-green-100 dark:bg-green-900/30 text-green-600"
                                }`}
                              >
                                <CheckCircle2 size={16} />
                              </div>
                              <span
                                className={`text-[10px] font-black uppercase tracking-widest ${
                                  selectedAppointment.attendanceStatus ===
                                  "attended"
                                    ? "text-green-600"
                                    : "text-zinc-600 dark:text-zinc-400"
                                }`}
                              >
                                Completed
                              </span>
                            </button>

                            {/* CANCELLED BUTTON */}
                            <button
                              disabled={isUpdating}
                              // Not Attended (Cancelled) Button
                              onClick={() =>
                                handleUpdateStatus(
                                  selectedAppointment,
                                  null,
                                  adminNote,
                                  "not-attended",
                                )
                              }
                              className={`flex flex-col items-center justify-center gap-1.5 p-3 bg-white dark:bg-zinc-900 border rounded-2xl transition-all group disabled:opacity-50 ${
                                selectedAppointment.attendanceStatus ===
                                "not-attended"
                                  ? "border-red-500 bg-red-50/50 dark:bg-red-500/10 ring-2 ring-red-500/20"
                                  : "border-zinc-200 dark:border-zinc-800 hover:border-red-500/50 hover:bg-red-50/50"
                              }`}
                            >
                              <div
                                className={`p-2 rounded-lg transition-transform group-hover:scale-110 ${
                                  selectedAppointment.attendanceStatus ===
                                  "not-attended"
                                    ? "bg-red-500 text-white"
                                    : "bg-red-100 dark:bg-red-900/30 text-red-600"
                                }`}
                              >
                                <XCircle size={16} />
                              </div>
                              <span
                                className={`text-[10px] font-black uppercase tracking-widest ${
                                  selectedAppointment.attendanceStatus ===
                                  "not-attended"
                                    ? "text-red-600"
                                    : "text-zinc-600 dark:text-zinc-400"
                                }`}
                              >
                                Cancelled
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Audit Section */}
                        <div className="pt-4 flex items-center justify-between text-[10px] text-zinc-400 font-medium border-t border-zinc-100 dark:border-zinc-800 mt-2">
                          <span className="flex items-center gap-1">
                            <Info size={12} /> Created on{" "}
                            {format(
                              new Date(selectedAppointment.$createdAt),
                              "MM/dd/yy",
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <ShieldCheck size={12} /> Verified Patient
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-6 mt-10">
                        {/* TOP SECTION: Status-Specific Actions */}
                        <div className="grid grid-cols-1 gap-3">
                          {console.log(selectedAppointment)}
                          {selectedAppointment.status === "pending" ? (
                            /* CASE 1: PENDING - Show Approve and Cancel */
                            <div className="flex flex-col gap-4">
                              {/* Date & Time override for Approval */}
                              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-3">
                                <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2">Approved Schedule</h4>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase">Date</label>
                                    <input
                                      type="date"
                                      value={approvedDateStr}
                                      onChange={(e) => setApprovedDateStr(e.target.value)}
                                      className="w-full p-2 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:border-primary-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase">Time</label>
                                    <input
                                      type="time"
                                      value={approvedTimeStr ? (approvedTimeStr.includes("AM") || approvedTimeStr.includes("PM") ? new Date(`1970/01/01 ${approvedTimeStr}`).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : approvedTimeStr) : ""}
                                      onChange={(e) => {
                                        const timeValue = e.target.value;
                                        if(timeValue){
                                            const [hours, minutes] = timeValue.split(":");
                                            const ampm = hours >= 12 ? 'PM' : 'AM';
                                            const hour12 = hours % 12 || 12;
                                            setApprovedTimeStr(`${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`);
                                        } else {
                                            setApprovedTimeStr("");
                                        }
                                      }}
                                      className="w-full p-2 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:border-primary-500"
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  disabled={isUpdating}
                                  onClick={async () => {
                                    setIsUpdating(true);
                                    try {
                                      await handleUpdateStatus(
                                        selectedAppointment,
                                        "confirmed",
                                        adminNote,
                                        null,
                                        null,
                                        approvedDateStr,
                                        approvedTimeStr
                                      );
                                    setSelectedAppointment(null);
                                  } catch (error) {
                                    console.error("Failed to approve:", error);
                                  } finally {
                                    setIsUpdating(false);
                                  }
                                }}
                                className="relative py-3.5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-primary-700 transition-all hover:shadow-lg hover:shadow-primary-600/20 active:scale-95 disabled:opacity-70"
                              >
                                {isUpdating ? (
                                  <Loader2
                                    className="animate-spin mx-auto"
                                    size={14}
                                  />
                                ) : (
                                  "Approve"
                                )}
                              </button>

                              <button
                                disabled={isUpdating}
                                onClick={async () => {
                                  setIsUpdating(true);
                                  try {
                                    await handleUpdateStatus(
                                      selectedAppointment,
                                      "cancelled",
                                      adminNote,
                                    );
                                    setSelectedAppointment(null);
                                  } catch (error) {
                                    console.error("Failed to cancel:", error);
                                  } finally {
                                    setIsUpdating(false);
                                  }
                                }}
                                className="py-3.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all active:scale-95"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                            /* CASE 2: CONFIRMED/COMPLETED - Show Close Preview */
                            <button
                              disabled={isUpdating}
                              onClick={() => setSelectedAppointment(null)}
                              className="py-3.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all active:scale-95"
                            >
                              Close Preview
                            </button>
                          )}
                        </div>

                        {/* BOTTOM SECTION: Danger Zone (Always Visible) */}
                        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                          <button
                            disabled={isDeleting}
                            onClick={async () => {
                              if (
                                confirm(
                                  "Are you sure you want to delete this record permanently? This cannot be undone.",
                                )
                              ) {
                                setIsDeleting(true);
                                try {
                                  await handleDelete(selectedAppointment.$id);
                                  setSelectedAppointment(null);
                                } finally {
                                  setIsDeleting(false);
                                }
                              }
                            }}
                            className="w-full py-3 text-red-500/60 hover:text-red-500 rounded-xl font-bold uppercase tracking-[0.2em] text-[9px] hover:bg-red-50/50 dark:hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                          >
                            {isDeleting ? (
                              <Loader2 className="animate-spin" size={12} />
                            ) : (
                              <Trash2 size={12} />
                            )}
                            {isDeleting ? "Deleting..." : "Delete Permanently"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-12 text-center">
                      <div className="text-zinc-300 mb-4 flex justify-center">
                        <Eye size={48} />
                      </div>
                      <p className="text-zinc-500 font-bold">
                        Select an appointment to view full details
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

      {/* MODAL: Add Patient */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            {/* Header */}
            <div className="p-8 pb-4 flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                  Manual Booking
                </h3>
                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-1">
                  Full Administrative Entry
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all text-zinc-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-x-4 gap-y-4">
                {/* --- PATIENT IDENTITY --- */}
                <div className="md:col-span-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                    Patient Identity
                  </h4>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                    value={newEvent.lastName}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, lastName: e.target.value })
                    }
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                    value={newEvent.firstName}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, firstName: e.target.value })
                    }
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    placeholder="Optional"
                    className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                    value={newEvent.middleName}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, middleName: e.target.value })
                    }
                  />
                </div>

                {/* --- CONTACT & PERSONAL --- */}
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="patient@email.com"
                    className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                    value={newEvent.email}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, email: e.target.value })
                    }
                  />
                </div>

                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                    value={newEvent.phone}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, phone: e.target.value })
                    }
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-1">
                    Birthdate
                  </label>
                  <input
                    type="date"
                    className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                    value={newEvent.birthdate}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, birthdate: e.target.value })
                    }
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-1">
                    Gender
                  </label>
                  <select
                    className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                    value={newEvent.gender}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, gender: e.target.value })
                    }
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-1">
                    Civil Status
                  </label>
                  <select
                    className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                    value={newEvent.civilStatus}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, civilStatus: e.target.value })
                    }
                  >
                    <option value="">Select</option>
                    <option value="Filipino">Filipino</option>
                    <option value="Bisaya">Bisaya</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                {/* --- LOGISTICS --- */}
                <div className="md:col-span-6 mt-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                    Visit Details
                  </h4>
                </div>

                <div className="md:col-span-4 space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-1">
                    Home Address
                  </label>
                  <input
                    type="text"
                    className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                    value={newEvent.address}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, address: e.target.value })
                    }
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-1">
                    Occupation
                  </label>
                  <input
                    type="text"
                    className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                    value={newEvent.occupation}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, occupation: e.target.value })
                    }
                  />
                </div>

                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-1">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                    value={newEvent.date}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, date: e.target.value })
                    }
                  />
                </div>

                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-1">
                    Referral Source
                  </label>
                  <input
                    type="text"
                    placeholder="Facebook, Friend, etc."
                    className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                    value={newEvent.referralSource}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        referralSource: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="md:col-span-6 space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-1">
                    Reason for Visit
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white resize-none"
                    value={newEvent.notes}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, notes: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-8 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-5 bg-primary hover:bg-primary-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSaving ? "Creating Entry..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reschedule */}
      {rescheduleEvent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2rem] p-8 border border-primary/20 shadow-2xl shadow-primary/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                <Calendar size={20} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                Reschedule Patient
              </h3>
            </div>

            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 font-medium leading-relaxed">
              You are suggesting a new appointment time for{" "}
              <span className="text-primary font-bold">
                {rescheduleEvent.title}
              </span>
              . This will reset their status to{" "}
              <span className="italic font-semibold">pending</span>.
            </p>

            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1 tracking-widest">
                  Proposed Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 ring-primary/20 focus:border-primary outline-none dark:text-white transition-all"
                  value={newDateValue}
                  onChange={(e) => setNewDateValue(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setRescheduleEvent(null);
                    setNewDateValue("");
                  }}
                  className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReappointSave}
                  disabled={!newDateValue}
                  className="flex-1 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-red-100 dark:border-red-900/20 shadow-2xl max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-2">
              Delete Record?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
              This patient record will be permanently removed from the database.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20 transition-all active:scale-95"
                onClick={() => handleDelete(deleteId)}
              >
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cleanup Past Appointments Modal */}
      <CleanupPastAppointmentsModal
        isOpen={showCleanupModal}
        onClose={() => setShowCleanupModal(false)}
        events={events}
        onPurgeSuccess={handlePurgeSuccess}
      />

      <Toaster position="top-right" />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Home,
  Settings,
  Users,
  Stethoscope,
  Menu,
  X,
  Package,
  Search,
  Sun,
  Moon,
  Plus,
  LogOut,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import SettingsData from "./dashboard/Settings";
import Reports from "./dashboard/Reports";
import Patients from "./dashboard/Patients";
import dynamic from "next/dynamic";

const Appointments = dynamic(() => import("./dashboard/Appointments"), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <span className="loading loading-spinner text-amber-500"></span>
    </div>
  ),
});
import { useServices } from "./hooks/useServices";
import { databases } from "../lib/appwrite";
import { ID } from "appwrite";
import { usePatientStore } from "../stores/usePatientStore";
import { useAuthStore } from "../stores/authStore";
import { usePersonalizationStore } from "../stores/usePersonalizationStore";
import { useThemeStore } from "./layout/ThemeProvider";
import { toast } from "sonner";
import ExpenseModal from "./dashboard/actions/ExpenseModal";
import DashboardData from "./dashboard/DashboardData";
import Products from "./dashboard/Products";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Badge } from "./ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/Dialog";
import { CommandPalette } from "./ui/CommandPalette";

const PATIENTS_COLLECTION_ID = "patients";
const INSTALLMENTS_COLLECTION_ID = "installments";
const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: <Home size={19} /> },
  { id: "appointments", label: "Appointments", icon: <Calendar size={19} /> },
  { id: "patients", label: "Patients", icon: <Users size={19} /> },
  { id: "products", label: "Products", icon: <Package size={19} /> },
  { id: "reports", label: "Reports", icon: <Stethoscope size={19} /> },
  { id: "settings", label: "Settings", icon: <Settings size={19} /> },
];

export default function DentalClinicLayout() {
  const [active, setActive] = useState("dashboard");
  const [dateTime, setDateTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Command Palette State
  const [cmdOpen, setCmdOpen] = useState(false);

  // Modals
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState(null);

  // Stores
  const { logout, current } = useAuthStore((state) => state);
  const { fetchPatients, patients } = usePatientStore((state) => state);
  const { clientTitle, clientInitial } = usePersonalizationStore((state) => state);
  const { theme, toggleTheme } = useThemeStore();
  const { services, loading: servicesLoading } = useServices();

  const [serviceType, setServiceType] = useState("One-time");
  const [selectedService, setSelectedService] = useState("");
  const [selectedSubService, setSelectedSubService] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCommandSelect = (type, payload) => {
    if (type === "nav") {
      setActive(payload);
    } else if (type === "action") {
      if (payload === "new-patient") setIsPatientModalOpen(true);
      if (payload === "add-expense") setIsExpenseModalOpen(true);
    } else if (type === "patient") {
      setActive("patients");
      usePatientStore.getState().setSelectedPatient(payload);
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
    toast.info(`Switched to ${theme === "light" ? "Dark" : "Light"} mode`, {
      icon: theme === "light" ? "🌙" : "☀️",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const patientData = {
      patientName: formData.get("name"),
      patientAge: Number(formData.get("age")),
      address: formData.get("address"),
      gender: formData.get("gender"),
      contact: formData.get("contact"),
      medicalHistory: formData.get("medicalHistory") || "",
      serviceName: services.find((s) => s.id === selectedService)?.name || "",
      subServiceName:
        services
          .find((s) => s.id === selectedService)
          ?.subServices.find((sub) => sub.id === selectedSubService)?.name || "",
      serviceType: formData.get("service-type"),
      servicePrice:
        serviceType === "Installment"
          ? Number(formData.get("totalPrice"))
          : Number(formData.get("servicePrice")),
      balance:
        serviceType === "Installment"
          ? Number(formData.get("totalPrice")) - Number(formData.get("initialPayment"))
          : 0,
    };

    try {
      const newPatient = await databases.createDocument(
        DATABASE_ID,
        PATIENTS_COLLECTION_ID,
        ID.unique(),
        patientData
      );

      if (patientData.serviceType === "Installment") {
        const initialPayment = Number(formData.get("initialPayment")) || 0;
        const balanceAfter = patientData.servicePrice - initialPayment;

        const transaction = await databases.createDocument(
          DATABASE_ID,
          "transactions",
          ID.unique(),
          {
            patientId: newPatient.$id,
            patientName: newPatient.patientName,
            serviceName: newPatient.serviceName,
            subServiceName: newPatient.subServiceName ?? "",
            amount: initialPayment,
            totalFee: patientData.servicePrice,
            paymentType: "Installment",
            date: new Date().toISOString(),
          }
        );

        await databases.createDocument(
          DATABASE_ID,
          INSTALLMENTS_COLLECTION_ID,
          ID.unique(),
          {
            patientId: newPatient.$id,
            amountPaid: initialPayment,
            balanceAfter,
            paymentDate: new Date().toISOString(),
            transactionId: transaction.$id,
          }
        );
      } else {
        await databases.createDocument(
          DATABASE_ID,
          "transactions",
          ID.unique(),
          {
            patientId: newPatient.$id,
            patientName: newPatient.patientName,
            serviceName: newPatient.serviceName,
            subServiceName: newPatient.subServiceName ?? "",
            amount: patientData.servicePrice,
            totalFee: patientData.servicePrice,
            paymentType: "One-time",
            date: new Date().toISOString(),
          }
        );
      }

      toast.success("Patient successfully registered! 🎉", {
        description: `${patientData.patientName} (${patientData.serviceType}) added to directory.`,
      });
      setIsPatientModalOpen(false);
      fetchPatients(true);
    } catch (error) {
      console.error("Error saving patient:", error);
      toast.error("Registration failed", {
        description: error?.message || "Could not register patient record.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] overflow-hidden">
      {/* Global Command Palette */}
      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        onSelectAction={handleCommandSelect}
        patients={patients}
      />

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditExpense(null);
        }}
        expense={editExpense}
      />

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-200 ease-in-out
        w-64 bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] flex flex-col z-30 shadow-lg md:shadow-none`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[hsl(var(--border))] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/m&m-dental-center-logo.png"
              alt="Clinic Logo"
              className="w-10 h-10 object-contain drop-shadow-sm"
            />
            <div>
              <h1 className="text-base font-bold leading-tight tracking-tight text-[hsl(var(--foreground))]">
                {clientTitle ? clientTitle : "M&M Dental Center"}
              </h1>
              <p className="text-[11px] text-amber-500 font-medium tracking-wide uppercase">
                Clinical Management
              </p>
            </div>
          </div>
          <button
            className="md:hidden p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActive(item.id);
                  setSidebarOpen(false);
                }}
                className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-amber-500 text-black font-semibold shadow-sm shadow-amber-500/20"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.id === "patients" && (
                  <Badge
                    variant={isActive ? "outline" : "secondary"}
                    className={isActive ? "border-black/30 text-black font-bold text-[10px]" : "text-[10px]"}
                  >
                    {patients.length}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout in Footer */}
        <div className="p-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 flex items-center justify-center text-xs font-bold shrink-0">
                {clientInitial ? clientInitial : "MM"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium truncate text-[hsl(var(--foreground))]">
                  {current?.email || "Staff User"}
                </p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                  Administrator
                </p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Log out"
              className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Modern Header */}
        <header className="h-16 px-4 sm:px-6 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/70 backdrop-blur-md flex items-center justify-between sticky top-0 z-10 shrink-0">
          {/* Left: Mobile Menu & Live Clock */}
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>

            <div className="hidden sm:flex flex-col">
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                {dateTime.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="text-sm font-mono font-semibold text-amber-500">
                {dateTime.toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Center: Command Palette Trigger */}
          <div className="flex-1 max-w-md mx-4">
            <button
              onClick={() => setCmdOpen(true)}
              className="w-full flex items-center justify-between h-9 px-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/60 text-xs text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Search size={14} />
                <span>Search patients, navigate, or action...</span>
              </div>
              <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-1.5 font-mono text-[10px] font-semibold text-[hsl(var(--muted-foreground))]">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right: Quick Action Buttons & Theme Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleThemeToggle}
              className="text-[hsl(var(--foreground))]"
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} className="text-amber-400" />}
            </Button>

            {/* Quick Actions */}
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpenseModalOpen(true)}
              >
                + Expense
              </Button>
              <Button
                size="sm"
                onClick={() => setIsPatientModalOpen(true)}
                className="gap-1.5"
              >
                <Plus size={15} />
                <span>New Patient</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <section className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
          {active === "dashboard" && <DashboardData />}
          {active === "appointments" && <Appointments />}
          {active === "patients" && <Patients />}
          {active === "products" && <Products />}
          {active === "reports" && <Reports />}
          {active === "settings" && <SettingsData />}
        </section>
      </main>

      {/* Floating Action Button on Mobile */}
      <div className="fixed bottom-5 right-5 sm:hidden z-40">
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-xl shadow-amber-500/30"
          onClick={() => setIsPatientModalOpen(true)}
        >
          <Plus size={22} />
        </Button>
      </div>

      {/* Radix Accessible New Patient Dialog */}
      <Dialog open={isPatientModalOpen} onOpenChange={setIsPatientModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register New Patient</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">
                  Full Name *
                </label>
                <Input
                  type="text"
                  name="name"
                  placeholder="e.g. Maria Santos"
                  required
                />
              </div>

              {/* Age */}
              <div>
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">
                  Age *
                </label>
                <Input type="number" name="age" placeholder="e.g. 28" required />
              </div>

              {/* Gender */}
              <div>
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">
                  Gender *
                </label>
                <select
                  name="gender"
                  className="flex h-9 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-1 text-sm text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select Gender
                  </option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* Contact */}
              <div>
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">
                  Contact Number *
                </label>
                <Input
                  type="text"
                  name="contact"
                  placeholder="0917-xxx-xxxx"
                  required
                />
              </div>

              {/* Address */}
              <div>
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">
                  Address *
                </label>
                <Input
                  type="text"
                  name="address"
                  placeholder="City / Municipality"
                  required
                />
              </div>

              {/* Medical History & Health Alerts */}
              <div className="sm:col-span-2 space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-amber-500" />
                    Medical History, Allergies & Health Notes
                  </label>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                    Optional
                  </span>
                </div>
                <textarea
                  name="medicalHistory"
                  id="reg_medical_history"
                  rows={2}
                  placeholder="e.g. Penicillin allergy, Hypertension, Diabetic, Bleeding disorder, Asthma, Current medications..."
                  className="flex w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-xs text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                />
                {/* Quick Condition / Allergy Presets */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {[
                    "Penicillin Allergy",
                    "Latex Allergy",
                    "Hypertension",
                    "Diabetic",
                    "Bleeding Tendency",
                    "Asthma",
                    "Heart Disease",
                    "Pregnant",
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const el = document.getElementById("reg_medical_history");
                        if (el) {
                          const val = el.value.trim();
                          el.value = val ? `${val}, ${tag}` : tag;
                        }
                      }}
                      className="px-2 py-0.5 rounded-md text-[10px] bg-[hsl(var(--muted))]/70 text-[hsl(var(--muted-foreground))] hover:bg-amber-500/15 hover:text-amber-500 border border-[hsl(var(--border))] transition-colors cursor-pointer"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Service Selection */}
            <div className="border-t border-[hsl(var(--border))] pt-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">
                    Service *
                  </label>
                  <select
                    className="flex h-9 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-1 text-sm text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                    value={selectedService}
                    onChange={(e) => {
                      setSelectedService(e.target.value);
                      setSelectedSubService("");
                    }}
                    required
                  >
                    <option value="">-- Choose a Service --</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedService && (
                  <div>
                    <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">
                      Sub-procedure
                    </label>
                    <select
                      className="flex h-9 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-1 text-sm text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                      value={selectedSubService}
                      onChange={(e) => setSelectedSubService(e.target.value)}
                    >
                      <option value="">-- Choose Sub-procedure --</option>
                      {services
                        .find((s) => s.id === selectedService)
                        ?.subServices.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Payment Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">
                    Billing Type
                  </label>
                  <select
                    name="service-type"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-1 text-sm text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                  >
                    <option value="One-time">One-time Payment</option>
                    <option value="Installment">Installment Plan</option>
                  </select>
                </div>

                {serviceType === "One-time" && (
                  <div>
                    <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">
                      Amount (₱) *
                    </label>
                    <Input
                      type="number"
                      name="servicePrice"
                      placeholder="0.00"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Installment breakdown */}
              {serviceType === "Installment" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[hsl(var(--muted))]/40 border border-[hsl(var(--border))]">
                  <div>
                    <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">
                      Total Agreed Cost (₱) *
                    </label>
                    <Input
                      type="number"
                      name="totalPrice"
                      placeholder="e.g. 35000"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">
                      Downpayment (₱) *
                    </label>
                    <Input
                      type="number"
                      name="initialPayment"
                      placeholder="e.g. 10000"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[hsl(var(--border))]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPatientModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                Register Patient
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Search, User, Trash2, Phone, MapPin, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { usePatientStore } from "../../stores/usePatientStore";
import TransactionsPanel from "./actions/TransactionPanel";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/Dialog";

export default function PatientsLayout() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all' | 'installment' | 'balance'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const handleDeleteClick = (e, p) => {
    e.stopPropagation();
    setPatientToDelete(p);
  };

  const handleConfirmDelete = async () => {
    if (!patientToDelete) return;
    try {
      setDeleteSaving(true);
      await deletePatient(patientToDelete.$id);
      setPatientToDelete(null);
    } catch (err) {
      console.error("Error deleting patient:", err);
    } finally {
      setDeleteSaving(false);
    }
  };

  const {
    patients,
    fetchPatients,
    loading,
    selectedPatient,
    setSelectedPatient,
    deletePatient,
  } = usePatientStore();

  const filteredPatients = patients.filter((p) => {
    const matchesSearch = [p.patientName || p.name, p.serviceName, p.address, p.contact]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === "installment") return p.serviceType === "Installment";
    if (filterType === "balance") return Number(p.balance) > 0;
    return true;
  });

  const handleSelect = (p) => {
    setSelectedPatient(p);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsModalOpen(true);
    }
  };

  const handleFilterChange = (id, label) => {
    setFilterType(id);
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-8.5rem)] gap-4">
      {/* Left: Searchable Patient Directory */}
      <Card className="w-full md:w-80 lg:w-96 flex flex-col shrink-0 overflow-hidden border-[hsl(var(--border))]">
        <div className="p-3.5 border-b border-[hsl(var(--border))] space-y-2.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <Input
              type="text"
              placeholder="Search by name, treatment, address..."
              className="pl-8 h-9 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1">
            {[
              { id: "all", label: "All" },
              { id: "installment", label: "Installments" },
              { id: "balance", label: "With Balance" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleFilterChange(tab.id, tab.label)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                  filterType === tab.id
                    ? "bg-amber-500/20 text-amber-500 font-semibold border border-amber-500/30"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List of Patients */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {loading ? (
            <div className="p-4 text-center text-xs text-[hsl(var(--muted-foreground))]">
              Loading patients...
            </div>
          ) : filteredPatients.length > 0 ? (
            filteredPatients.map((p) => {
              const isSelected = selectedPatient?.$id === p.$id;
              const hasBalance = Number(p.balance) > 0;
              const initials = (p.patientName || p.name || "P")
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <div
                  key={p.$id}
                  className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-amber-500/15 border-amber-500/50 shadow-sm"
                      : "bg-[hsl(var(--card))] border-[hsl(var(--border))]/70 hover:bg-[hsl(var(--accent))]/70 hover:border-[hsl(var(--border))]"
                  }`}
                  onClick={() => handleSelect(p)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected
                          ? "bg-amber-500 text-black"
                          : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
                      }`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold truncate text-[hsl(var(--foreground))]">
                          {p.patientName || p.name}
                        </p>
                        {p.medicalHistory && (
                          <span
                            title={`Medical Alert: ${p.medicalHistory}`}
                            className="text-amber-500 shrink-0"
                          >
                            <AlertTriangle size={11} />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">
                        {p.contact ? `📞 ${p.contact}` : `${p.patientAge} yrs • ${p.gender}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {hasBalance ? (
                      <Badge variant="warning" className="text-[10px] px-1.5 py-0 font-medium">
                        ₱{Number(p.balance).toLocaleString()}
                      </Badge>
                    ) : (
                      <Badge variant="success" className="text-[10px] px-1.5 py-0 font-medium">
                        Paid
                      </Badge>
                    )}
                    <button
                      onClick={(e) => handleDeleteClick(e, p)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-opacity"
                      title="Delete patient"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-[hsl(var(--muted-foreground))]">
              No matching patient records.
            </div>
          )}
        </div>
      </Card>

      {/* Right: Master Patient Details (Desktop) */}
      <div className="hidden md:flex flex-1 flex-col overflow-y-auto min-w-0 space-y-4">
        {selectedPatient ? (
          <PatientDetails patient={selectedPatient} fetchPatients={fetchPatients} />
        ) : (
          <Card className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--muted-foreground))] mb-3">
              <User size={26} />
            </div>
            <h3 className="text-base font-semibold text-[hsl(var(--foreground))]">
              No Patient Selected
            </h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 max-w-sm">
              Click any patient from the directory on the left to review their profile, treatment history, and balance ledger.
            </p>
          </Card>
        )}
      </div>

      {/* Mobile Drawer/Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Record</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <PatientDetails
              patient={selectedPatient}
              fetchPatients={fetchPatients}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ⚠️ Accessible Radix Delete Patient Confirmation Dialog */}
      <Dialog
        open={!!patientToDelete}
        onOpenChange={(open) => {
          if (!open && !deleteSaving) setPatientToDelete(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Delete Patient Record
                </DialogTitle>
                <DialogDescription className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                  Are you sure you want to permanently remove this patient from the directory?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {patientToDelete && (() => {
            const hasBal = Number(patientToDelete.balance || 0) > 0;
            return (
              <div className="space-y-3 pt-2">
                {/* Patient Details Card */}
                <div className="rounded-xl bg-[hsl(var(--muted))]/40 border border-[hsl(var(--border))] p-3.5 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-[hsl(var(--foreground))]">
                      {patientToDelete.patientName || patientToDelete.name}
                    </span>
                    <Badge variant={hasBal ? "warning" : "success"} className="text-[10px]">
                      {patientToDelete.serviceType || "One-time"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                    <div>
                      <span>Age & Gender:</span>
                      <p className="font-medium text-[hsl(var(--foreground))]">
                        {patientToDelete.patientAge ? `${patientToDelete.patientAge} yrs • ` : ""}{patientToDelete.gender || "-"}
                      </p>
                    </div>
                    <div>
                      <span>Contact:</span>
                      <p className="font-medium text-[hsl(var(--foreground))]">
                        {patientToDelete.contact || "None"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[hsl(var(--muted-foreground))] pt-1 border-t border-[hsl(var(--border))]">
                    <span>Total Transaction Amount:</span>
                    <span className="font-bold text-[hsl(var(--foreground))]">
                      ₱{Number(patientToDelete.servicePrice || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[hsl(var(--muted-foreground))]">
                    <span>Outstanding Balance:</span>
                    <span className={`font-bold ${hasBal ? "text-amber-500" : "text-emerald-500"}`}>
                      {hasBal ? `₱${Number(patientToDelete.balance).toLocaleString()}` : "Paid"}
                    </span>
                  </div>
                </div>

                {/* Purge Warning Notice */}
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 space-y-1">
                  <p className="font-medium flex items-center gap-1.5">
                    <AlertTriangle size={13} className="shrink-0" />
                    Permanent Purge Warning
                  </p>
                  <p className="text-[11px] opacity-90">
                    Deleting this patient will permanently purge all linked treatments, payment transactions, and installment ledgers. This cannot be undone.
                  </p>
                </div>

                <DialogFooter className="gap-2 pt-2 border-t border-[hsl(var(--border))]">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPatientToDelete(null)}
                    disabled={deleteSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleConfirmDelete}
                    loading={deleteSaving}
                    className="gap-1.5"
                  >
                    <Trash2 size={13} />
                    Delete Patient
                  </Button>
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PatientDetails({ patient, fetchPatients }) {
  const { recalculateBalance } = usePatientStore();
  const hasBalance = Number(patient.balance) > 0;
  const [recalculating, setRecalculating] = useState(false);

  const handleRecalc = async () => {
    setRecalculating(true);
    await recalculateBalance(patient.$id);
    setRecalculating(false);
  };

  return (
    <div className="space-y-4">
      {/* Patient Profile Card */}
      <Card className="border-[hsl(var(--border))]">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[hsl(var(--border))]">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">
                  {patient.patientName || patient.name}
                </h2>
                <Badge variant={hasBalance ? "warning" : "success"}>
                  {patient.serviceType || "One-time"}
                </Badge>
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                ID: {patient.$id}
              </p>
            </div>

            {/* Price & Balance Pill */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  Total Transaction Amount
                </p>
                <p className="text-sm font-bold text-[hsl(var(--foreground))]">
                  ₱{Number(patient.servicePrice || 0).toLocaleString()}
                </p>
              </div>
              <div className="h-8 w-px bg-[hsl(var(--border))]" />
              <div className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Outstanding Balance</p>
                  <button
                    onClick={handleRecalc}
                    disabled={recalculating}
                    className="p-0.5 rounded text-[hsl(var(--muted-foreground))] hover:text-amber-400 transition-colors disabled:opacity-50"
                    title="Recalculate balance from transactions"
                  >
                    <RefreshCw size={10} className={recalculating ? "animate-spin" : ""} />
                  </button>
                </div>
                <p className={`text-sm font-bold ${
                  hasBalance ? "text-amber-500" : "text-emerald-500"
                }`}>
                  {hasBalance
                    ? `₱${Number(patient.balance).toLocaleString()}`
                    : "Paid"}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Demographics & Contact Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs">
            <div className="p-2.5 rounded-lg bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]">
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider block">
                Age & Gender
              </span>
              <span className="font-semibold text-[hsl(var(--foreground))]">
                {patient.patientAge} yrs • {patient.gender}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]">
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider block flex items-center gap-1">
                <Phone size={10} /> Contact
              </span>
              <span className="font-semibold text-[hsl(var(--foreground))]">
                {patient.contact || "None"}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]">
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider block flex items-center gap-1">
                <MapPin size={10} /> Address
              </span>
              <span className="font-semibold text-[hsl(var(--foreground))] truncate block">
                {patient.address || "-"}
              </span>
            </div>
          </div>

          {/* Medical History & Health Alerts */}
          <div className="mt-3.5 pt-3.5 border-t border-[hsl(var(--border))]">
            {patient.medicalHistory ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">
                      Medical History & Health Alerts
                    </span>
                    <Badge variant="warning" className="text-[10px] px-1.5 py-0 font-medium">
                      Clinical Alert
                    </Badge>
                  </div>
                  <p className="text-xs text-[hsl(var(--foreground))] font-medium mt-1 leading-relaxed">
                    {patient.medicalHistory}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-[hsl(var(--muted))]/40 border border-[hsl(var(--border))] flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>No adverse medical history or drug allergies recorded.</span>
                </div>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] italic">
                  General Clearance
                </span>
              </div>
            )}
          </div>

        </CardContent>
      </Card>

      {/* Financial Transactions Ledger */}
      <TransactionsPanel patient={patient} />
    </div>
  );
}

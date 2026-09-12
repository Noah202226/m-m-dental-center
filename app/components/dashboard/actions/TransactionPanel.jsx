"use client";

import { useEffect, useState } from "react";
import { usePatientStore } from "@/app/stores/usePatientStore";
import { useServices } from "../../hooks/useServices";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../ui/Card";
import { Button } from "../../ui/Button";
import { Badge } from "../../ui/Badge";
import { Input } from "../../ui/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/Dialog";
import {
  Receipt,
  Plus,
  Trash2,
  Calendar,
  FileText,
  CreditCard,
  Pencil,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

// ─── shared style tokens ───────────────────────────────────────────────────
const SELECT_CLS =
  "flex h-9 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-1 text-sm text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]";
const TEXTAREA_CLS =
  "flex w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]";
const TODAY = new Date().toISOString().split("T")[0];

export default function TransactionsPanel({ patient }) {
  const {
    transactions,
    transactionsLoading,
    fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    payInstallment,
  } = usePatientStore();

  const { services } = useServices();
  const subsFor = (name) =>
    services.find((s) => s.name === name)?.subServices ?? [];

  // ── Add New Transaction Form State ───────────────────────────────────────
  const BLANK_ADD = {
    service: "",
    subService: "",
    paymentType: "One-time", // "One-time" | "Installment"
    totalFee: "",
    amount: "",
    date: TODAY,
    notes: "",
  };
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(BLANK_ADD);
  const [addSaving, setAddSaving] = useState(false);

  // ── Edit Transaction State ───────────────────────────────────────────────
  const [editTxn, setEditTxn] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  // ── Pay Installment State ────────────────────────────────────────────────
  const [payTxn, setPayTxn] = useState(null);
  const [payForm, setPayForm] = useState({ amount: "", date: TODAY, notes: "" });
  const [paySaving, setPaySaving] = useState(false);

  useEffect(() => {
    if (patient?.$id) fetchTransactions(patient.$id);
  }, [patient?.$id, fetchTransactions]);

  // ── Add Transaction Handler ──────────────────────────────────────────────
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const isInstallment = addForm.paymentType === "Installment";

    if (isInstallment) {
      const totalFee = parseInt(addForm.totalFee);
      const downpayment = parseInt(addForm.amount || "0");
      if (!totalFee || totalFee <= 0) {
        return toast.error("Please enter a valid Total Treatment Fee");
      }
      if (downpayment < 0) {
        return toast.error("Downpayment cannot be negative");
      }
      if (downpayment > totalFee) {
        return toast.error("Downpayment cannot exceed Total Treatment Fee");
      }

      try {
        setAddSaving(true);
        await addTransaction(patient.$id, {
          paymentType: "Installment",
          totalFee: totalFee,
          amount: downpayment,
          date: addForm.date,
          remarks: addForm.notes,
          patientName: patient?.patientName || patient?.name,
          serviceName: addForm.service,
          subServiceName: addForm.subService,
        });
        setAddForm(BLANK_ADD);
        setIsAddOpen(false);
      } catch {
        /* toast handled by store */
      } finally {
        setAddSaving(false);
      }
    } else {
      // One-time payment
      const parsed = parseInt(addForm.amount);
      if (!parsed || parsed <= 0) {
        return toast.error("Please enter a valid amount");
      }

      try {
        setAddSaving(true);
        await addTransaction(patient.$id, {
          paymentType: "One-time",
          totalFee: parsed,
          amount: parsed,
          date: addForm.date,
          remarks: addForm.notes,
          patientName: patient?.patientName || patient?.name,
          serviceName: addForm.service,
          subServiceName: addForm.subService,
        });
        setAddForm(BLANK_ADD);
        setIsAddOpen(false);
      } catch {
        /* toast handled by store */
      } finally {
        setAddSaving(false);
      }
    }
  };

  // ── Edit Transaction Handlers ────────────────────────────────────────────
  const openEdit = (txn) => {
    setEditTxn(txn);
    setEditForm({
      service: txn.serviceName || "",
      subService: txn.subServiceName || "",
      amount: txn.amount ?? "",
      totalFee: txn.totalFee ?? txn.amount ?? "",
      paymentType: txn.paymentType || "One-time",
      date: txn.date ? txn.date.split("T")[0] : TODAY,
      notes: txn.remarks || "",
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = parseInt(editForm.amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return toast.error("Enter a valid amount paid");
    }

    const updates = {
      serviceName: editForm.service,
      subServiceName: editForm.subService,
      amount: parsedAmount,
      date: editForm.date,
      remarks: editForm.notes,
    };

    if (editTxn.paymentType === "Installment" || editForm.paymentType === "Installment") {
      const parsedTotal = parseInt(editForm.totalFee);
      if (!parsedTotal || parsedTotal <= 0) {
        return toast.error("Enter a valid total treatment fee");
      }
      updates.totalFee = parsedTotal;
    } else {
      updates.totalFee = parsedAmount;
    }

    try {
      setEditSaving(true);
      await updateTransaction(editTxn.$id, updates);
      setEditTxn(null);
    } catch {
      /* toast handled by store */
    } finally {
      setEditSaving(false);
    }
  };

  // ── Pay Installment Handlers ─────────────────────────────────────────────
  const openAddPay = (txn) => {
    const totalFee =
      txn.totalFee !== undefined && txn.totalFee !== null
        ? Number(txn.totalFee)
        : Number(txn.amount || 0);
    const paid = Number(txn.amount || 0);
    const rem = Math.max(0, totalFee - paid);

    setPayTxn(txn);
    setPayForm({
      amount: rem > 0 ? String(rem) : "",
      date: TODAY,
      notes: "",
    });
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!payTxn) return;

    const totalFee =
      payTxn.totalFee !== undefined && payTxn.totalFee !== null
        ? Number(payTxn.totalFee)
        : Number(payTxn.amount || 0);
    const paid = Number(payTxn.amount || 0);
    const rem = Math.max(0, totalFee - paid);

    const payAmt = parseInt(payForm.amount);
    if (!payAmt || payAmt <= 0) {
      return toast.error("Please enter a valid payment amount");
    }
    if (payAmt > rem) {
      return toast.error(`Payment cannot exceed remaining balance of ₱${rem.toLocaleString()}`);
    }

    try {
      setPaySaving(true);
      await payInstallment(patient.$id, payTxn.$id, {
        amount: payAmt,
        date: payForm.date,
        notes: payForm.notes,
      });
      setPayTxn(null);
    } catch {
      /* toast handled by store */
    } finally {
      setPaySaving(false);
    }
  };

  // ── Delete Transaction State & Handlers ────────────────────────────────
  const [deleteTxn, setDeleteTxn] = useState(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const handleDeleteClick = (txn) => {
    setDeleteTxn(txn);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTxn) return;
    try {
      setDeleteSaving(true);
      await deleteTransaction(deleteTxn);
      setDeleteTxn(null);
    } catch {
      /* toast handled by store */
    } finally {
      setDeleteSaving(false);
    }
  };

  return (
    <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
            <Receipt className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-[hsl(var(--foreground))]">
              Transaction History
            </CardTitle>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
              Itemized treatments and payment ledger for this patient
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {transactions.length} Records
          </Badge>
          <Button
            size="sm"
            onClick={() => {
              setAddForm(BLANK_ADD);
              setIsAddOpen(true);
            }}
            className="gap-1.5 shadow-sm"
          >
            <Plus size={14} />
            Add Transaction
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {transactionsLoading ? (
          <div className="p-8 text-center text-xs text-[hsl(var(--muted-foreground))]">
            Loading transactions…
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((txn) => {
              const isInstallment = txn.paymentType === "Installment";
              const totalFee =
                txn.totalFee !== undefined && txn.totalFee !== null
                  ? Number(txn.totalFee)
                  : Number(txn.amount || 0);
              const paid = Number(txn.amount || 0);
              const remBalance = Math.max(0, totalFee - paid);
              const canPay = isInstallment && remBalance > 0;

              return (
                <div
                  key={txn.$id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--muted))]/40 border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]/50 transition-colors"
                >
                  {/* Left: Transaction Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center text-xs font-bold shrink-0">
                      ₱
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isInstallment ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-emerald-500">
                              +₱{paid.toLocaleString()}
                            </span>
                            <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium">
                              / ₱{totalFee.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-emerald-500">
                            +₱{paid.toLocaleString()}
                          </span>
                        )}

                        <Badge
                          variant={isInstallment ? "warning" : "secondary"}
                          className="text-[10px] px-1.5 py-0 font-medium"
                        >
                          {isInstallment ? "Installment" : "One-time"}
                        </Badge>

                        {isInstallment && (
                          remBalance > 0 ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 text-amber-500 border-amber-500/30"
                            >
                              Bal: ₱{remBalance.toLocaleString()}
                            </Badge>
                          ) : (
                            <Badge
                              variant="success"
                              className="text-[10px] px-1.5 py-0 flex items-center gap-0.5"
                            >
                              <CheckCircle2 size={10} /> Paid
                            </Badge>
                          )
                        )}

                        {txn.serviceName && (
                          <span className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                            • {txn.serviceName}
                            {txn.subServiceName ? ` (${txn.subServiceName})` : ""}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Calendar size={11} />
                          {new Date(txn.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        {txn.remarks && (
                          <span className="text-[11px] truncate italic">
                            "{txn.remarks}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {/* Dedicated Pay button ONLY for installment transactions with remaining balance */}
                    {canPay && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAddPay(txn)}
                        className="h-8 px-2.5 gap-1 text-[11px] font-semibold text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                        title={`Pay installment (Bal: ₱${remBalance.toLocaleString()})`}
                      >
                        <CreditCard size={13} />
                        Pay
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(txn)}
                      className="h-8 w-8 text-[hsl(var(--muted-foreground))] hover:text-amber-400 hover:bg-amber-500/10"
                      title="Edit transaction"
                    >
                      <Pencil size={13} />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(txn)}
                      className="h-8 w-8 text-[hsl(var(--muted-foreground))] hover:text-red-500 hover:bg-red-500/10"
                      title="Delete transaction"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-[hsl(var(--border))] rounded-xl">
            <div className="h-10 w-10 mx-auto rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--muted-foreground))] mb-2">
              <FileText size={18} />
            </div>
            <p className="text-xs font-medium text-[hsl(var(--foreground))]">
              No transactions recorded yet
            </p>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
              Click "Add Transaction" to log treatments, procedures, or payments.
            </p>
          </div>
        )}
      </CardContent>

      {/* ══════════════════════════════════════════
          DIALOG 1 — Add New Transaction
      ══════════════════════════════════════════ */}
      <Dialog
        open={isAddOpen}
        onOpenChange={(o) => {
          setIsAddOpen(o);
          if (!o) setAddForm(BLANK_ADD);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Patient Transaction</DialogTitle>
          </DialogHeader>

          {/* Context pill */}
          <div className="rounded-lg bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))] p-3 text-xs flex items-center justify-between">
            <span className="text-[hsl(var(--muted-foreground))]">
              Patient:{" "}
              <span className="font-semibold text-[hsl(var(--foreground))]">
                {patient?.patientName || patient?.name}
              </span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[hsl(var(--muted-foreground))]">Current Balance:</span>
              <span className="text-amber-500 font-semibold">
                ₱{Number(patient?.balance || 0).toLocaleString()}
              </span>
            </div>
          </div>

          <form onSubmit={handleAddSubmit} className="space-y-4">
            {/* Payment Type Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                Transaction Type *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setAddForm((f) => ({ ...f, paymentType: "One-time" }))
                  }
                  className={`h-9 rounded-lg border text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                    addForm.paymentType === "One-time"
                      ? "border-amber-500 bg-amber-500/15 text-amber-500"
                      : "border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  }`}
                >
                  One-time Payment
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAddForm((f) => ({ ...f, paymentType: "Installment" }))
                  }
                  className={`h-9 rounded-lg border text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                    addForm.paymentType === "Installment"
                      ? "border-amber-500 bg-amber-500/15 text-amber-500"
                      : "border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  }`}
                >
                  Installment Plan
                </button>
              </div>
            </div>

            {/* Service */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                Service (Optional)
              </label>
              <select
                className={SELECT_CLS}
                value={addForm.service}
                onChange={(e) =>
                  setAddForm((f) => ({
                    ...f,
                    service: e.target.value,
                    subService: "",
                  }))
                }
              >
                <option value="">-- Choose a Service --</option>
                {services.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {addForm.service && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                  Sub-procedure
                </label>
                <select
                  className={SELECT_CLS}
                  value={addForm.subService}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, subService: e.target.value }))
                  }
                >
                  <option value="">-- Choose Sub-procedure --</option>
                  {subsFor(addForm.service).map((sub) => (
                    <option key={sub.id} value={sub.name}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Financial Inputs: Conditional based on Payment Type */}
            {addForm.paymentType === "Installment" ? (
              <div className="space-y-3 p-3 rounded-xl bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))]">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    Total Treatment Fee (₱) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm font-semibold text-[hsl(var(--muted-foreground))]">
                      ₱
                    </span>
                    <Input
                      type="number"
                      placeholder="e.g. 35000"
                      value={addForm.totalFee}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, totalFee: e.target.value }))
                      }
                      className="pl-8 text-sm font-semibold"
                      required
                      min={1}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    Initial Downpayment (₱) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm font-semibold text-[hsl(var(--muted-foreground))]">
                      ₱
                    </span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={addForm.amount}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, amount: e.target.value }))
                      }
                      className="pl-8 text-sm font-semibold"
                      min={0}
                    />
                  </div>
                  {addForm.totalFee && (
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                      Remaining balance will be:{" "}
                      <span className="font-semibold text-amber-500">
                        ₱{Math.max(
                          0,
                          (parseInt(addForm.totalFee) || 0) -
                            (parseInt(addForm.amount) || 0)
                        ).toLocaleString()}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                  Amount Paid (₱) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm font-semibold text-[hsl(var(--muted-foreground))]">
                    ₱
                  </span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={addForm.amount}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, amount: e.target.value }))
                    }
                    className="pl-8 text-sm font-semibold"
                    required
                    min={1}
                  />
                </div>
              </div>
            )}

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                Transaction Date *
              </label>
              <Input
                type="date"
                value={addForm.date}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, date: e.target.value }))
                }
                required
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                Remarks / Notes
              </label>
              <textarea
                placeholder="Optional treatment or payment remarks…"
                value={addForm.notes}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={2}
                className={TEXTAREA_CLS}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[hsl(var(--border))]">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddOpen(false);
                  setAddForm(BLANK_ADD);
                }}
                disabled={addSaving}
              >
                Cancel
              </Button>
              <Button type="submit" loading={addSaving}>
                Save Transaction
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════
          DIALOG 2 — Edit Transaction
      ══════════════════════════════════════════ */}
      <Dialog
        open={!!editTxn}
        onOpenChange={(o) => {
          if (!o) setEditTxn(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil size={15} className="text-amber-500" /> Edit Transaction
            </DialogTitle>
          </DialogHeader>

          {editTxn && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                  Service
                </label>
                <select
                  className={SELECT_CLS}
                  value={editForm.service}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      service: e.target.value,
                      subService: "",
                    }))
                  }
                >
                  <option value="">-- Choose a Service --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {editForm.service && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    Sub-procedure
                  </label>
                  <select
                    className={SELECT_CLS}
                    value={editForm.subService}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, subService: e.target.value }))
                    }
                  >
                    <option value="">-- Choose Sub-procedure --</option>
                    {subsFor(editForm.service).map((sub) => (
                      <option key={sub.id} value={sub.name}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editTxn.paymentType === "Installment" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    Total Treatment Fee (₱) *
                  </label>
                  <Input
                    type="number"
                    value={editForm.totalFee}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, totalFee: e.target.value }))
                    }
                    min={1}
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                  Amount Paid (₱) *
                </label>
                <Input
                  type="number"
                  value={editForm.amount}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  min={0}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                  Date *
                </label>
                <Input
                  type="date"
                  value={editForm.date}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, date: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                  Remarks
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={2}
                  className={TEXTAREA_CLS}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[hsl(var(--border))]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditTxn(null)}
                  disabled={editSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={editSaving}>
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════
          DIALOG 3 — Pay Installment
      ══════════════════════════════════════════ */}
      <Dialog
        open={!!payTxn}
        onOpenChange={(o) => {
          if (!o) setPayTxn(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard size={16} className="text-emerald-500" />
              Pay Installment
            </DialogTitle>
          </DialogHeader>
          {payTxn && (() => {
            const totalFee =
              payTxn.totalFee !== undefined && payTxn.totalFee !== null
                ? Number(payTxn.totalFee)
                : Number(payTxn.amount || 0);
            const paid = Number(payTxn.amount || 0);
            const remaining = Math.max(0, totalFee - paid);

            return (
              <>
                <div className="rounded-xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))] p-3.5 text-xs space-y-1.5">
                  <p className="font-semibold text-sm text-[hsl(var(--foreground))]">
                    {payTxn.serviceName || "Dental Treatment"}
                    {payTxn.subServiceName ? ` (${payTxn.subServiceName})` : ""}
                  </p>
                  <div className="flex items-center justify-between text-[hsl(var(--muted-foreground))] pt-1 border-t border-[hsl(var(--border))]">
                    <span>Total Treatment Fee:</span>
                    <span className="font-bold text-[hsl(var(--foreground))]">
                      ₱{totalFee.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[hsl(var(--muted-foreground))]">
                    <span>Total Paid so Far:</span>
                    <span className="font-bold text-emerald-500">
                      ₱{paid.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-semibold pt-1 border-t border-[hsl(var(--border))]">
                    <span className="text-amber-500">Remaining Balance:</span>
                    <span className="text-amber-500 font-bold text-sm">
                      ₱{remaining.toLocaleString()}
                    </span>
                  </div>
                </div>

                <form onSubmit={handlePaySubmit} className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                      Payment Amount (₱) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-sm font-semibold text-[hsl(var(--muted-foreground))]">
                        ₱
                      </span>
                      <Input
                        type="number"
                        placeholder={`Max: ${remaining}`}
                        value={payForm.amount}
                        onChange={(e) =>
                          setPayForm((f) => ({ ...f, amount: e.target.value }))
                        }
                        className="pl-8 text-sm font-semibold"
                        required
                        min={1}
                        max={remaining}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                      Payment Date *
                    </label>
                    <Input
                      type="date"
                      value={payForm.date}
                      onChange={(e) =>
                        setPayForm((f) => ({ ...f, date: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                      Remarks / Notes
                    </label>
                    <textarea
                      placeholder="e.g. 2nd installment payment…"
                      value={payForm.notes}
                      onChange={(e) =>
                        setPayForm((f) => ({ ...f, notes: e.target.value }))
                      }
                      rows={2}
                      className={TEXTAREA_CLS}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[hsl(var(--border))]">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPayTxn(null)}
                      disabled={paySaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      loading={paySaving}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      Confirm Payment
                    </Button>
                  </div>
                </form>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════
          DIALOG 4 — Delete Transaction Confirmation
      ══════════════════════════════════════════ */}
      <Dialog
        open={!!deleteTxn}
        onOpenChange={(open) => {
          if (!open && !deleteSaving) setDeleteTxn(null);
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
                  Delete Transaction Record
                </DialogTitle>
                <DialogDescription className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                  Are you sure you want to permanently remove this transaction from the patient ledger?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {deleteTxn && (() => {
            const isInstallment = deleteTxn.paymentType === "Installment";
            const totalFee =
              deleteTxn.totalFee !== undefined && deleteTxn.totalFee !== null
                ? Number(deleteTxn.totalFee)
                : Number(deleteTxn.amount || 0);
            const paidAmount = Number(deleteTxn.amount || 0);

            return (
              <div className="space-y-3 pt-2">
                {/* Transaction Details Card */}
                <div className="rounded-xl bg-[hsl(var(--muted))]/40 border border-[hsl(var(--border))] p-3.5 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-[hsl(var(--foreground))]">
                      {deleteTxn.serviceName || "Dental Treatment"}
                      {deleteTxn.subServiceName ? ` (${deleteTxn.subServiceName})` : ""}
                    </span>
                    <Badge
                      variant={isInstallment ? "warning" : "default"}
                      className="text-[10px]"
                    >
                      {isInstallment ? "Installment Plan" : "One-time Payment"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-[hsl(var(--muted-foreground))] pt-1 border-t border-[hsl(var(--border))]">
                    <span>Date:</span>
                    <span className="font-medium text-[hsl(var(--foreground))]">
                      {deleteTxn.date
                        ? new Date(deleteTxn.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[hsl(var(--muted-foreground))]">
                    <span>Amount Recorded:</span>
                    <span className="font-bold text-[hsl(var(--foreground))]">
                      {isInstallment
                        ? `₱${paidAmount.toLocaleString()} paid of ₱${totalFee.toLocaleString()}`
                        : `₱${paidAmount.toLocaleString()}`}
                    </span>
                  </div>

                  {deleteTxn.remarks && (
                    <div className="flex items-center justify-between text-[hsl(var(--muted-foreground))]">
                      <span>Remarks:</span>
                      <span className="italic truncate max-w-[200px]">
                        "{deleteTxn.remarks}"
                      </span>
                    </div>
                  )}
                </div>

                {/* Ledger Impact Notice */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 space-y-1">
                  <p className="font-medium flex items-center gap-1.5">
                    <AlertTriangle size={13} className="shrink-0" />
                    Ledger Impact Notice
                  </p>
                  <p className="text-[11px] opacity-90">
                    The patient's Total Transaction Amount and Outstanding Balance will be automatically recalculated upon deletion.
                  </p>
                </div>

                <DialogFooter className="gap-2 pt-2 border-t border-[hsl(var(--border))]">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteTxn(null)}
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
                    Delete Record
                  </Button>
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

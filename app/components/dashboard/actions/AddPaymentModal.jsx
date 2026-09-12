"use client";

import { useState } from "react";
import { toast } from "sonner";
import { usePatientStore } from "@/app/stores/usePatientStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui/Dialog";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";
import { Badge } from "../../ui/Badge";
import { CreditCard } from "lucide-react";

export default function AddPaymentModal({ patient, onClose }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const { addTransaction, fetchTransactions, fetchPatients } = usePatientStore();
  const currentBalance = Number(patient?.balance || 0);

  const handleAddPayment = async (e) => {
    e.preventDefault();
    const paymentAmount = Number(amount);
    if (!paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    try {
      setLoading(true);

      await addTransaction(patient.$id, {
        patientId: patient.$id,
        patientName: patient.patientName || patient.name,
        serviceName: patient.serviceName || "Installment",
        subServiceName: patient.subServiceName ?? "",
        amount: paymentAmount,
        paymentType: "Installment",
        date: new Date().toISOString(),
      });

      await fetchTransactions(patient.$id);
      await fetchPatients(true);

      onClose();
    } catch (err) {
      console.error("Error adding payment:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Record Installment Payment</DialogTitle>
              <DialogDescription>
                Patient: <span className="font-semibold text-[hsl(var(--foreground))]">{patient?.patientName || patient?.name}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleAddPayment} className="space-y-4 pt-2">
          {/* Balance Status Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]">
            <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Current Outstanding Balance
            </span>
            <span className="text-base font-bold text-amber-500">
              ₱{currentBalance.toLocaleString()}
            </span>
          </div>

          {/* Amount Input */}
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
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-8 text-base font-semibold"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Quick Preset Buttons */}
          {currentBalance > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                Quick Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[1000, 2000, 5000].filter((val) => val <= currentBalance).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(String(val))}
                    className="px-2.5 py-1 text-xs rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] transition-colors"
                  >
                    +₱{val.toLocaleString()}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAmount(String(currentBalance))}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors"
                >
                  Pay Full Balance (₱{currentBalance.toLocaleString()})
                </button>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[hsl(var(--border))]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Confirm Payment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState } from "react";
import { databases, DATABASE_ID } from "../../../lib/appwrite";
import { Query } from "appwrite";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui/Dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../../ui/Table";
import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { History, Calendar, CheckCircle2 } from "lucide-react";

export default function ViewHistoryModal({ patient, onClose }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPaid, setTotalPaid] = useState(0);

  const totalCost = Number(patient?.servicePrice || 0);
  const balance = Number(patient?.balance || 0);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await databases.listDocuments(DATABASE_ID, "installments", [
          Query.equal("patientId", patient.$id),
          Query.orderDesc("paymentDate"),
        ]);
        setPayments(res.documents);

        const total = res.documents.reduce(
          (sum, p) => sum + (Number(p.amountPaid) || 0),
          0
        );
        setTotalPaid(total);
      } catch (err) {
        console.error("Error fetching payments:", err);
      } finally {
        setLoading(false);
      }
    };

    if (patient?.$id) {
      fetchPayments();
    }
  }, [patient?.$id]);

  const percentagePaid = totalCost > 0 ? Math.min(100, Math.round((totalPaid / totalCost) * 100)) : 0;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <History className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Installment Payment History</DialogTitle>
              <DialogDescription>
                Ledger audit for <span className="font-semibold text-[hsl(var(--foreground))]">{patient?.patientName || patient?.name}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Top Financial Stat Overview */}
        <div className="grid grid-cols-3 gap-2.5 my-2">
          <div className="p-3 rounded-xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))] text-center">
            <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Total Plan Cost
            </p>
            <p className="text-sm sm:text-base font-bold text-[hsl(var(--foreground))] mt-0.5">
              ₱{totalCost.toLocaleString()}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))] text-center">
            <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Total Paid
            </p>
            <p className="text-sm sm:text-base font-bold text-emerald-500 mt-0.5">
              ₱{totalPaid.toLocaleString()}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))] text-center">
            <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Remaining
            </p>
            <p className={`text-sm sm:text-base font-bold mt-0.5 ${balance > 0 ? "text-amber-500" : "text-emerald-500"}`}>
              ₱{balance.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1 mb-2">
          <div className="flex items-center justify-between text-[11px] text-[hsl(var(--muted-foreground))]">
            <span>Payment Progress</span>
            <span className="font-semibold text-[hsl(var(--foreground))]">{percentagePaid}% Paid</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[hsl(var(--muted))] overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-300 rounded-full"
              style={{ width: `${percentagePaid}%` }}
            />
          </div>
        </div>

        {/* Payments Table */}
        <div className="flex-1 overflow-y-auto border border-[hsl(var(--border))] rounded-xl">
          {loading ? (
            <div className="p-8 text-center text-xs text-[hsl(var(--muted-foreground))]">
              Loading installment logs...
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center text-xs text-[hsl(var(--muted-foreground))]">
              No installment payments logged yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[45%]">Payment Date</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead className="text-right">Balance After</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.$id}>
                    <TableCell className="font-medium text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                        <span>
                          {new Date(p.paymentDate).toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-emerald-500">
                      +₱{(Number(p.amountPaid) || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-xs text-[hsl(var(--muted-foreground))]">
                      ₱{(Number(p.balanceAfter) || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-[hsl(var(--border))] mt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

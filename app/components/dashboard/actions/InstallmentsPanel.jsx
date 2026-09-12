"use client";

import { useState } from "react";
import AddPaymentModal from "./AddPaymentModal";
import ViewHistoryModal from "./ViewPaymentHistoryModal";
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { Badge } from "../../ui/Badge";
import { Wallet, History, PlusCircle } from "lucide-react";

export default function InstallmentsPanel({ patient, fetchPatients }) {
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const balance = Number(patient?.balance || 0);
  const isSettled = balance === 0;

  return (
    <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-[hsl(var(--foreground))]">
              Installment Account
            </CardTitle>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
              Active payment plan & remaining balance
            </p>
          </div>
        </div>

        <Badge variant={isSettled ? "success" : "warning"}>
          {isSettled ? "Settled in Full" : "Active Balance"}
        </Badge>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[hsl(var(--muted))]/40 border border-[hsl(var(--border))]">
          <div>
            <span className="text-[11px] text-[hsl(var(--muted-foreground))] block">
              Remaining Balance Due
            </span>
            <span
              className={`text-xl sm:text-2xl font-bold tracking-tight ${
                isSettled ? "text-emerald-500" : "text-amber-500"
              }`}
            >
              ₱{balance.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isSettled && (
              <Button
                size="sm"
                onClick={() => setShowModal(true)}
                className="gap-1.5 shadow-sm"
              >
                <PlusCircle size={14} />
                <span>Add Payment</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(true)}
              className="gap-1.5"
            >
              <History size={14} />
              <span>View History</span>
            </Button>
          </div>
        </div>
      </CardContent>

      {showModal && (
        <AddPaymentModal
          patient={patient}
          onClose={() => setShowModal(false)}
          fetchPatients={fetchPatients}
        />
      )}

      {showHistory && (
        <ViewHistoryModal
          patient={patient}
          onClose={() => setShowHistory(false)}
        />
      )}
    </Card>
  );
}

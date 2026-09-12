"use client";

import { useEffect, useMemo, useState } from "react";
import { useTransactionStore } from "../../stores/useTransactionStore";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../ui/Table";
import {
  TrendingUp,
  Filter,
  FileDown,
  Calendar,
  CreditCard,
  CheckCircle2,
} from "lucide-react";

// PDF
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "../../Roboto-font";

export default function SalesDashboard() {
  const { transactions, fetchTransactions, filterByDate, filteredTotal } =
    useTransactionStore();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ✅ Automatically set first and last day of current month
  useEffect(() => {
    const updateMonthRange = () => {
      const now = new Date();

      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];

      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];

      setStartDate(firstDay);
      setEndDate(lastDay);

      // Auto-filter data when month changes
      filterByDate(firstDay, lastDay);
    };

    updateMonthRange();

    const interval = setInterval(() => {
      updateMonthRange();
    }, 1000 * 60 * 60);

    return () => clearInterval(interval);
  }, [filterByDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // PDF Report
  const generateReport = () => {
    try {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(16);
      doc.setFont("Roboto-font");
      doc.text("Sales & Revenue Report", 14, 20);

      // Date range
      if (startDate && endDate) {
        doc.setFontSize(11);
        doc.text(`Period: ${startDate} to ${endDate}`, 14, 28);
      }

      // Build table rows
      const rows = transactions.map((t) => [
        new Date(t.date).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        t.patientName || "N/A",
        t.serviceName || "Treatment",
        t.paymentType || "Cash",
        `PHP ${Number(t.amount || 0).toLocaleString()}`,
      ]);

      autoTable(doc, {
        startY: 35,
        head: [["Date", "Patient", "Service", "Type", "Amount"]],
        body: rows,
        styles: { font: "helvetica" },
      });

      // Totals
      const totalAmount = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      doc.setFontSize(12);
      doc.text(
        `Total Generated: PHP ${totalAmount.toLocaleString()}`,
        14,
        doc.lastAutoTable.finalY + 10
      );

      // Save PDF
      doc.save(`sales_report_${startDate}_to_${endDate}.pdf`);
      toast.success("Sales report PDF exported! 📄", {
        description: `Exported ${transactions.length} transactions (${startDate} to ${endDate})`,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF report");
    }
  };

  const handleApplyFilter = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }
    filterByDate(startDate, endDate);
    toast.info("Filtered sales for selected period 📅", {
      description: `${startDate} to ${endDate}`,
    });
  };

  // Totals calculation
  const totals = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();

    let todayTotal = 0,
      monthTotal = 0,
      yearTotal = 0;

    transactions.forEach((t) => {
      const d = new Date(t.date);
      const amt = Number(t.amount) || 0;
      if (t.date?.startsWith(today)) todayTotal += amt;
      if (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      )
        monthTotal += amt;
      if (d.getFullYear() === now.getFullYear()) yearTotal += amt;
    });

    return { today: todayTotal, month: monthTotal, year: yearTotal };
  }, [transactions]);

  return (
    <div className="flex flex-1 flex-col h-full space-y-4">
      {/* 🔹 Fixed Header (totals + filter) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              Sales & Collection Breakdown
            </h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Real-time revenue metrics, collection audit, and exportable ledger
            </p>
          </div>

          <Button
            onClick={generateReport}
            className="gap-2 shrink-0 self-start sm:self-auto shadow-sm"
          >
            <FileDown size={15} />
            <span>Export Sales PDF</span>
          </Button>
        </div>

        {/* Totals Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-4 border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] block">
              Today's Collections
            </span>
            <p className="text-2xl font-bold text-amber-500 mt-1">
              ₱{totals.today.toLocaleString()}
            </p>
          </Card>

          <Card className="p-4 border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] block">
              This Month's Revenue
            </span>
            <p className="text-2xl font-bold text-emerald-500 mt-1">
              ₱{totals.month.toLocaleString()}
            </p>
          </Card>

          <Card className="p-4 border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] block">
              Year to Date
            </span>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))] mt-1">
              ₱{totals.year.toLocaleString()}
            </p>
          </Card>
        </div>

        {/* Date Range Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[hsl(var(--muted))]/40 border border-[hsl(var(--border))]">
          <span className="text-xs font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5 mr-1">
            <Calendar size={14} className="text-amber-500" />
            <span>Range:</span>
          </span>

          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-36 h-8 text-xs"
          />
          <span className="text-xs text-[hsl(var(--muted-foreground))]">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-36 h-8 text-xs"
          />

          <Button
            size="sm"
            variant="secondary"
            onClick={handleApplyFilter}
            className="h-8 gap-1.5 text-xs ml-auto"
          >
            <Filter size={13} />
            <span>Apply Filter</span>
          </Button>
        </div>

        {filteredTotal > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 size={14} />
            <span>Filtered Total for Period: ₱{filteredTotal.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* 🔹 Scrollable Table */}
      <div className="flex-1 overflow-x-auto border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--card))]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Service / Procedure</TableHead>
              <TableHead>Payment Mode</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-xs text-[hsl(var(--muted-foreground))]">
                  No sales transactions logged for this selected timeframe.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((t) => (
                <TableRow key={t.$id}>
                  <TableCell className="text-xs font-medium">
                    {new Date(t.date).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-[hsl(var(--foreground))]">
                    {t.patientName || "-"}
                  </TableCell>
                  <TableCell className="text-xs text-[hsl(var(--muted-foreground))]">
                    {t.serviceName || "Treatment"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.paymentType === "Installment" ? "warning" : "secondary"} className="text-[10px]">
                      {t.paymentType || "Cash"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs font-bold text-emerald-500">
                    ₱{Number(t.amount || 0).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

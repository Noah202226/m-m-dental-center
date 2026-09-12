"use client";

import { useExpensesStore } from "../../stores/useExpenseStore";
import { useEffect, useMemo, useState } from "react";
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
  Receipt,
  Filter,
  FileDown,
  Calendar,
  XCircle,
} from "lucide-react";

// PDF
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "../../Roboto-font";

export default function ExpensesTab() {
  const { filteredExpenses, filterByDate, clearFilter, fetchExpenses } =
    useExpensesStore();

  // 📅 Calculate first & last day of month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const formatDate = (d) => d.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(formatDate(firstDay));
  const [endDate, setEndDate] = useState(formatDate(lastDay));

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // PDF Report
  const generateReport = () => {
    try {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(16);
      doc.setFont("Roboto-font");
      doc.text("Clinic Expenses Report", 14, 20);

      // Date range
      if (startDate && endDate) {
        doc.setFontSize(11);
        doc.text(`Period: ${startDate} to ${endDate}`, 14, 28);
      }

      // Build table rows
      const rows = filteredExpenses.map((t) => [
        new Date(t.date).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        t.title || "Expense",
        t.category || "General",
        `PHP ${Number(t.amount || 0).toLocaleString()}`,
      ]);

      autoTable(doc, {
        startY: 35,
        head: [["Date", "Expense Description", "Category", "Amount"]],
        body: rows,
        styles: { font: "helvetica" },
      });

      // Totals
      const totalAmount = filteredExpenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      doc.setFontSize(12);
      doc.text(
        `Total Expenses: PHP ${totalAmount.toLocaleString()}`,
        14,
        doc.lastAutoTable.finalY + 10
      );

      // Save PDF
      doc.save(`expenses_report_${startDate}_to_${endDate}.pdf`);
      toast.success("Expense report PDF exported! 📄", {
        description: `Exported ${filteredExpenses.length} expense logs.`,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate expenses PDF report");
    }
  };

  const handleApplyFilter = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }
    filterByDate({ start: startDate, end: endDate });
    toast.info("Expenses filtered by date range 📅", {
      description: `${startDate} to ${endDate}`,
    });
  };

  const handleClearFilter = () => {
    clearFilter();
    setStartDate(formatDate(firstDay));
    setEndDate(formatDate(lastDay));
    toast.info("Cleared expense date filters");
  };

  // 🔹 Totals
  const { todayTotal, monthTotal, yearTotal } = useMemo(() => {
    const todayStr = today.toISOString().split("T")[0];
    const month = today.getMonth();
    const year = today.getFullYear();

    let tTotal = 0,
      mTotal = 0,
      yTotal = 0;

    filteredExpenses.forEach((e) => {
      const d = new Date(e.date);
      const amt = Number(e.amount) || 0;
      if (d.toISOString().split("T")[0] === todayStr) {
        tTotal += amt;
      }
      if (d.getMonth() === month && d.getFullYear() === year) {
        mTotal += amt;
      }
      if (d.getFullYear() === year) {
        yTotal += amt;
      }
    });

    return {
      todayTotal: tTotal,
      monthTotal: mTotal,
      yearTotal: yTotal,
    };
  }, [filteredExpenses]);

  return (
    <div className="flex flex-1 flex-col h-full space-y-4">
      {/* Header & Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
              <Receipt className="h-5 w-5 text-amber-500" />
              Practice Operating Expenses
            </h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Audit operational expenditures, inventory orders, and clinic overhead
            </p>
          </div>

          <Button
            onClick={generateReport}
            className="gap-2 shrink-0 self-start sm:self-auto shadow-sm"
          >
            <FileDown size={15} />
            <span>Export Expenses PDF</span>
          </Button>
        </div>

        {/* Expense Totals Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-4 border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] block">
              Today's Expenses
            </span>
            <p className="text-2xl font-bold text-amber-500 mt-1">
              ₱{todayTotal.toLocaleString()}
            </p>
          </Card>

          <Card className="p-4 border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] block">
              This Month's Overhead
            </span>
            <p className="text-2xl font-bold text-red-500 mt-1">
              ₱{monthTotal.toLocaleString()}
            </p>
          </Card>

          <Card className="p-4 border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] block">
              Year to Date Total
            </span>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))] mt-1">
              ₱{yearTotal.toLocaleString()}
            </p>
          </Card>
        </div>

        {/* Filter Controls */}
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

          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleApplyFilter}
              className="h-8 gap-1.5 text-xs"
            >
              <Filter size={13} />
              <span>Apply Filter</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearFilter}
              className="h-8 gap-1.5 text-xs text-[hsl(var(--muted-foreground))]"
            >
              <XCircle size={13} />
              <span>Reset</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 🔹 Scrollable Table */}
      <div className="flex-1 overflow-x-auto border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--card))]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Expense Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-xs text-[hsl(var(--muted-foreground))]">
                  No expenses found for this date range.
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenses.map((e) => (
                <TableRow key={e.$id}>
                  <TableCell className="text-xs font-medium">
                    {new Date(e.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-[hsl(var(--foreground))]">
                    {e.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {e.category || "Supplies"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs font-bold text-red-500">
                    -₱{Number(e.amount || 0).toLocaleString()}
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

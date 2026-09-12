"use client";

import { useState, useEffect } from "react";
import { useExpensesStore } from "../../../stores/useExpenseStore";
import { useCategoryStore } from "../../../stores/useCategoryStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/Dialog";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";
import { Receipt } from "lucide-react";
import { toast } from "sonner";

export default function ExpenseModal({ isOpen, onClose, expense }) {
  const { addExpense, updateExpense } = useExpensesStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (expense) {
      setForm({
        title: expense.title || "",
        amount: expense.amount || "",
        category: expense.category || "",
        date: expense.date || new Date().toISOString().split("T")[0],
      });
    } else {
      setForm({
        title: "",
        amount: "",
        category: categories.length > 0 ? categories[0].name : "Supplies",
        date: new Date().toISOString().split("T")[0],
      });
    }
  }, [expense, isOpen, categories]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amountVal = parseFloat(form.amount);
    if (!amountVal || isNaN(amountVal) || amountVal <= 0) {
      toast.error("Please enter a valid expense amount");
      return;
    }

    try {
      setLoading(true);
      if (expense) {
        await updateExpense(expense.$id, form);
        toast.success(`Expense "${form.title}" updated successfully!`);
      } else {
        await addExpense(form);
        toast.success(`Expense "${form.title}" recorded! 💸`, {
          description: `₱${amountVal.toLocaleString()} logged under ${form.category}`,
        });
      }
      onClose();
    } catch (err) {
      console.error("Error saving expense:", err);
      toast.error("Failed to save expense record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>
                {expense ? "Edit Clinic Expense" : "Record Clinic Expense"}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Expense Description *
            </label>
            <Input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Composite syringe refill, Electricity bill"
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Amount (₱) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-sm font-semibold text-[hsl(var(--muted-foreground))]">
                ₱
              </span>
              <Input
                type="number"
                step="any"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                placeholder="0.00"
                className="pl-8 text-sm font-semibold"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Expense Category *
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="flex h-9 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-1 text-sm text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              required
            >
              <option value="" disabled>
                -- Select Category --
              </option>
              {categories.map((c) => (
                <option key={c.$id} value={c.name}>
                  {c.name}
                </option>
              ))}
              {categories.length === 0 && (
                <>
                  <option value="Supplies">Supplies</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Rent">Rent</option>
                  <option value="Salaries">Salaries</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Other">Other</option>
                </>
              )}
            </select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Expenditure Date *
            </label>
            <Input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </div>

          {/* Actions */}
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
              {expense ? "Update Expense" : "Record Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

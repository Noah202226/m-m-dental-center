"use client";
import { useEffect } from "react";
import { useExpensesStore } from "../stores/useExpenseStore";

export default function ExpensesPage() {
  const { expenses, fetchExpenses, addExpense, deleteExpense } =
    useExpensesStore();

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Expenses</h1>

      <button
        className="btn btn-primary my-3"
        onClick={() =>
          addExpense({ title: "New Expense", amount: 100, category: "Food" })
        }
      >
        Add Expense
      </button>

      <ul className="space-y-2">
        {expenses.map((e) => (
          <li
            key={e.$id}
            className="flex justify-between items-center border p-2 rounded"
          >
            <span>
              {e.title} - ₱{e.amount} ({e.category})
            </span>
            <button
              className="btn btn-xs btn-error"
              onClick={() => deleteExpense(e.$id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useExpensesStore } from "../../../stores/useExpenseStore";

export default function ExpenseModal({ isOpen, onClose, expense }) {
  const { addExpense, updateExpense } = useExpensesStore();

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "",
    date: "",
  });

  useEffect(() => {
    if (expense) {
      setForm({
        title: expense.title || "",
        amount: expense.amount || "",
        category: expense.category || "",
        date: expense.date || "",
      });
    } else {
      setForm({ title: "", amount: "", category: "", date: "" });
    }
  }, [expense, isOpen]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (expense) {
      updateExpense(expense.$id, form);
    } else {
      addExpense(form);
    }

    onClose();
  };

  return (
    <>
      {isOpen && (
        <div className="modal modal-open z-[9999]">
          <div className="modal-box bg-black text-yellow-400 border-2 border-yellow-500">
            <h3 className="font-bold text-lg mb-4 text-yellow-400">
              {expense ? "Edit Expense" : "Add New Expense"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="label text-yellow-400">Title</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="input input-bordered w-full bg-black border-yellow-500 text-yellow-400"
                  required
                />
              </div>

              {/* Amount */}
              <div>
                <label className="label text-yellow-400">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  className="input input-bordered w-full bg-black border-yellow-500 text-yellow-400"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="label text-yellow-400">Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="select select-bordered w-full bg-black border-yellow-500 text-yellow-400"
                  required
                >
                  <option value="">-- Select Category --</option>
                  <option value="Food">Food</option>
                  <option value="Transport">Transport</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="label text-yellow-400">Date</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="input input-bordered w-full bg-black border-yellow-500 text-yellow-400"
                  required
                />
              </div>

              {/* Actions */}
              <div className="modal-action">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn bg-gray-800 text-yellow-400 border-yellow-500 hover:bg-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-yellow-500 text-black hover:bg-yellow-400"
                >
                  {expense ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

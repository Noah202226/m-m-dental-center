// stores/expensesStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { databases, DATABASE_ID } from "../lib/appwrite"; // adjust your import path
import { ID, Query } from "appwrite";
import toast from "react-hot-toast";

const COLLECTION_ID = "expenses";

const parseDateYMD = (ymd) => {
  if (!ymd) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d); // local midnight
};

const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
const endOfDay = (date) =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999
  );

export const useExpensesStore = create(
  persist(
    (set, get) => ({
      expenses: [],
      loading: false,

      filteredExpenses: [],
      filterRange: { start: null, end: null },

      setExpenses: (newExpenses) =>
        set(() => ({ expenses: newExpenses, filteredExpenses: newExpenses })),

      // range: { start: 'yyyy-mm-dd' | null, end: 'yyyy-mm-dd' | null }
      filterByDate: (range) =>
        set((state) => {
          const start = range?.start
            ? startOfDay(parseDateYMD(range.start))
            : null;
          const end = range?.end ? endOfDay(parseDateYMD(range.end)) : null;

          const filtered = state.expenses.filter((e) => {
            const d = new Date(e.date);
            if (start && d < start) return false;
            if (end && d > end) return false;
            return true;
          });

          return { filterRange: range, filteredExpenses: filtered };
        }),

      // clear filter → show all expenses
      clearFilter: () =>
        set((state) => ({
          filterRange: { start: null, end: null },
          filteredExpenses: state.expenses,
        })),

      // Fetch all expenses and set both arrays
      fetchExpenses: async () => {
        set({ loading: true });
        try {
          const res = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [Query.orderDesc("$createdAt"), Query.limit(1000)]
          );
          set({
            expenses: res.documents,
            filteredExpenses: res.documents,
            loading: false,
          });
        } catch (error) {
          console.error("Fetch expenses failed:", error);
          toast.error("Failed to fetch expenses ❌");
          set({ loading: false });
        }
      },

      // Add expense (both Appwrite and local state)
      addExpense: async ({ title, amount, category, date }) => {
        const expenseData = {
          title,
          amount: parseFloat(amount),
          category,
          date,
        };
        try {
          const newExpense = await databases.createDocument(
            DATABASE_ID,
            COLLECTION_ID,
            ID.unique(),
            expenseData
          );

          // update both arrays; if a filter is active, keep filtered list consistent
          set((state) => {
            const expenses = [newExpense, ...state.expenses];
            let filteredExpenses = expenses;

            const { filterRange } = state;
            if (filterRange?.start || filterRange?.end) {
              const start = filterRange.start
                ? startOfDay(parseDateYMD(filterRange.start))
                : null;
              const end = filterRange.end
                ? endOfDay(parseDateYMD(filterRange.end))
                : null;

              filteredExpenses = expenses.filter((e) => {
                const d = new Date(e.date);
                if (start && d < start) return false;
                if (end && d > end) return false;
                return true;
              });
            }

            return { expenses, filteredExpenses };
          });

          toast.success("Expense added 💸");
          return newExpense;
        } catch (error) {
          console.error("Add expense failed:", error);
          toast.error("Failed to add expense ❌");
        }
      },

      // Delete expense
      deleteExpense: async (id) => {
        try {
          await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, id);

          set((state) => {
            const expenses = state.expenses.filter((e) => e.$id !== id);
            // also update filteredExpenses
            const filteredExpenses = state.filteredExpenses.filter(
              (e) => e.$id !== id
            );
            return { expenses, filteredExpenses };
          });

          toast("Expense deleted 🗑️");
        } catch (error) {
          console.error("Delete expense failed:", error);
          toast.error("Failed to delete expense ❌");
        }
      },

      // Update expense
      updateExpense: async (id, updatedData) => {
        try {
          const updatedExpense = await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_ID,
            id,
            updatedData
          );

          set((state) => {
            const expenses = state.expenses.map((e) =>
              e.$id === id ? updatedExpense : e
            );

            // rebuild filteredExpenses based on current filterRange
            const { filterRange } = state;
            let filteredExpenses = expenses;
            if (filterRange?.start || filterRange?.end) {
              const start = filterRange.start
                ? startOfDay(parseDateYMD(filterRange.start))
                : null;
              const end = filterRange.end
                ? endOfDay(parseDateYMD(filterRange.end))
                : null;

              filteredExpenses = expenses.filter((e) => {
                const d = new Date(e.date);
                if (start && d < start) return false;
                if (end && d > end) return false;
                return true;
              });
            }

            return { expenses, filteredExpenses };
          });

          toast.success("Expense updated ✏️");
          return updatedExpense;
        } catch (error) {
          console.error("Update expense failed:", error);
          toast.error("Failed to update expense ❌");
        }
      },
    }),
    {
      name: "expenses-storage",
    }
  )
);

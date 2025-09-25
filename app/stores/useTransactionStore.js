// stores/useTransactionStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { databases, ID } from "../lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
const TRANSACTIONS_COLLECTION_ID = "transactions";

export const useTransactionStore = create(
  persist(
    (set, get) => ({
      transactions: [],
      loading: false,
      filteredTotal: 0,

      // Fetch all transactions
      fetchTransactions: async () => {
        set({ loading: true });
        try {
          const res = await databases.listDocuments(
            DATABASE_ID,
            TRANSACTIONS_COLLECTION_ID,

            [Query.limit(1000)]
          );
          set({ transactions: res.documents });
        } catch (error) {
          console.error("Error fetching transactions:", error);
        } finally {
          set({ loading: false });
        }
      },

      // Filter transactions by date range
      filterByDate: async (startDate, endDate) => {
        if (!startDate || !endDate) return;

        try {
          const res = await databases.listDocuments(
            DATABASE_ID,
            TRANSACTIONS_COLLECTION_ID,
            [
              Query.greaterThanEqual("date", new Date(startDate).toISOString()),
              Query.lessThanEqual("date", new Date(endDate).toISOString()),
            ]
          );

          const docs = res.documents;
          const total = docs.reduce((sum, t) => sum + t.amount, 0);

          set({ transactions: docs, filteredTotal: total });
        } catch (error) {
          console.error("Error filtering transactions:", error);
        }
      },
    }),
    {
      name: "transactions-store", // localStorage key
    }
  )
);

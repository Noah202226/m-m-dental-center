import { create } from "zustand";
import { persist } from "zustand/middleware";
import { databases, ID } from "../lib/appwrite";
import { Query } from "appwrite";
import { toast } from "sonner";

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
const PATIENTS_COLLECTION_ID = "patients";
const INSTALLMENTS_COLLECTION_ID = "installments";
const TRANSACTIONS_COLLECTION_ID = "transactions";

// ─── Shared helper ────────────────────────────────────────────────────────────
// Recomputes:
// 1. servicePrice (Total Transaction Amount) = Σ(t.totalFee || t.amount) for all transactions
// 2. balance (Outstanding Balance) = Σ Math.max(0, (t.totalFee || t.amount) - t.amount) for Installment transactions
// Returns the updated patient document.
async function _recalcBalance(patientId) {
  const [patient, txnRes] = await Promise.all([
    databases.getDocument(DATABASE_ID, PATIENTS_COLLECTION_ID, patientId),
    databases.listDocuments(DATABASE_ID, TRANSACTIONS_COLLECTION_ID, [
      Query.equal("patientId", patientId),
      Query.limit(1000),
    ]),
  ]);

  // Total Transaction Amount = sum of total fees across all patient transactions
  const totalTransactionAmount = txnRes.documents.reduce((sum, t) => {
    const fee =
      t.totalFee !== undefined && t.totalFee !== null
        ? Number(t.totalFee)
        : Number(t.amount || 0);
    return sum + fee;
  }, 0);

  // Outstanding Balance = remaining balance on installment transactions only
  const outstandingBalance = txnRes.documents.reduce((sum, t) => {
    if (t.paymentType === "Installment") {
      const fee =
        t.totalFee !== undefined && t.totalFee !== null
          ? Number(t.totalFee)
          : Number(t.amount || 0);
      const paid = Number(t.amount || 0);
      return sum + Math.max(0, fee - paid);
    }
    return sum;
  }, 0);

  const updated = await databases.updateDocument(
    DATABASE_ID,
    PATIENTS_COLLECTION_ID,
    patientId,
    {
      servicePrice: totalTransactionAmount,
      balance: outstandingBalance,
    }
  );
  return updated;
}

export const usePatientStore = create(
  persist(
    (set, get) => ({
      patients: [],
      loading: false,
      selectedPatient: null,
      setSelectedPatient: (patient) => set({ selectedPatient: patient }),

      // ── Fetch patients (with background refresh) ──────────────────────────
      fetchPatients: async (force = false) => {
        const state = get();
        if (!force && state.patients.length > 0) {
          get().refreshPatients();
          return;
        }
        await get().refreshPatients();
      },

      refreshPatients: async () => {
        set({ loading: true });
        try {
          const response = await databases.listDocuments(
            DATABASE_ID,
            PATIENTS_COLLECTION_ID,
            [Query.limit(1000)]
          );
          set({ patients: response.documents });
          if (response.documents.length > 0) {
            const current = get().selectedPatient;
            const stillExists = response.documents.find(
              (p) => p.$id === current?.$id
            );
            set({ selectedPatient: stillExists || response.documents[0] });
          }
        } catch (error) {
          console.error("Error fetching patients:", error);
          toast.error("Failed to load patient directory", {
            description: error?.message || "Please check your network connection.",
          });
        } finally {
          set({ loading: false });
        }
      },

      // ── Add patient ───────────────────────────────────────────────────────
      addPatient: async (patientData) => {
        try {
          const newPatient = await databases.createDocument(
            DATABASE_ID,
            PATIENTS_COLLECTION_ID,
            ID.unique(),
            patientData
          );
          set((state) => ({ patients: [...state.patients, newPatient] }));
          toast.success("Patient registered successfully! 🎉", {
            description: `${newPatient.patientName || newPatient.name} added to records.`,
          });
          return newPatient;
        } catch (error) {
          console.error("Error adding patient:", error);
          toast.error("Failed to register patient", {
            description: error?.message || "Error communicating with database.",
          });
          throw error;
        }
      },

      // ── Delete patient + all related records ──────────────────────────────
      deletePatient: async (patientId) => {
        try {
          const txns = await databases.listDocuments(
            DATABASE_ID,
            TRANSACTIONS_COLLECTION_ID,
            [Query.equal("patientId", patientId), Query.limit(1000)]
          );
          for (const txn of txns.documents) {
            await databases.deleteDocument(DATABASE_ID, TRANSACTIONS_COLLECTION_ID, txn.$id);
          }

          const installments = await databases.listDocuments(
            DATABASE_ID,
            INSTALLMENTS_COLLECTION_ID,
            [Query.equal("patientId", patientId), Query.limit(1000)]
          );
          for (const inst of installments.documents) {
            await databases.deleteDocument(DATABASE_ID, INSTALLMENTS_COLLECTION_ID, inst.$id);
          }

          await databases.deleteDocument(DATABASE_ID, PATIENTS_COLLECTION_ID, patientId);

          toast.success("Patient record deleted 🗑️", {
            description: "Patient profile and related ledger entries removed.",
          });
          set((state) => ({
            patients: state.patients.filter((p) => p.$id !== patientId),
            selectedPatient: null,
            transactions: [],
          }));
        } catch (error) {
          console.error("Error deleting patient:", error);
          toast.error("Failed to delete patient", {
            description: error?.message || "An error occurred while deleting.",
          });
        }
      },

      // ── Update patient fields ─────────────────────────────────────────────
      updatePatient: async (patientId, updates) => {
        try {
          const updated = await databases.updateDocument(
            DATABASE_ID,
            PATIENTS_COLLECTION_ID,
            patientId,
            updates
          );
          set((state) => ({
            patients: state.patients.map((p) => (p.$id === patientId ? updated : p)),
            selectedPatient:
              state.selectedPatient?.$id === patientId ? updated : state.selectedPatient,
          }));
          toast.success("Patient record updated! ✏️", {
            description: `${updated.patientName || updated.name} has been modified.`,
          });
          return updated;
        } catch (error) {
          console.error("Error updating patient:", error);
          toast.error("Failed to update patient", {
            description: error?.message || "Could not save updates.",
          });
        }
      },

      // ── Recalculate balance from transactions (source of truth) ───────────
      // balance = servicePrice − Σ(all transaction amounts for this patient)
      recalculateBalance: async (patientId) => {
        try {
          const updatedPatient = await _recalcBalance(patientId);
          set((state) => ({
            patients: state.patients.map((p) =>
              p.$id === patientId ? updatedPatient : p
            ),
            selectedPatient:
              state.selectedPatient?.$id === patientId
                ? updatedPatient
                : state.selectedPatient,
          }));
          return updatedPatient;
        } catch (error) {
          console.error("Error recalculating balance:", error);
        }
      },

      // ─────────────────────────────────────────────────────────────────────
      transactions: [],
      transactionsLoading: false,

      // ── Fetch transactions ────────────────────────────────────────────────
      fetchTransactions: async (patientId) => {
        set({ transactionsLoading: true });
        try {
          const response = await databases.listDocuments(
            DATABASE_ID,
            TRANSACTIONS_COLLECTION_ID,
            [Query.equal("patientId", patientId), Query.limit(1000)]
          );
          set({ transactions: response.documents });
        } catch (error) {
          console.error("Error fetching transactions:", error);
          toast.error("Failed to load transactions.");
        } finally {
          set({ transactionsLoading: false });
        }
      },

      // ── Add transaction ───────────────────────────────────────────────────
      addTransaction: async (patientId, data) => {
        try {
          const isInstallment = data.paymentType === "Installment";
          const totalFee = isInstallment
            ? Number(data.totalFee || data.amount)
            : Number(data.amount);
          const paidAmount = Number(data.amount || 0);

          // 1️⃣ Persist transaction
          const newTxn = await databases.createDocument(
            DATABASE_ID,
            TRANSACTIONS_COLLECTION_ID,
            ID.unique(),
            {
              patientId,
              patientName: data.patientName || "",
              serviceName: data.serviceName || "",
              subServiceName: data.subServiceName || "",
              amount: paidAmount,
              totalFee: totalFee,
              paymentType: data.paymentType || "One-time",
              date: data.date || new Date().toISOString(),
              remarks: data.remarks || "",
            }
          );

          // 2️⃣ If installment and downpayment > 0, record in installments collection
          if (isInstallment && paidAmount > 0) {
            await databases.createDocument(
              DATABASE_ID,
              INSTALLMENTS_COLLECTION_ID,
              ID.unique(),
              {
                patientId,
                amountPaid: paidAmount,
                paymentDate: data.date || new Date().toISOString(),
                balanceAfter: Math.max(0, totalFee - paidAmount),
                transactionId: newTxn.$id,
              }
            );
          }

          // 3️⃣ Recompute balance and total fee from all transactions
          const updatedPatient = await _recalcBalance(patientId);

          // 4️⃣ Sync local state
          set((state) => ({
            transactions: [...state.transactions, newTxn],
            patients: state.patients.map((p) =>
              p.$id === patientId ? updatedPatient : p
            ),
            selectedPatient:
              state.selectedPatient?.$id === patientId
                ? updatedPatient
                : state.selectedPatient,
          }));

          toast.success("Transaction added successfully! 💳", {
            description: isInstallment
              ? `Installment plan created. Downpayment: ₱${paidAmount.toLocaleString()}`
              : `₱${paidAmount.toLocaleString()} payment recorded.`,
          });
          return newTxn;
        } catch (error) {
          console.error("Error adding transaction:", error);
          toast.error("Failed to record transaction", {
            description: error?.message || "Transaction could not be processed.",
          });
          throw error;
        }
      },

      // ── Pay an installment ────────────────────────────────────────────────
      payInstallment: async (patientId, transactionId, paymentData) => {
        try {
          const txn = await databases.getDocument(
            DATABASE_ID,
            TRANSACTIONS_COLLECTION_ID,
            transactionId
          );
          const payAmt = Number(paymentData.amount);
          const currentPaid = Number(txn.amount || 0);
          const newPaid = currentPaid + payAmt;
          const totalFee =
            txn.totalFee !== undefined && txn.totalFee !== null
              ? Number(txn.totalFee)
              : currentPaid;
          const balanceAfter = Math.max(0, totalFee - newPaid);

          // 1️⃣ Update the installment transaction amount
          const updatedTxn = await databases.updateDocument(
            DATABASE_ID,
            TRANSACTIONS_COLLECTION_ID,
            transactionId,
            {
              amount: newPaid,
            }
          );

          // 2️⃣ Record installment ledger record
          await databases.createDocument(
            DATABASE_ID,
            INSTALLMENTS_COLLECTION_ID,
            ID.unique(),
            {
              patientId,
              amountPaid: payAmt,
              balanceAfter,
              paymentDate: paymentData.date || new Date().toISOString(),
              transactionId,
            }
          );

          // 3️⃣ Recalculate patient totals
          const updatedPatient = await _recalcBalance(patientId);

          // 4️⃣ Sync local state
          set((state) => ({
            transactions: state.transactions.map((t) =>
              t.$id === transactionId ? updatedTxn : t
            ),
            patients: state.patients.map((p) =>
              p.$id === patientId ? updatedPatient : p
            ),
            selectedPatient:
              state.selectedPatient?.$id === patientId
                ? updatedPatient
                : state.selectedPatient,
          }));

          toast.success("Installment payment recorded! 💳", {
            description: `₱${payAmt.toLocaleString()} credited. Remaining balance: ₱${balanceAfter.toLocaleString()}`,
          });
          return updatedTxn;
        } catch (error) {
          console.error("Error paying installment:", error);
          toast.error("Failed to record installment payment", {
            description: error?.message || "Payment could not be processed.",
          });
          throw error;
        }
      },

      // ── Delete transaction ────────────────────────────────────────────────
      deleteTransaction: async (transaction) => {
        try {
          // 1️⃣ Delete linked installment entry if any
          const installments = await databases.listDocuments(
            DATABASE_ID,
            INSTALLMENTS_COLLECTION_ID,
            [Query.equal("transactionId", transaction.$id)]
          );
          if (installments.total > 0) {
            await databases.deleteDocument(
              DATABASE_ID,
              INSTALLMENTS_COLLECTION_ID,
              installments.documents[0].$id
            );
          }

          // 2️⃣ Delete the transaction
          await databases.deleteDocument(
            DATABASE_ID,
            TRANSACTIONS_COLLECTION_ID,
            transaction.$id
          );

          // 3️⃣ Recompute balance from remaining transactions
          const updatedPatient = await _recalcBalance(transaction.patientId);

          // 4️⃣ Sync local state
          set((state) => ({
            transactions: state.transactions.filter((t) => t.$id !== transaction.$id),
            patients: state.patients.map((p) =>
              p.$id === transaction.patientId ? updatedPatient : p
            ),
            selectedPatient:
              state.selectedPatient?.$id === transaction.patientId
                ? updatedPatient
                : state.selectedPatient,
          }));

          toast.success("Transaction removed 🗑️", {
            description: `₱${Number(transaction.amount).toLocaleString()} removed and balance recalculated.`,
          });
        } catch (error) {
          console.error("Error deleting transaction:", error);
          toast.error("Failed to delete transaction", {
            description: error?.message || "Transaction could not be removed.",
          });
        }
      },

      // ── Update transaction ────────────────────────────────────────────────
      updateTransaction: async (txnId, updates) => {
        try {
          // 1️⃣ Update the transaction document
          const updated = await databases.updateDocument(
            DATABASE_ID,
            TRANSACTIONS_COLLECTION_ID,
            txnId,
            updates
          );

          // 2️⃣ Recompute balance from all transactions (handles any amount change)
          const updatedPatient = await _recalcBalance(updated.patientId);

          // 3️⃣ Sync local state
          set((state) => ({
            transactions: state.transactions.map((t) =>
              t.$id === txnId ? updated : t
            ),
            patients: state.patients.map((p) =>
              p.$id === updatedPatient.$id ? updatedPatient : p
            ),
            selectedPatient:
              state.selectedPatient?.$id === updatedPatient.$id
                ? updatedPatient
                : state.selectedPatient,
          }));

          toast.success("Transaction updated! ✏️");
          return updated;
        } catch (error) {
          console.error("Error updating transaction:", error);
          toast.error("Failed to update transaction.");
        }
      },
    }),
    {
      name: "patient-storage",
      partialize: (state) => ({
        patients: state.patients,
        selectedPatient: state.selectedPatient,
      }),
    }
  )
);

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { databases, ID } from "../lib/appwrite";
import { Query } from "appwrite";
import toast from "react-hot-toast";

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
const PATIENTS_COLLECTION_ID = "patients";
const INSTALLMENTS_COLLECTION_ID = "installments";
const TRANSACTIONS_COLLECTION_ID = "transactions";

export const usePatientStore = create(
  persist(
    (set, get) => ({
      patients: [],
      loading: false,
      selectedPatient: null,
      setSelectedPatient: (patient) => set({ selectedPatient: patient }),

      // Fetch patients with background refresh
      fetchPatients: async (force = false) => {
        const state = get();

        // ✅ If already have cached patients and not forced, show them first
        if (!force && state.patients.length > 0) {
          // still fetch in background
          get().refreshPatients();
          return;
        }

        // Otherwise, load fresh immediately
        await get().refreshPatients();
      },

      // Actual fetch from Appwrite
      refreshPatients: async () => {
        set({ loading: true });
        try {
          const response = await databases.listDocuments(
            DATABASE_ID,
            PATIENTS_COLLECTION_ID
          );
          set({ patients: response.documents });
          if (response.documents.length > 0) {
            // keep previous selected if exists
            const current = get().selectedPatient;
            const stillExists = response.documents.find(
              (p) => p.$id === current?.$id
            );
            set({ selectedPatient: stillExists || response.documents[0] });
          }
        } catch (error) {
          console.error("Error fetching patients:", error);
        } finally {
          set({ loading: false });
        }
      },

      // Add patient
      addPatient: async (patientData) => {
        try {
          const newPatient = await databases.createDocument(
            DATABASE_ID,
            PATIENTS_COLLECTION_ID,
            ID.unique(),
            patientData
          );
          set((state) => ({ patients: [...state.patients, newPatient] }));
          return newPatient;
        } catch (error) {
          console.error("Error adding patient:", error);
        }
      },

      // Delete patient + installments + transactions
      deletePatient: async (patientId) => {
        if (
          !confirm(
            "Are you sure you want to delete this patient and all related transactions?"
          )
        ) {
          return;
        }

        try {
          // 1️⃣ Delete transactions
          const txns = await databases.listDocuments(
            DATABASE_ID,
            TRANSACTIONS_COLLECTION_ID,
            [Query.equal("patientId", patientId)]
          );
          for (const txn of txns.documents) {
            await databases.deleteDocument(
              DATABASE_ID,
              TRANSACTIONS_COLLECTION_ID,
              txn.$id
            );
          }

          // 2️⃣ Delete installments
          const installments = await databases.listDocuments(
            DATABASE_ID,
            INSTALLMENTS_COLLECTION_ID,
            [Query.equal("patientId", patientId)]
          );
          for (const inst of installments.documents) {
            await databases.deleteDocument(
              DATABASE_ID,
              INSTALLMENTS_COLLECTION_ID,
              inst.$id
            );
          }

          // 3️⃣ Delete patient record
          await databases.deleteDocument(
            DATABASE_ID,
            PATIENTS_COLLECTION_ID,
            patientId
          );

          toast.success("Patient and related records deleted successfully.");
          set((state) => ({
            patients: state.patients.filter((p) => p.$id !== patientId),
            selectedPatient: null,
          }));
        } catch (error) {
          console.error("Error deleting patient:", error);
          alert("Failed to delete patient.");
        }
      },

      // Update patient
      updatePatient: async (patientId, updates) => {
        try {
          const updated = await databases.updateDocument(
            DATABASE_ID,
            PATIENTS_COLLECTION_ID,
            patientId,
            updates
          );
          set((state) => ({
            patients: state.patients.map((p) =>
              p.$id === patientId ? updated : p
            ),
            selectedPatient:
              state.selectedPatient?.$id === patientId
                ? updated
                : state.selectedPatient,
          }));
        } catch (error) {
          console.error("Error updating patient:", error);
        }
      },
    }),
    {
      name: "patient-storage", // localStorage key
      partialize: (state) => ({
        patients: state.patients,
        selectedPatient: state.selectedPatient,
      }),
    }
  )
);

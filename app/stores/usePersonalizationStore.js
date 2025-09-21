// stores/usePersonalizationStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { databases, ID, DATABASE_ID } from "../lib/appwrite";

const collectionId = "personalization"; // your Appwrite collection ID

export const usePersonalizationStore = create(
  persist(
    (set, get) => ({
      clientTitle: "",
      clientInitial: "",

      // Fetch personalization data
      fetchPersonalization: async () => {
        try {
          const res = await databases.listDocuments(DATABASE_ID, collectionId);
          if (res.documents.length > 0) {
            const doc = res.documents[0];
            set({
              clientTitle: doc.title || "",
              clientInitial: doc.initial || "",
            });
          }
        } catch (err) {
          console.error("❌ Fetch personalization error:", err);
        }
      },

      // Update or create client title
      setClientTitle: async (title) => {
        try {
          const docs = await databases.listDocuments(DATABASE_ID, collectionId);
          if (docs.documents.length > 0) {
            const docId = docs.documents[0].$id;
            await databases.updateDocument(DATABASE_ID, collectionId, docId, {
              title,
            });
          } else {
            await databases.createDocument(
              DATABASE_ID,
              collectionId,
              ID.unique(),
              { title }
            );
          }
          set({ clientTitle: title });
        } catch (err) {
          console.error("❌ Update client title error:", err);
        }
      },

      // Update or create client initial
      setClientInitial: async (initial) => {
        try {
          const docs = await databases.listDocuments(DATABASE_ID, collectionId);
          if (docs.documents.length > 0) {
            const docId = docs.documents[0].$id;
            await databases.updateDocument(DATABASE_ID, collectionId, docId, {
              initial,
            });
          } else {
            await databases.createDocument(
              DATABASE_ID,
              collectionId,
              ID.unique(),
              { initial }
            );
          }
          set({ clientInitial: initial });
        } catch (err) {
          console.error("❌ Update client initial error:", err);
        }
      },
    }),
    { name: "personalization-storage" }
  )
);

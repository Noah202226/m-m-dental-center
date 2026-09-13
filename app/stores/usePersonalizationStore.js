// stores/usePersonalizationStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { databases, ID, DATABASE_ID } from "../lib/appwrite";
import { Permission, Role } from "appwrite";

const collectionId = "personalization";

export const usePersonalizationStore = create(
  persist(
    (set, get) => ({
      clientTitle: "M&M Dental Center",
      clientInitial: "MM",
      businessName: "M&M Dental Center",
      accentColor: "gold",
      fontFamily: "Sans",
      phone: "0917-123-4567",
      email: "mmdentalcenter@gmail.com",
      address: "Quezon City, Metro Manila, Philippines",
      isLoading: false,

      // Fetch personalization data from Appwrite
      fetchPersonalization: async () => {
        try {
          set({ isLoading: true });
          const res = await databases.listDocuments(DATABASE_ID, collectionId);
          if (res.documents && res.documents.length > 0) {
            const doc = res.documents[0];
            const title = doc.businessName || doc.title || "M&M Dental Center";
            set({
              clientTitle: title,
              clientInitial: doc.initial || "MM",
              businessName: title,
              accentColor: doc.accentColor || "gold",
              fontFamily: doc.fontFamily || "Sans",
              phone: doc.phone || "",
              email: doc.email || "",
              address: doc.address || "",
              docId: doc.$id,
            });
          }
        } catch (err) {
          console.error("❌ Fetch personalization error:", err);
        } finally {
          set({ isLoading: false });
        }
      },

      // Save complete personalization profile
      savePersonalization: async (data) => {
        try {
          set({ isLoading: true });
          const payload = {
            title: data.businessName || data.title || get().clientTitle || "M&M Dental Center",
            businessName: data.businessName || data.title || get().clientTitle || "M&M Dental Center",
            initial: data.initial || get().clientInitial || "MM",
            accentColor: data.accentColor || get().accentColor || "gold",
            fontFamily: data.fontFamily || get().fontFamily || "Sans",
            phone: data.phone ?? get().phone ?? "",
            email: data.email ?? get().email ?? "",
            address: data.address ?? get().address ?? "",
          };

          const docs = await databases.listDocuments(DATABASE_ID, collectionId);
          let updatedDocId = null;

          if (docs.documents.length > 0) {
            updatedDocId = docs.documents[0].$id;
            await databases.updateDocument(DATABASE_ID, collectionId, updatedDocId, payload);
          } else {
            const newDoc = await databases.createDocument(
              DATABASE_ID,
              collectionId,
              ID.unique(),
              payload,
              [
                Permission.read(Role.any()),
                Permission.update(Role.any()),
                Permission.delete(Role.any()),
              ]
            );
            updatedDocId = newDoc.$id;
          }

          set({
            clientTitle: payload.title,
            clientInitial: payload.initial,
            businessName: payload.businessName,
            accentColor: payload.accentColor,
            fontFamily: payload.fontFamily,
            phone: payload.phone,
            email: payload.email,
            address: payload.address,
            docId: updatedDocId,
          });

          return true;
        } catch (err) {
          console.error("❌ Save personalization error:", err);
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      // Legacy helper: update client title
      setClientTitle: async (title) => {
        return get().savePersonalization({ businessName: title, title });
      },

      // Legacy helper: update client initial
      setClientInitial: async (initial) => {
        return get().savePersonalization({ initial });
      },
    }),
    { name: "personalization-storage" }
  )
);

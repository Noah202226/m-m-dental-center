import { create } from "zustand";
import { persist } from "zustand/middleware";
import { databases, ID, DATABASE_ID } from "../lib/appwrite";

const collectionId = "categories"; // your Appwrite collection ID

export const useCategoryStore = create(
  persist(
    (set, get) => ({
      categories: [],

      // Fetch categories from Appwrite
      fetchCategories: async () => {
        try {
          const res = await databases.listDocuments(DATABASE_ID, collectionId);
          set({ categories: res.documents });
        } catch (err) {
          console.error("❌ Fetch categories error:", err);
        }
      },

      // Add new category
      addCategory: async (name) => {
        try {
          const doc = await databases.createDocument(
            DATABASE_ID,
            collectionId,
            ID.unique(),
            { name }
          );
          set({ categories: [...get().categories, doc] });
        } catch (err) {
          console.error("❌ Add category error:", err);
        }
      },

      // Delete category
      deleteCategory: async (id) => {
        try {
          await databases.deleteDocument(DATABASE_ID, collectionId, id);
          set({ categories: get().categories.filter((c) => c.$id !== id) });
        } catch (err) {
          console.error("❌ Delete category error:", err);
        }
      },
    }),
    { name: "categories-storage" }
  )
);

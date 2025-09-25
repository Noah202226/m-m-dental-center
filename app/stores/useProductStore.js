import { create } from "zustand";
import { persist } from "zustand/middleware";
import { databases, ID, DATABASE_ID } from "../lib/appwrite";
import { Query } from "appwrite";

const collectionId = "products"; // replace with your Collection id

export const useProductStore = create(
  persist(
    (set, get) => ({
      products: [],

      // Fetch products from Appwrite
      fetchProducts: async () => {
        try {
          const res = await databases.listDocuments(DATABASE_ID, collectionId, [
            Query.limit(1000),
          ]);
          set({ products: res.documents });
        } catch (err) {
          console.error("❌ Fetch products error:", err);
        }
      },

      // Add new product
      addProduct: async (product) => {
        try {
          const doc = await databases.createDocument(
            DATABASE_ID,
            collectionId,
            ID.unique(),
            product
          );
          set({ products: [...get().products, doc] });
        } catch (err) {
          console.error("❌ Add product error:", err);
        }
      },

      // Update product
      updateProduct: async (id, updates) => {
        try {
          const updated = await databases.updateDocument(
            DATABASE_ID,
            collectionId,
            id,
            updates
          );
          set({
            products: get().products.map((p) =>
              p.$id === id ? { ...p, ...updated } : p
            ),
          });
        } catch (err) {
          console.error("❌ Update product error:", err);
        }
      },

      // Delete product
      deleteProduct: async (id) => {
        try {
          await databases.deleteDocument(DATABASE_ID, collectionId, id);
          set({ products: get().products.filter((p) => p.$id !== id) });
        } catch (err) {
          console.error("❌ Delete product error:", err);
        }
      },
    }),
    {
      name: "products-storage", // 🔹 persisted in localStorage
    }
  )
);

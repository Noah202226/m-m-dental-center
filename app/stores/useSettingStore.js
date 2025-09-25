import { create } from "zustand";
import { persist } from "zustand/middleware";
import { databases, DATABASE_ID, ID } from "../lib/appwrite";
import { Query } from "appwrite";

const SERVICES_COLLECTION_ID = "services";
const SUB_SERVICES_COLLECTION_ID = "subServices";

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      /* -------------------- 🔹 SERVICES TAB -------------------- */
      // 🔹 Services State
      services: [],
      loadingServices: false,
      errorServices: null,

      // 🔹 Fetch Services + SubServices
      fetchServices: async () => {
        set({ loadingServices: true, errorServices: null });
        try {
          const servicesRes = await databases.listDocuments(
            DATABASE_ID,
            SERVICES_COLLECTION_ID,
            [Query.limit(1000)]
          );
          const subRes = await databases.listDocuments(
            DATABASE_ID,
            SUB_SERVICES_COLLECTION_ID,
            [Query.limit(1000)]
          );

          const subByService = {};
          subRes.documents.forEach((sub) => {
            if (!subByService[sub.serviceId]) {
              subByService[sub.serviceId] = [];
            }
            subByService[sub.serviceId].push({
              id: sub.$id,
              name: sub.subServiceName,
            });
          });

          const combined = servicesRes.documents.map((s) => ({
            id: s.$id,
            name: s.serviceName,
            subServices: subByService[s.$id] || [],
          }));

          set({ services: combined });
        } catch (error) {
          console.error("Error fetching services:", error);
          set({ errorServices: "Failed to load services!" });
        } finally {
          set({ loadingServices: false });
        }
      },

      // 🔹 Add Service
      addService: async (serviceName) => {
        if (!serviceName.trim()) return;
        await databases.createDocument(
          DATABASE_ID,
          SERVICES_COLLECTION_ID,
          ID.unique(),
          { serviceName }
        );
        get().fetchServices();
      },

      // 🔹 Update Service
      updateService: async (id, newName) => {
        await databases.updateDocument(
          DATABASE_ID,
          SERVICES_COLLECTION_ID,
          id,
          { serviceName: newName }
        );
        get().fetchServices();
      },

      // 🔹 Delete Service
      deleteService: async (id) => {
        await databases.deleteDocument(DATABASE_ID, SERVICES_COLLECTION_ID, id);
        get().fetchServices();
      },

      // 🔹 Add SubService
      addSubService: async (serviceId, name) => {
        if (!name.trim()) return;
        await databases.createDocument(
          DATABASE_ID,
          SUB_SERVICES_COLLECTION_ID,
          ID.unique(),
          { serviceId, subServiceName: name }
        );
        get().fetchServices();
      },

      // 🔹 Update SubService
      updateSubService: async (subId, newName) => {
        await databases.updateDocument(
          DATABASE_ID,
          SUB_SERVICES_COLLECTION_ID,
          subId,
          { subServiceName: newName }
        );
        get().fetchServices();
      },

      // 🔹 Delete SubService
      deleteSubService: async (subId) => {
        await databases.deleteDocument(
          DATABASE_ID,
          SUB_SERVICES_COLLECTION_ID,
          subId
        );
        get().fetchServices();
      },

      /* -------------------- 🔹 PERSONALIZATION TAB -------------------- */
      theme: "dark",
      setTheme: (theme) => set({ theme }),

      /* -------------------- 🔹 USERS TAB -------------------- */
      users: [],
      addUser: (user) =>
        set((state) => ({
          users: [...state.users, { id: Date.now(), ...user }],
        })),
      deleteUser: (id) =>
        set((state) => ({
          users: state.users.filter((u) => u.id !== id),
        })),

      /* -------------------- 🔹 PRODUCT INVENTORY TAB -------------------- */
      products: [],
      addProduct: (product) =>
        set((state) => ({
          products: [...state.products, { id: Date.now(), ...product }],
        })),
      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),
    }),
    {
      name: "settings-storage", // localStorage key (persists across reloads)
    }
  )
);

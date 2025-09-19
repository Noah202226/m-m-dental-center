// stores/authStore.js
import { create } from "zustand";
import { account } from "../lib/appwrite";
import { ID } from "appwrite";
import toast from "react-hot-toast";

export const useAuthStore = create((set) => ({
  current: null,
  loading: true,

  register: async (email, password) => {
    try {
      await account.create(ID.unique(), email, password);
      toast.success("Account created 🎉");
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      set({ current: user });
      return user;
    } catch (error) {
      toast.error(error?.message || "Signup failed ❌");
      return null; // ✅ prevent app from crashing
    }
  },

  login: async (email, password) => {
    try {
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      set({ current: user });
      toast.success("Welcome back 👋");
      return user;
    } catch (error) {
      toast.error(error?.message || "Login failed ❌");
      return null; // ✅ prevent app from crashing
    }
  },

  logout: async () => {
    try {
      await account.deleteSession("current");
      set({ current: null });
      toast("Logged out 👋");
    } catch (error) {
      toast.error(error?.message || "Logout failed ❌");
    }
  },

  getCurrentUser: async () => {
    try {
      const user = await account.get();
      set({ current: user, loading: false });
    } catch {
      set({ current: null, loading: false });
    }
  },
}));

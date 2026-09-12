// stores/authStore.js
import { create } from "zustand";
import { account } from "../lib/appwrite";
import { ID } from "appwrite";
import { toast } from "sonner";

export const useAuthStore = create((set) => ({
  current: null,
  loading: true, // 🔹 start as true until check is done

  register: async (email, password) => {
    try {
      await account.create(ID.unique(), email, password);
      toast.success("Account created 🎉", {
        description: "Your staff access profile has been registered.",
      });
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      set({ current: user });
      return user;
    } catch (error) {
      toast.error("Signup failed", {
        description: error?.message || "Please check your credentials.",
      });
      return null; // ✅ prevent app from crashing
    }
  },

  login: async (email, password) => {
    try {
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      set({ current: user });
      toast.success("Welcome back 👋", {
        description: `Signed in as ${user.email || "Staff"}`,
      });
      return user;
    } catch (error) {
      toast.error("Login failed", {
        description: error?.message || "Invalid email or password.",
      });
      return null; // ✅ prevent app from crashing
    }
  },

  logout: async () => {
    try {
      await account.deleteSession("current");
      set({ current: null });
      toast.info("Logged out 👋", {
        description: "Your session has ended securely.",
      });
    } catch (error) {
      toast.error("Logout failed", {
        description: error?.message || "Could not terminate session.",
      });
    }
  },

  getCurrentUser: async () => {
    try {
      const user = await account.get(); // 🔑 get Appwrite user session
      set({ current: user, loading: false });
    } catch (error) {
      // ❗ Catch is IMPORTANT, Appwrite throws if no session
      set({ current: null, loading: false });
      console.log("Auth check error:", error);
    }
  },
}));

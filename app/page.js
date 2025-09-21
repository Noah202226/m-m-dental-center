"use client";

import { useEffect } from "react";
import Features from "./components/landing/Features";
import Hero from "./components/landing/Hero";
import { useAuthStore } from "./stores/authStore";
import Dashboard from "./components/Dashboard";
import { useExpensesStore } from "./stores/useExpenseStore";
import { useSettingsStore } from "./stores/useSettingStore";
import { useTransactionStore } from "./stores/useTransactionStore";
import { usePatientStore } from "./stores/usePatientStore";

import { motion } from "framer-motion";

export default function HomePage() {
  const { getCurrentUser, current, loading } = useAuthStore((state) => state);
  const { fetchExpenses } = useExpensesStore((state) => state);
  const { fetchServices } = useSettingsStore((state) => state);
  const { fetchTransactions } = useTransactionStore((state) => state);
  const { fetchPatients } = usePatientStore((state) => state);

  useEffect(() => {
    getCurrentUser().finally(() => {
      // ✅ even if it fails, loading will be false
    });
  }, []);

  // 🔹 Fetch data only when authenticated
  useEffect(() => {
    if (current) {
      fetchExpenses();
      fetchServices();
      fetchTransactions();
      fetchPatients();
    }
  }, [current]);

  if (loading) {
    return (
      <motion.div
        key="loading"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black text-yellow-400 space-y-6 z-50"
      >
        {/* Logo */}
        <img
          src="/m&m-dental-center-logo.png"
          alt="M&M Dental Center Logo"
          className="w-32 h-32 object-contain animate-pulse drop-shadow-[0_0_20px_rgba(255,215,0,0.5)]"
        />

        {/* Spinner with glow */}
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 border-4 border-yellow-400/30 rounded-full animate-spin border-t-yellow-400"></div>
          <div className="absolute h-10 w-10 border-2 border-yellow-400/50 rounded-full animate-ping"></div>
        </div>

        {/* Status text */}
        <span className="text-lg font-bold tracking-wide animate-pulse drop-shadow-[0_0_10px_rgba(255,215,0,0.7)]">
          Checking session...
        </span>
      </motion.div>
    );
  }

  return <div>{current ? <Dashboard /> : <Hero />}</div>;
}

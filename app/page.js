"use client";

import { useEffect } from "react";
import Features from "./components/landing/Features";
import Hero from "./components/landing/Hero";
import { useAuthStore } from "./stores/authStore";

export default function HomePage() {
  const { getCurrentUser } = useAuthStore((state) => state);

  useEffect(() => {
    getCurrentUser(); // 🔑 Check Appwrite session on first load
  }, [getCurrentUser]);

  return (
    <div >
      <Hero />
      <Features />
    </ div>
  );
}

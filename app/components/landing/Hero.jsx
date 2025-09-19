"use client";

import { AnimatePresence, motion } from "framer-motion";
import AuthForm from "../AuthForm";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../stores/authStore";
import { useEffect, useState } from "react";

export default function Hero() {
  const { login, register, getCurrentUser, current, loading } = useAuthStore(
    (state) => state
  );
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const user = await login(form.get("email"), form.get("password"));
    if (user) router.push("/"); // ✅ safe navigation
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const user = await register(form.get("email"), form.get("password"));
    if (user) router.push("/"); // ✅ safe navigation
  };

  return (
    <section className="min-h-screen flex flex-col md:flex-row bg-[var(--theme-bg)] text-[var(--theme-text)]">
      {/* Left Section - Landing Info */}

      <div className="flex-1 flex flex-col justify-center items-center text-center md:text-left px-6 md:px-12 lg:px-16 bg-[var(--theme-bg)]">
        <motion.img
          src="/1.svg"
          alt="Clinic Illustration"
          className="mt-8 max-w-xs md:max-w-3xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        />
        <motion.h1
          className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Manage Your <span className="text-[var(--theme-text)]">Clinic</span>{" "}
          Smarter
        </motion.h1>

        <motion.p
          className="mt-4 text-lg md:text-xl text-white max-w-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Simplify your clinic operations with our modern, secure, and
          user-friendly platform.
        </motion.p>
      </div>

      {/* Right Section - Auth Form */}
      <div className="flex-1 flex items-center justify-center bg-base-100 px-6 md:px-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={isSignUp ? "signup" : "login"}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full max-w-md bg-base-200 p-6 rounded-xl shadow-lg"
          >
            <AuthForm
              handleSubmit={isSignUp ? handleRegister : handleLogin}
              submitType={isSignUp ? "Sign Up" : "Log In"}
              onToggle={() => setIsSignUp(!isSignUp)}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

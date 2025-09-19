"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
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
    <section
      className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-base-100
    "
    >
      <motion.h1
        className="text-5xl md:text-6xl font-extrabold text-base-content transition-colors duration-500"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Manage Your{" "}
        <span className="text-primary transition-colors duration-500">
          Clinic
        </span>{" "}
        Smarter
      </motion.h1>

      <motion.p
        className="mt-4 text-lg md:text-xl text-base-content/70 max-w-2xl transition-colors duration-500"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        Simplify your clinic operations with our modern, secure, and
        user-friendly platform.
      </motion.p>
      <div>
        {/* {!loading && (
          <p>{current ? `Hello, ${current.email}` : "Not logged in"}</p>
        )} */}
        <div className="w-full flex items-center justify-center bg-base-200 px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? "signup" : "login"}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full max-w-md"
            >
              <AuthForm
                handleSubmit={isSignUp ? handleRegister : handleLogin}
                submitType={isSignUp ? "Sign Up" : "Log In"}
                onToggle={() => setIsSignUp(!isSignUp)}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

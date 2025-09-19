"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero() {
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

      <motion.div
        className="mt-6 flex gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <Link
          href="#pricing"
          className="btn btn-primary transition-colors duration-500"
        >
          Get Started
        </Link>
        <Link
          href="#features"
          className="btn btn-outline btn-primary transition-colors duration-500"
        >
          Learn More
        </Link>
      </motion.div>
    </section>
  );
}

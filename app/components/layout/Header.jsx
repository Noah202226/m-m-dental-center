"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useThemeStore } from "@/app/stores/ThemeStore";
import { use, useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { useAuthStore } from "@/app/stores/authStore";
import { usePathname } from "next/navigation";

export default function Header() {
  const { current, logout } = useAuthStore((state) => state);
  const { theme, toggleTheme } = useThemeStore();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false); // for login/logout buttons

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const pathname = usePathname();
  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300  ${
        scrolled
          ? "bg-base-100/80 backdrop-blur shadow-md py-2"
          : "bg-base-100 py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <motion.h1
            className="text-2xl font-bold text-base-content transition-colors duration-500"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            M&M Dental Center
          </motion.h1>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-6 text-base-content transition-colors duration-500">
          <Link href="#features" className="hover:text-primary ">
            Features
          </Link>
          <Link href="#pricing" className="hover:text-primary ">
            Pricing
          </Link>
          <Link href="#faq" className="hover:text-primary ">
            FAQ
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button onClick={toggleTheme} className="p-2 rounded-full ">
            {theme === "light" ? (
              <MoonIcon color="black" size={20} />
            ) : (
              <SunIcon size={20} />
            )}
          </button>

          {/* Desktop CTA */}
          {current ? (
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm font-medium text-base-content">
                {current.name || current.email}
              </span>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="btn btn-primary transition-colors duration-500 btn-sm rounded-md flex items-center justify-center"
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "Logout"
                )}
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className={`btn btn-primary hidden md:inline-flex rounded-md ${
                loading ? "pointer-events-none opacity-70" : ""
              }`}
              onClick={() => setLoading(true)}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                "Login"
              )}
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden btn"
            aria-label="Toggle menu"
          >
            {menuOpen ? "✖" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden  px-6 py-4 space-y-4"
        >
          <Link
            href="#features"
            className="block hover:text-primary text-base-content transition-colors duration-500"
            onClick={() => setMenuOpen(false)}
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="block hover:text-primary text-base-content transition-colors duration-500"
            onClick={() => setMenuOpen(false)}
          >
            Pricing
          </Link>
          <Link
            href="#faq"
            className="block hover:text-primary text-base-content transition-colors duration-500"
            onClick={() => setMenuOpen(false)}
          >
            FAQ
          </Link>

          {/* Auth state on mobile */}
          {current ? (
            <div className="border-t border-base-300 pt-4 flex flex-col gap-3">
              <span className="block mb-2 text-sm font-medium text-base-content text-right">
                {current.name || current.email}
              </span>
              <button
                onClick={async () => {
                  setLoading(true);
                  await handleLogout();
                  setMenuOpen(false);
                }}
                disabled={loading}
                className="btn btn-primary rounded-md flex items-center justify-center"
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "Logout"
                )}
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className={`btn btn-primary w-full ${
                loading ? "pointer-events-none opacity-70" : ""
              }`}
              onClick={() => setLoading(true)}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                "Login"
              )}
            </Link>
          )}
        </motion.div>
      )}
    </motion.header>
  );
}

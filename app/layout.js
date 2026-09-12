"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { useInitTheme } from "./components/layout/ThemeProvider";
import { Toaster as SonnerToaster } from "sonner";
import { Toaster as HotToaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({ children }) {
  useInitTheme();

  return (
    <html lang="en" suppressHydrationWarning className={inter.className}>
      <body className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] antialiased transition-colors duration-200 selection:bg-amber-400 selection:text-black">
        <main className="min-h-screen relative">{children}</main>
        
        {/* Subtle Watermark Logo */}
        <div
          className="fixed inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none -z-10"
          style={{
            backgroundImage: "url('/m&m-dental-center-logo.png')",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundSize: "420px",
          }}
        />

        {/* Sonner Modern Rich Notifications */}
        <SonnerToaster
          position="top-right"
          richColors
          closeButton
          expand={true}
          theme="system"
          toastOptions={{
            style: {
              borderRadius: "12px",
              padding: "14px 18px",
              fontSize: "13px",
              boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.25)",
            },
          }}
        />

        {/* React Hot Toast compatibility */}
        <HotToaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: "hsl(var(--card))",
              color: "hsl(var(--card-foreground))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              padding: "12px 18px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}

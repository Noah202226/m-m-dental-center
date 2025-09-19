"use client";

import "./globals.css";
import { useInitTheme } from "./components/layout/ThemeProvider";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }) {
  useInitTheme();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-yellow-300 text-base-content transition-colors duration-300">
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: "8px",
              padding: "12px 16px",
            },
          }}
        />
      </body>
    </html>
  );
}

"use client";

import { useState } from "react";
import { Mail, Lock, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";

export default function AuthForm({ handleSubmit, submitType, onToggle }) {
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await handleSubmit(e);
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border-[hsl(var(--border))] bg-[hsl(var(--card))]/90 backdrop-blur-xl">
      <CardHeader className="space-y-2 text-center pb-2">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center border border-amber-500/30 mb-1">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
          {submitType === "Sign Up" ? "Create Staff Account" : "Staff Authentication"}
        </CardTitle>
        <CardDescription className="text-xs">
          {submitType === "Sign Up"
            ? "Enter clinical credentials to initialize workspace access"
            : "Enter your registered email and password to continue"}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <Input
                type="email"
                name="email"
                placeholder="staff@mmdental.com"
                required
                className="pl-9 h-10 text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <Input
                type="password"
                name="password"
                placeholder="••••••••••••"
                required
                className="pl-9 h-10 text-sm"
              />
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            loading={loading}
            className="w-full h-10 mt-2 font-semibold"
          >
            {submitType}
          </Button>

          {/* Toggle between Login and Sign Up */}
          {onToggle && (
            <div className="text-center pt-2 text-xs text-[hsl(var(--muted-foreground))]">
              {submitType === "Sign Up" ? (
                <>
                  Already have an authorized account?{" "}
                  <button
                    type="button"
                    onClick={onToggle}
                    className="font-semibold text-amber-500 hover:underline ml-1"
                    disabled={loading}
                  >
                    Log In
                  </button>
                </>
              ) : (
                <>
                  Need to configure a new account?{" "}
                  <button
                    type="button"
                    onClick={onToggle}
                    className="font-semibold text-amber-500 hover:underline ml-1"
                    disabled={loading}
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

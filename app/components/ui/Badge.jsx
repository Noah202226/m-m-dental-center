import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "border-amber-500/30 bg-amber-500/15 text-amber-400 font-medium",
        secondary:
          "border-transparent bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]",
        destructive:
          "border-red-500/30 bg-red-500/15 text-red-400 font-medium",
        success:
          "border-emerald-500/30 bg-emerald-500/15 text-emerald-400 font-medium",
        outline: "text-[hsl(var(--foreground))] border-[hsl(var(--border))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

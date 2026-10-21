"use client";

import { Button } from "@/components/ui/button";

/** A submit button that asks before running a destructive server action. */
export function ConfirmSubmit({
  children,
  confirmMessage,
  variant = "destructive",
  size = "sm",
  className,
}: {
  children: React.ReactNode;
  confirmMessage: string;
  variant?: "destructive" | "outline" | "ghost";
  size?: "sm" | "xs";
  className?: string;
}) {
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={className}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}

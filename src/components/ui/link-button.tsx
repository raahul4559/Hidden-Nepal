import Link from "next/link";
import type { VariantProps } from "class-variance-authority";
import { cn } from "cn";

import { buttonVariants } from "./button";

type LinkButtonProps = React.ComponentProps<typeof Link> &
  VariantProps<typeof buttonVariants>;

/** A Next.js link styled as a button, for navigation actions. */
export function LinkButton({
  className,
  variant,
  size,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

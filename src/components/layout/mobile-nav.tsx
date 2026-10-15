"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

type NavItem = { label: string; href: string };

export function MobileNav({ items, cta }: { items: readonly NavItem[]; cta?: NavItem }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-11 items-center justify-center rounded-md text-ivory transition-colors hover:bg-ivory/10"
      >
        {open ? <X aria-hidden className="size-6" /> : <Menu aria-hidden className="size-6" />}
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      </button>

      <nav
        id={panelId}
        aria-label="Main"
        hidden={!open}
        className="surface-dark absolute inset-x-0 top-20 border-t border-border shadow-xl"
      >
        <ul className="container-page flex flex-col py-3">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-sm py-3 text-base font-medium text-ivory/90 hover:text-ivory"
              >
                {item.label}
              </Link>
            </li>
          ))}
          {cta ? (
            <li className="mt-3 border-t border-border pt-5 pb-2">
              <Link
                href={cta.href}
                onClick={() => setOpen(false)}
                className="inline-flex h-11 w-full items-center justify-center rounded-md bg-teal px-5 text-base font-semibold text-navy"
              >
                {cta.label}
              </Link>
            </li>
          ) : null}
        </ul>
      </nav>
    </div>
  );
}

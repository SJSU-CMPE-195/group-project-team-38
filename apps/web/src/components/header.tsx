"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { ModeToggle } from "./mode-toggle";

export default function Header() {
  const pathname = usePathname();
  const links = [{ to: "/dashboard", label: "Admin review" }] as const;

  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-semibold uppercase tracking-[0.24em]">
            MediTag
          </Link>
          <nav className="flex gap-4 text-sm">
            {links.map(({ to, label }) => {
              const isActive = pathname === to;

              return (
                <Link
                  key={to}
                  href={to}
                  className={cn(
                    "text-muted-foreground hover:text-foreground transition-colors",
                    isActive && "text-foreground",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <ModeToggle />
      </div>
    </header>
  );
}

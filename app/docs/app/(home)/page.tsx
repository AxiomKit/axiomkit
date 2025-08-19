"use client";
import Link from "next/link";

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function for combining classnames
function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground font-mono">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href={`/docs/framework`} className="text-2xl font-bold mb-4">
          Quick Start
        </Link>
      </div>
    </main>
  );
}

import type { ReactNode } from "react";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions } from "@/app/layout.config";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <HomeLayout {...baseOptions}>
      {children}
      <Footer />
    </HomeLayout>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t bg-fd-card py-12 text-fd-secondary-foreground">
      <div className="container flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-sm font-semibold">Fumadocs</p>
          <p className="text-xs">Built with ❤️ by Axiomkit</p>
        </div>
      </div>
    </footer>
  );
}

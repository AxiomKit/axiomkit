import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { baseOptions } from "@/app/layout.config";
import { source } from "@/lib/source";
import { baseUrl, createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: {
    template: "%s | Axiomkit",
    default: "Axiomkit",
  },
  description:
    "The Axiomkit documentation provides comprehensive guides, tutorials, and references for building AI applications with Axiom.",
  metadataBase: baseUrl,
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout tree={source.pageTree} {...baseOptions}>
      {children}
    </DocsLayout>
  );
}

import { DocsLayout } from "fumadocs-ui/layouts/notebook";
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

export default function Layout({ children }: { children: any }) {
  return (
    <DocsLayout tabMode="navbar" tree={source.pageTree} {...baseOptions}>
      {children}
    </DocsLayout>
  );
}

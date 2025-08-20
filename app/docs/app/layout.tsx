import "./global.css";
import { RootProvider } from "fumadocs-ui/provider";
import { Metadata } from "next";
import {
  Fira_Code,
  Geist,
  Geist_Mono,
  Inter,
  Open_Sans,
  Space_Grotesk,
} from "next/font/google";

import Favicon from "./favicon.ico";
import Banner from "@/public/banner.png";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://axiomkit.altlab.space"),
  title: "AxiomKit - Intelligent Agent Framework",
  description:
    "Build agents that think, learn, and evolve with AxiomKit's modular TypeScript framework",
  applicationName: "Axiomkit",
  icons: {
    icon: Favicon.src,
    shortcut: Favicon.src,
    apple: Favicon.src,
    other: { rel: "apple-touch-icon-precomposed", url: Favicon.src },
  },
  keywords: ["Axiomkit"],
  openGraph: {
    title: "AxiomKit - Intelligent Agent Framework",
    description:
      "Build agents that think, learn, and evolve with AxiomKit's modular TypeScript framework",
    images: [
      {
        url: Banner.src,
        width: 1344,
        height: 896,
        type: "image/png",
      },
    ],
    locale: "en_US",
    url: "https://axiomkit.altlab.space",
    type: "website",
    emails: "neonworking00@gmail.com",
    siteName: "AxiomKit - Intelligent Agent Framework",
  },
  twitter: {
    title: "AxiomKit - Intelligent Agent Framework",
    description:
      "Build agents that think, learn, and evolve with AxiomKit's modular TypeScript framework",
    images: Banner.src,
    site: "https://axiomkit.altlab.space",
    creator: "@axiomkit",
  },
  category: "technology",
};
// const inter = Inter({
//   subsets: ["latin"],
// });

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export default function Layout({ children }: { children: any }) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen font-sans">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}

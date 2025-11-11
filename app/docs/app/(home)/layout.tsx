import { HomeLayout } from "fumadocs-ui/layouts/home";

import { baseOptions, linkItems } from "@/app/layout.config";
import {
  NavbarMenu,
  NavbarMenuContent,
  NavbarMenuLink,
  NavbarMenuTrigger,
} from "fumadocs-ui/layouts/home/navbar";
import {
  BlocksIcon,
  Book,
  BookOpen,
  ComponentIcon,
  Pencil,
  PlusIcon,
  Server,
} from "lucide-react";
import Link from "next/link";
import Banner from "@/public/banner.png";
import Image from "next/image";
export default function Layout({ children }: { children: any }) {
  return (
    <HomeLayout
      {...baseOptions}
      links={[
        {
          icon: <Book />,
          text: "Getting Started",
          url: "/docs/framework",
          // items: [
          //   {
          //     text: "Getting Started",
          //     url: "/docs/framework",
          //     icon: <Book />,
          //   },
          //   {
          //     text: "Providers",
          //     url: "/docs/providers",
          //     icon: <ComponentIcon />,
          //   },
          // ],
        },
        {
          text: "Providers",
          url: "/docs/providers",
          icon: <ComponentIcon />,
        },
        {
          text: "Showcase",
          url: "/docs/examples",
          icon: <BookOpen />,
        },
        {
          text: "Sei Integration",
          url: "/docs/sei",
          icon: <BlocksIcon />,
        },
        {
          text: "x402 + Erc8004",
          url: "/docs/v2",
          icon: <BlocksIcon />,
        },
        ...linkItems,
      ]}
    >
      {children}
    </HomeLayout>
  );
}

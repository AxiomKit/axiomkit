import { HomeLayout } from "fumadocs-ui/layouts/home";

import { baseOptions, linkItems } from "@/app/layout.config";
import {
  NavbarMenu,
  NavbarMenuContent,
  NavbarMenuLink,
  NavbarMenuTrigger,
} from "fumadocs-ui/layouts/home/navbar";
import { Book, ComponentIcon, Pencil, PlusIcon, Server } from "lucide-react";
import Link from "next/link";
import Banner from "@/public/banner.png";
import Image from "next/image";
export default function Layout({ children }: { children: any }) {
  return (
    <HomeLayout
      {...baseOptions}
      links={[
        {
          type: "menu",
          on: "menu",
          text: "Documentation",
          items: [
            {
              text: "Getting Started",
              url: "/docs/framework",
              icon: <Book />,
            },
            {
              text: "Extensions",
              url: "/docs/extensions",
              icon: <ComponentIcon />,
            },
          ],
        },
        {
          type: "custom",
          on: "nav",
          children: (
            <NavbarMenu>
              <NavbarMenuTrigger>
                <Link href="/docs/framework">Documentation</Link>
              </NavbarMenuTrigger>
              <NavbarMenuContent className="text-[15px]">
                <NavbarMenuLink
                  href="/docs/framework"
                  className="md:row-span-2"
                >
                  <div className="-mx-3 -mt-3">
                    <Image
                      src={Banner}
                      alt="Perview"
                      className="rounded-t-lg object-cover"
                      style={{
                        maskImage:
                          "linear-gradient(to bottom,white 60%,transparent)",
                      }}
                    />
                  </div>
                  <p className="font-medium">Getting Started</p>
                  <p className="text-fd-muted-foreground text-sm">
                    Learn to use Axiomkit Framework.
                  </p>
                </NavbarMenuLink>
                <NavbarMenuLink
                  href="/docs/framework"
                  className="lg:col-start-3 lg:row-start-2"
                >
                  <PlusIcon className="bg-fd-primary text-fd-primary-foreground p-1 mb-2 rounded-md" />
                  <p className="font-medium">Core Framework</p>
                  <p className="text-fd-muted-foreground text-sm">
                    Setup Axiomkit for your project.
                  </p>
                </NavbarMenuLink>
                <NavbarMenuLink
                  href="/docs/extensions"
                  className="lg:col-start-2"
                >
                  <ComponentIcon className="bg-fd-primary text-fd-primary-foreground p-1 mb-2 rounded-md" />
                  <p className="font-medium">Extensions</p>
                  <p className="text-fd-muted-foreground text-sm">
                    Add Custom Extension Axiomkit.
                  </p>
                </NavbarMenuLink>

                <NavbarMenuLink href="/docs/sei" className="lg:col-start-2">
                  <Server className="bg-fd-primary text-fd-primary-foreground p-1 mb-2 rounded-md" />
                  <p className="font-medium">Sei Support</p>
                  <p className="text-fd-muted-foreground text-sm">
                    Generate interactive playgrounds and docs for your Sei
                    Network.
                  </p>
                </NavbarMenuLink>

                <NavbarMenuLink
                  href="/docs/examples"
                  className="lg:col-start-3 lg:row-start-1"
                >
                  <Pencil className="bg-fd-primary text-fd-primary-foreground p-1 mb-2 rounded-md" />
                  <p className="font-medium">Examples</p>
                  <p className="text-fd-muted-foreground text-sm">
                    Learn more by real show case
                  </p>
                </NavbarMenuLink>
              </NavbarMenuContent>
            </NavbarMenu>
          ),
        },
        ...linkItems,
      ]}
    >
      {children}
    </HomeLayout>
  );
}

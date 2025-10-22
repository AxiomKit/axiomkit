import { Badge } from "@/components/badge";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

import { type LinkItemType } from "fumadocs-ui/layouts/docs";
import { Github } from "lucide-react";
import Image from "next/image";
import { SOCIAL_LINK } from "@/lib/constants";
import TwitterIcon from "@/components/icons/TwitterIcon";
import LogoIcon from "@/components/icons/LogoIcon";

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <>
        <LogoIcon className="h-12 w-12 text-primary" />
        <span className="text-primary text-lg font-bold">AxiomKit</span>
        <Badge
          className={`
                bg-green-500/20 text-green-400 border-green-500/30 text-xs       
              `}
        >
          v.2.0.11
        </Badge>
      </>
    ),
  },

  links: [
    {
      type: "icon",
      icon: <TwitterIcon />,
      label: "Twitter",
      text: "Twitter",
      url: SOCIAL_LINK.twitter,
      external: true,
    },
    {
      type: "icon",
      icon: <Github />,
      label: "Github",
      text: "Github",
      url: SOCIAL_LINK.github,
      external: true,
    },
  ],
};
export const linkItems: LinkItemType[] = [
  {
    type: "icon",
    url: SOCIAL_LINK.twitter,
    text: "Twitter",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="200"
        height="200"
        viewBox="0 0 24 24"
      >
        <g fill="currentColor">
          <path d="M1 2h2.5L3.5 2h-2.5z">
            <animate
              fill="freeze"
              attributeName="d"
              dur="0.4s"
              values="M1 2h2.5L3.5 2h-2.5z;M1 2h2.5L18.5 22h-2.5z"
            />
          </path>
          <path d="M5.5 2h2.5L7.2 2h-2.5z">
            <animate
              fill="freeze"
              attributeName="d"
              dur="0.4s"
              values="M5.5 2h2.5L7.2 2h-2.5z;M5.5 2h2.5L23 22h-2.5z"
            />
          </path>
          <path d="M3 2h5v0h-5z" opacity="0">
            <set attributeName="opacity" begin="0.4s" to="1" />
            <animate
              fill="freeze"
              attributeName="d"
              begin="0.4s"
              dur="0.4s"
              values="M3 2h5v0h-5z;M3 2h5v2h-5z"
            />
          </path>
          <path d="M16 22h5v0h-5z" opacity="0">
            <set attributeName="opacity" begin="0.4s" to="1" />
            <animate
              fill="freeze"
              attributeName="d"
              begin="0.4s"
              dur="0.4s"
              values="M16 22h5v0h-5z;M16 22h5v-2h-5z"
            />
          </path>
          <path d="M18.5 2h3.5L22 2h-3.5z" opacity="0">
            <set attributeName="opacity" begin="0.5s" to="1" />
            <animate
              fill="freeze"
              attributeName="d"
              begin="0.5s"
              dur="0.4s"
              values="M18.5 2h3.5L22 2h-3.5z;M18.5 2h3.5L5 22h-3.5z"
            />
          </path>
        </g>
      </svg>
    ),
    external: true,
  },
  {
    type: "icon",
    url: "https://github.com/AxiomKit/axiomkit",
    text: "Github",
    icon: (
      <svg role="img" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
    external: true,
  },
];

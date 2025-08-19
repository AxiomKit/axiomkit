import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from "next/image";
import { FaGithub } from "react-icons/fa";

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <>
        <Image
          src={`/logo.png`}
          alt="Logo Axiom"
          height={32}
          width={32}
          className="w-auto"
        />
        <span className="text-red-600">AxiomKit</span>
      </>
    ),
  },
  // see https://fumadocs.dev/docs/ui/navigation/links
  links: [
    {
      type: "icon",
      icon: <FaGithub />,
      label: "Github",
      text: "Github",
      url: "https://github.com/AxiomKit/axiomkit",
      external: true,
    },
  ],
};

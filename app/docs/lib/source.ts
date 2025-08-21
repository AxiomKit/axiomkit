import { docs } from "@/.source";
import { createOpenAPI, attachFile } from "fumadocs-openapi/server";
import { loader } from "fumadocs-core/source";
import { createElement, ReactElement } from "react";
import { icons } from "lucide-react";

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  pageTree: {
    // adds a badge to each page item in page tree
    attachFile,
  },
  icon(icon: string | undefined): ReactElement<any, any> | undefined {
    if (!icon) {
      return;
    }
    if (icon in icons) return createElement(icons[icon as keyof typeof icons]);
  },
});

export const openapi = createOpenAPI();

import type { ContextSettings } from "../types";

export type ContextStateSnapshot = {
  id: string;
  type: string;
  args: any;
  key?: string;
  settings: Omit<ContextSettings, "model"> & { model?: string };
  contexts: string[];
};

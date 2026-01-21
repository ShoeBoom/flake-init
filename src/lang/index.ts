import type { LangConfig } from "../templater";
import node from "./node";

const configs = {
  node,
} as const satisfies Record<string, LangConfig>;

export default configs;

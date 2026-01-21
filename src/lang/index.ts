import type { LangConfig } from "../templater";
import node from "./node";
import rust from "./rust";

const configs = {
  node,
  rust,
} as const satisfies Record<string, LangConfig>;

export default configs;

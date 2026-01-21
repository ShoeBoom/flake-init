import type { LangConfig } from "../templater";
import gleam from "./gleam";
import node from "./node";
import rust from "./rust";

const configs = {
  node,
  rust,
  gleam,
} as const satisfies Record<string, LangConfig>;

export default configs;

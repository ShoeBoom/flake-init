import type { LangConfig, LangStepChoice } from "../templater";

export default {
  packages: {
    steps: [] as LangStepChoice[],
    defaults: [
      {
        package: "rustc",
      },
      {
        package: "cargo",
      },
      {
        package: "rust-analyzer",
      },
    ],
  },
} satisfies LangConfig;

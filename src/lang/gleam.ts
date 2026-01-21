import type { LangConfig, LangStepChoice } from "../templater";

export default {
  packages: {
    steps: [] as LangStepChoice[],
    defaults: [
      {
        package: "gleam",
      },
    ],
  },
} satisfies LangConfig;

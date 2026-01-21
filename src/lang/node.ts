import type { LangConfig, LangStepChoice } from "../templater";

const nodeVersionStep: LangStepChoice = {
  prompt: "Select Node.js version",
  choices: {
    nodejs_22: {
      label: "22",
      hint: "Node.js 22",
      packages: [
        {
          package: "nodejs_22",
        },
      ],
    },
    nodejs_20: {
      label: "20",
      hint: "Node.js 20",
      packages: [
        {
          package: "nodejs_20",
        },
      ],
    },
    nodejs_25: {
      label: "25",
      hint: "Node.js 25",
      packages: [
        {
          package: "nodejs_25",
        },
      ],
    },
  },
};

const packageManagerStep: LangStepChoice = {
  prompt: "Pick a package manager",
  choices: {
    npm: {
      label: "npm",
      hint: "(bundled)",
      packages: [],
    },
    pnpm: {
      label: "pnpm",
      packages: [
        {
          package: "pnpm",
        },
      ],
    },
    yarn: {
      label: "yarn",
      packages: [
        {
          package: "yarn",
        },
      ],
    },
    bun: {
      label: "bun",
      packages: [
        {
          package: "bun",
        },
      ],
    },
  },
};

export default {
  name: "node",
  packages: {
    steps: [nodeVersionStep, packageManagerStep],
  },
} satisfies LangConfig;

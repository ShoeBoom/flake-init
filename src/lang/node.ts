import type { LangConfig } from "../templater";
export default {
  name: "node",
  packages: {
    steps: [
      {
        prompt: "Select Node.js version",
        choices: {
          "nodejs_22": {
            label: "22",
            packages: [
              {
                name: "22",
                package: "nodejs_22",
              }
            ],
          },
          "nodejs_20": {
            label: "20",
            packages: [
              {
                name: "20",
                package: "nodejs_20",
              }
            ],
          },
          "nodejs_25": {
            label: "25",
            packages: [
              {
                name: "25",
                package: "nodejs_25",
              }
            ],
          },
        },
      },
      {
        prompt: "Pick a package manager",
        choices: {
          npm: {
            label: "npm (bundled)",
            packages: [],
          },
          pnpm: {
            label: "pnpm",
            packages: [
              {
                name: "pnpm",
                package: "pnpm",
              }
            ],
          },
          yarn: {
            label: "yarn",
            packages: [
              {
                name: "yarn",
                package: "yarn",
              }
            ],
          },
          bun: {
            label: "bun",
            packages: [
              {
                name: "bun",
                package: "bun",
              }
            ],
          },
        },
      },
    ]
  }
} satisfies LangConfig;

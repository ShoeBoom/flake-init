import type { LangConfig } from "../templater";
export default {
  name: "node",
  packages: {
    steps: [
      {
        prompt: "Select Node.js version",
        choices: {
          "nodejs_22": [
            {
              name: "22",
              package: "nodejs_22",
            }
          ],
          "nodejs_20": [
            {
              name: "20",
              package: "nodejs_20",
            }
          ],
          "nodejs_25": [
            {
              name: "25",
              package: "nodejs_25",
            }
          ],
        }
      }
    ]
  }
} satisfies LangConfig;
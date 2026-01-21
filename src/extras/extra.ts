import { appendFile, existsSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { spinner } from "@clack/prompts";

const envrcContents = `
dotenv
use flake
`;

export const createEnvrc = async (spin: ReturnType<typeof spinner>) => {
  spin.start("Writing .envrc");
  await writeFile(path.join(process.cwd(), ".envrc"), envrcContents, "utf8");
  spin.stop(".envrc created");
  await updateGitignore(spin);
};

export const updateGitignore = async (spin: ReturnType<typeof spinner>) => {
  const gitignorePath = path.join(process.cwd(), ".gitignore");
  const exists = existsSync(gitignorePath);
  if (exists) {
    const gitignoreContents = readFileSync(gitignorePath, "utf-8");
    if (gitignoreContents.includes(".direnv")) {
      return;
    }
  }
  if (exists) {
    spin.start("Updating .gitignore");
    appendFile(gitignorePath, "\n.direnv\n", (err) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
    });
  } else {
    spin.start("Creating .gitignore");
    await writeFile(gitignorePath, ".direnv\n", "utf8");
  }
  spin.stop(".gitignore updated");
};

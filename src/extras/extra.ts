import {
  appendFile,
  exists as existsFs,
  readFile,
  writeFile,
} from "node:fs/promises";
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
  const exists = await existsFs(gitignorePath);

  if (exists) {
    const gitignoreContents = await readFile(gitignorePath, "utf8");
    if (gitignoreContents.includes(".direnv")) {
      return;
    }

    spin.start("Updating .gitignore");
    await appendFile(gitignorePath, "\n.direnv\n", "utf8");
    spin.stop(".gitignore updated");

    return;
  }

  spin.start("Creating .gitignore");
  await writeFile(gitignorePath, ".direnv\n", "utf8");
  spin.stop(".gitignore updated");
};

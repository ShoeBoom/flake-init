import { exists as existsFs, writeFile } from "node:fs/promises";
import path from "node:path";
import { cancel, confirm, intro, outro, spinner } from "@clack/prompts";
import chalk from "chalk";
import { createEnvrc } from "./extras/extra";
import { renderTemplate, resolveConfig } from "./prompts/resolve-config";
import { selectPackages } from "./prompts/select-packages";
import { ensureAnswer } from "./utils";

const writeFlake = async (flakeContents: string) => {
  const outputPath = path.join(process.cwd(), "flake.nix");
  if (await existsFs(outputPath)) {
    const overwrite = ensureAnswer(
      await confirm({
        message: "flake.nix already exists. Overwrite it?",
        initialValue: false,
      })
    );

    if (!overwrite) {
      cancel("No changes were written.");
      process.exit(0);
    }
  }

  await writeFile(outputPath, flakeContents, "utf8");
  return outputPath;
};

const run = async () => {
  intro(chalk.bold("flake-init"));

  const config = await resolveConfig();
  const packages = await selectPackages(config.lang);

  const template = renderTemplate(config.template, {
    packages,
    supportedSystems: config.supportedSystems,
  });

  const spin = spinner();
  spin.start("Writing flake.nix");
  const outputPath = await writeFlake(template);
  spin.stop("Flake created");

  if (config.shouldCreateEncrc) {
    await createEnvrc(spin);
  }

  outro(
    `${chalk.green("Done!")} Wrote ${chalk.cyan(path.relative(process.cwd(), outputPath))} with ${chalk.bold(
      packages.length.toString()
    )} package${packages.length === 1 ? "" : "s"}.`
  );
};

run().catch((error) => {
  cancel(chalk.red("Failed to create flake."));
  console.error(error);
  process.exit(1);
});

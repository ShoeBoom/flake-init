import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import {
  cancel,
  confirm,
  intro,
  isCancel,
  multiselect,
  outro,
  select,
  spinner,
} from "@clack/prompts";
import chalk from "chalk";
import langConfigs from "./lang";
import {
  type NixPackage,
  renderTemplate,
  type TemplateName,
  templates,
} from "./templater";
import { typeSafeEntries, typeSafeKeys } from "./utils";

const systemOptions = [
  {
    value: "x86_64-linux",
    label: "x86_64-linux",
    hint: "Linux (Intel/AMD)",
  },
  {
    value: "aarch64-linux",
    label: "aarch64-linux",
    hint: "Linux (ARM)",
  },
  {
    value: "x86_64-darwin",
    label: "x86_64-darwin",
    hint: "macOS (Intel)",
  },
  {
    value: "aarch64-darwin",
    label: "aarch64-darwin",
    hint: "macOS (Apple Silicon)",
  },
] as const;

const ensureAnswer = <T>(answer: T | symbol): T => {
  if (isCancel(answer)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }
  return answer;
};

const resolveTemplate = async () => {
  return ensureAnswer(
    await select<TemplateName>({
      message: "Select a flake template",
      options: typeSafeEntries(templates).map(([templateName, template]) => ({
        value: templateName,
        label: template.name,
        hint: template.hint,
      })),
    })
  );
};

const resolveSupportedSystems = async () => {
  return ensureAnswer(
    await multiselect<(typeof systemOptions)[number]["value"]>({
      message: "Supported systems",
      options: systemOptions.map((option) => ({
        value: option.value,
        label: option.label,
        hint: option.hint,
      })),
      required: true,
    })
  );
};

const resolveLang = async () => {
  const availableLangs = typeSafeKeys(langConfigs);
  const langOptions = availableLangs.map((langValue) => ({
    value: langValue,
    label: langValue,
  }));

  return ensureAnswer(
    await select({
      message: "Pick a language preset",
      options: langOptions,
    })
  );
};

const resolveConfig = async () => {
  const template = await resolveTemplate();
  const supportedSystems = await resolveSupportedSystems();
  const lang = await resolveLang();

  return {
    template,
    lang,
    supportedSystems,
  };
};

const selectPackages = async (langKey: keyof typeof langConfigs) => {
  const configs = langConfigs;
  const lang = configs[langKey];
  if (!lang) {
    return [];
  }

  const selectedPackages: NixPackage[] = [];
  for (const step of lang.packages.steps) {
    const entries = Object.entries(step.choices);
    const options = entries.map(([key, choice]) => ({
      value: key,
      label: choice.label,
    }));

    const selected = ensureAnswer(
      await select({
        message: step.prompt,
        options,
      })
    );

    const selectedPackagesForStep = step.choices[selected]?.packages ?? [];
    selectedPackages.push(...selectedPackagesForStep);
  }

  return selectedPackages;
};

const writeFlake = async (flakeContents: string) => {
  const outputPath = path.join(process.cwd(), "flake.nix");
  if (existsSync(outputPath)) {
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

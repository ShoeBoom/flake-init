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
import { type NixPackage, renderTemplate } from "./templater";

type TemplateName = "base" | "flake-parts";

interface CliConfig {
  template: TemplateName;
  lang: string;
  supportedSystems: string[];
}

const templateOptions = [
  {
    value: "base",
    label: "Base flake",
    hint: "Simple mkShell setup",
  },
  {
    value: "flake-parts",
    label: "Flake parts",
    hint: "Hercules flake-parts layout",
  },
] satisfies { value: TemplateName; label: string; hint: string }[];

const templateNames = ["base", "flake-parts"] as const;

const isTemplateName = (value: string): value is TemplateName => {
  return (templateNames as readonly string[]).includes(value);
};

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
];

const toTitle = (value: string) =>
  `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;

const ensureAnswer = <T>(answer: T | symbol): T => {
  if (isCancel(answer)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }
  return answer;
};

const resolveTemplate = async (): Promise<TemplateName> => {
  return ensureAnswer(
    await select({
      message: "Select a flake template",
      options: templateOptions,
    })
  );
};

const resolveSupportedSystems = async (): Promise<string[]> => {
  return ensureAnswer(
    await multiselect({
      message: "Supported systems",
      options: systemOptions,
      required: true,
    })
  );
};

const resolveLang = async (availableLangs: string[]): Promise<string> => {
  const langOptions = availableLangs.map((langValue) => ({
    value: langValue,
    label: toTitle(langValue),
  }));

  return ensureAnswer(
    await select({
      message: "Pick a language preset",
      options: langOptions,
    })
  );
};

const resolveConfig = async (): Promise<CliConfig> => {
  const availableLangs = Object.keys(langConfigs);

  const template = await resolveTemplate();
  const supportedSystems = await resolveSupportedSystems();
  const lang = await resolveLang(availableLangs);

  return {
    template,
    lang,
    supportedSystems,
  };
};

const selectPackages = async (langKey: string): Promise<NixPackage[]> => {
  const configs: Record<
    string,
    (typeof langConfigs)[keyof typeof langConfigs]
  > = langConfigs;
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

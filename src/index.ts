import { cancel, confirm, intro, isCancel, multiselect, outro, select, spinner } from "@clack/prompts";
import chalk from "chalk";
import mri from "mri";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import langConfigs from "./lang";
import { renderTemplate, type NixPackage, type TemplateName } from "./templater";

type CliConfig = {
  template: TemplateName;
  lang: string;
  supportedSystems: string[];
};

const templateOptions: { value: TemplateName; label: string; hint: string }[] = [
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
];

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

const toTitle = (value: string) => value.slice(0, 1).toUpperCase() + value.slice(1);

const ensureAnswer = <T>(answer: T | symbol): T => {
  if (isCancel(answer)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }
  return answer;
};

const parseArgs = () => {
  return mri(process.argv.slice(2), {
    string: ["template", "lang", "systems"],
    boolean: ["yes"],
    alias: {
      t: "template",
      l: "lang",
      s: "systems",
      y: "yes",
    },
  });
};

const resolveConfig = async (): Promise<CliConfig> => {
  const args = parseArgs();
  const availableLangs = Object.keys(langConfigs);
  const defaultLang = availableLangs[0] ?? "node";

  let template = args.template as TemplateName | undefined;
  if (template && !templateOptions.some((option) => option.value === template)) {
    template = undefined;
  }

  let lang = typeof args.lang === "string" ? args.lang : undefined;
  if (lang && !availableLangs.includes(lang)) {
    lang = undefined;
  }

  let supportedSystems = typeof args.systems === "string"
    ? args.systems.split(",").map((value: string) => value.trim()).filter(Boolean)
    : undefined;

  if (supportedSystems && supportedSystems.length === 0) {
    supportedSystems = undefined;
  }

  const skipPrompts = Boolean(args.yes);

  if (!template) {
    if (skipPrompts) {
      template = "base";
    } else {
      template = ensureAnswer(
        await select({
          message: "Select a flake template",
          options: templateOptions,
        })
      );
    }
  }

  if (!supportedSystems) {
    if (skipPrompts) {
      supportedSystems = ["x86_64-linux", "aarch64-darwin"];
    } else {
      supportedSystems = ensureAnswer(
        await multiselect({
          message: "Supported systems",
          options: systemOptions,
          required: true,
        })
      );
    }
  }

  if (!lang) {
    if (skipPrompts) {
      lang = defaultLang;
    } else {
      const langOptions = availableLangs.map((value) => ({
        value,
        label: toTitle(value),
      }));

      lang = ensureAnswer(
        await select({
          message: "Pick a language preset",
          options: langOptions,
        })
      );
    }
  }

  return {
    template,
    lang,
    supportedSystems,
  };
};

const selectPackages = async (langKey: string): Promise<NixPackage[]> => {
  const configs = langConfigs as Record<string, typeof langConfigs[keyof typeof langConfigs]>;
  const lang = configs[langKey];
  if (!lang) {
    return [];
  }

  const selectedPackages: NixPackage[] = [];
  for (const step of lang.packages.steps) {
    const choices = step.choices as Record<string, NixPackage[]>;
    const entries = Object.entries(choices) as [string, NixPackage[]][];
    const options = entries.map(([key, packages]) => ({
      value: key,
      label: packages.map((item) => item.name).join(", "),
    }));

    const selected = ensureAnswer(
      await select({
        message: step.prompt,
        options,
      })
    );

    const selectedPackagesForStep = choices[selected] ?? [];
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

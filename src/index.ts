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
import mri from "mri";
import langConfigs from "./lang";
import {
  type NixPackage,
  renderTemplate,
  type TemplateName,
} from "./templater";

interface CliConfig {
  template: TemplateName;
  lang: string;
  supportedSystems: string[];
}

const templateOptions: { value: TemplateName; label: string; hint: string }[] =
  [
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

const toTitle = (value: string) =>
  value.slice(0, 1).toUpperCase() + value.slice(1);

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

const normalizeTemplate = (value: unknown): TemplateName | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const template = value as TemplateName;
  return templateOptions.some((option) => option.value === template)
    ? template
    : undefined;
};

const normalizeLang = (
  value: unknown,
  availableLangs: string[]
): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  return availableLangs.includes(value) ? value : undefined;
};

const normalizeSystems = (value: unknown): string[] | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const supportedSystems = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return supportedSystems.length > 0 ? supportedSystems : undefined;
};

const resolveTemplate = async (
  value: unknown,
  skipPrompts: boolean
): Promise<TemplateName> => {
  const template = normalizeTemplate(value);
  if (template) {
    return template;
  }

  if (skipPrompts) {
    return "base";
  }

  return ensureAnswer(
    await select({
      message: "Select a flake template",
      options: templateOptions,
    })
  );
};

const resolveSupportedSystems = async (
  value: unknown,
  skipPrompts: boolean
): Promise<string[]> => {
  const supportedSystems = normalizeSystems(value);
  if (supportedSystems) {
    return supportedSystems;
  }

  if (skipPrompts) {
    return ["x86_64-linux", "aarch64-darwin"];
  }

  return ensureAnswer(
    await multiselect({
      message: "Supported systems",
      options: systemOptions,
      required: true,
    })
  );
};

const resolveLang = async (
  value: unknown,
  availableLangs: string[],
  defaultLang: string,
  skipPrompts: boolean
): Promise<string> => {
  const lang = normalizeLang(value, availableLangs);
  if (lang) {
    return lang;
  }

  if (skipPrompts) {
    return defaultLang;
  }

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
  const args = parseArgs();
  const availableLangs = Object.keys(langConfigs);
  const defaultLang = availableLangs[0] ?? "node";
  const skipPrompts = Boolean(args.yes);

  const template = await resolveTemplate(args.template, skipPrompts);
  const supportedSystems = await resolveSupportedSystems(
    args.systems,
    skipPrompts
  );
  const lang = await resolveLang(
    args.lang,
    availableLangs,
    defaultLang,
    skipPrompts
  );

  return {
    template,
    lang,
    supportedSystems,
  };
};

const selectPackages = async (langKey: string): Promise<NixPackage[]> => {
  const configs = langConfigs as Record<
    string,
    (typeof langConfigs)[keyof typeof langConfigs]
  >;
  const lang = configs[langKey];
  if (!lang) {
    return [];
  }

  const selectedPackages: NixPackage[] = [];
  for (const step of lang.packages.steps) {
    const choices = step.choices as unknown as Record<
      string,
      { label: string; packages: NixPackage[] }
    >;
    const entries = Object.entries(choices);
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

    const selectedPackagesForStep = choices[selected]?.packages ?? [];
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

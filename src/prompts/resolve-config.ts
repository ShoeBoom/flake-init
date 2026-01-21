import { cancel, isCancel, multiselect, select } from "@clack/prompts";
import langConfigs from "../lang";
import type { TemplateName } from "../templater";
import { typeSafeKeys } from "../utils";

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
      options: [
        {
          value: "flake-parts",
          label: "flake-parts",
          hint: "Hercules flake-parts layout",
        },
        {
          value: "base",
          label: "base",
          hint: "Simple mkShell setup",
        },
      ],
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

export { ensureAnswer, resolveConfig };

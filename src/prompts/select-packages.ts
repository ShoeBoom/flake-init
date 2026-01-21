import { select } from "@clack/prompts";
import langConfigs from "../lang";
import type { NixPackage } from "../templater";
import { ensureAnswer } from "./resolve-config";

const selectPackages = async (langKey: keyof typeof langConfigs) => {
  const lang = langConfigs[langKey];
  if (!lang) {
    return [];
  }

  const selectedPackages: NixPackage[] = [];
  for (const step of lang.packages.steps) {
    const entries = Object.entries(step.choices);
    const options = entries.map(([key, choice]) => ({
      value: key,
      hint: choice.hint,
      label: choice.label,
    }));

    const selected = ensureAnswer(
      await select({
        message: step.prompt,
        options,
      })
    );

    const packages = step.choices[selected]?.packages ?? [];
    selectedPackages.push(...packages);
  }

  const flattenedPackages = selectedPackages.flat();

  return flattenedPackages;
};

export { selectPackages };

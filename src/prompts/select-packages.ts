import { select } from "@clack/prompts";
import langConfigs from "../lang";
import type { NixPackage } from "../templater";
import { ensureAnswer } from "../utils";

export const selectPackages = async (
  langKeys: Array<keyof typeof langConfigs>
) => {
  const selectedPackages: NixPackage[] = [];

  for (const langKey of langKeys) {
    const lang = langConfigs[langKey];
    if (!lang) {
      continue;
    }

    selectedPackages.push(...(lang.packages.defaults ?? []));

    for (const step of lang.packages.steps) {
      const selected = ensureAnswer(
        await select({
          message: step.prompt,
          options: Object.entries(step.choices).map(([key, choice]) => ({
            value: key,
            hint: choice.hint,
            label: choice.label,
          })),
        })
      );

      const packages = step.choices[selected]?.packages ?? [];
      selectedPackages.push(...packages);
    }
  }

  return selectedPackages;
};

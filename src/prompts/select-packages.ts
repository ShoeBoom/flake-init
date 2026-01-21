import { select } from "@clack/prompts";
import langConfigs from "../lang";
import { ensureAnswer } from "./resolve-config";

const selectPackages = async (langKey: keyof typeof langConfigs) => {
  const lang = langConfigs[langKey];
  if (!lang) {
    return [];
  }

  const selectedPackages = await Promise.all(
    lang.packages.steps.map(async (step) => {
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

      return step.choices[selected]?.packages ?? [];
    })
  );

  const flattenedPackages = selectedPackages.flat();

  return flattenedPackages;
};

export { selectPackages };

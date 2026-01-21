type NixPackage = string & { __brand: "NixPackage" };

type LangStepChoice = {
  prompt: string;
  choices: Record<{ name: string }, NixPackage[]>
}

type LangConfig = {
  packages: {
    steps: LangStepChoice[];
  }
}
export interface NixPackage {
  name: string;
  package: string;
}

interface LangStepChoiceOption {
  label: string;
  packages: NixPackage[];
}

export interface LangStepChoice {
  prompt: string;
  choices: Record<string, LangStepChoiceOption>;
}

export interface LangConfig {
  name: string;
  packages: {
    steps: LangStepChoice[];
  };
}

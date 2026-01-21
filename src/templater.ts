export interface NixPackage {
  package: string;
}

export interface LangStepChoice {
  prompt: string;
  choices: Record<
    string,
    {
      label: string;
      hint?: string;
      packages: NixPackage[];
    }
  >;
}

export interface LangConfig {
  name: string;
  packages: {
    steps: LangStepChoice[];
  };
}

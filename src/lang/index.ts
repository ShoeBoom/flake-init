type NixPackage = {
  package: string & { __brand: "NixPackage" }
};

type LangStepChoice = {
  prompt: string;
  choices: Record<string, NixPackage[]>
}

type LangConfig = {
  name: string;
  packages: {
    steps: LangStepChoice[];
  }
}

type Template = "flake"
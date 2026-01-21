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

const templates = [
  "flake-utils",
  "flake-parts",
  "base",
  "devenv",
]
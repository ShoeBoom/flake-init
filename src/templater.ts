export type NixPackage = {
  name: string;
  package: string;
};

export type LangStepChoiceOption = {
  label: string;
  packages: NixPackage[];
};

export type LangStepChoice = {
  prompt: string;
  choices: Record<string, LangStepChoiceOption>;
};

export type LangConfig = {
  name: string;
  packages: {
    steps: LangStepChoice[];
  };
};

export type TemplateName = "base" | "flake-parts";

const templates = {
  "flake-parts": ({ packages, supportedSystems }) => `
    {
  description = "Dev environment (flake-parts)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    "flake-parts".url = "github:hercules-ci/flake-parts";
  };

  outputs = inputs@{nixpkgs, flake-parts, ...}:
    flake-parts.lib.mkFlake { inherit inputs; } (top@{ config, withSystem, moduleWithSystem, ... }: {
    systems = [
      ${supportedSystems.map((s) => `"${s}"`).join("\n")}
    ];

    perSystem = {pkgs, system, ...}: {
      packages.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            ${packages.map((p) => p.package).join("\n")}
          ];
        };
    };
  });
}
  `,
  base: ({ packages, supportedSystems }) => `
{
  description = "Dev environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs =
    { self, ... }@inputs:

    let
      supportedSystems = [
        ${supportedSystems.map((s) => `"${s}"`).join("\n")}
      ];
      forEachSupportedSystem =
        f:
        inputs.nixpkgs.lib.genAttrs supportedSystems (
          system:
          f {
            pkgs = import inputs.nixpkgs { inherit system; };
          }
        );
    in
    {
      devShells = forEachSupportedSystem (
        { pkgs }:
        {
          default = pkgs.mkShellNoCC {
            packages = with pkgs; [
              ${packages.map((p) => p.package).join("\n")}
            ];
          };
        }
      );
    };
}
  `,
} satisfies Record<
  TemplateName,
  (props: { packages: NixPackage[]; supportedSystems: string[] }) => string
>;

export const renderTemplate = (
  template: TemplateName,
  props: { packages: NixPackage[]; supportedSystems: string[] }
) => {
  return templates[template](props);
};

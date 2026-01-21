import { multiselect, select } from "@clack/prompts";
import langConfigs from "../lang";
import type { NixPackage } from "../templater";
import { ensureAnswer, typeSafeEntries, typeSafeKeys } from "../utils";

interface TemplateConfig {
  template: (props: {
    packages: NixPackage[];
    supportedSystems: string[];
  }) => string;
  hint: string;
  name: string;
}

const templates = {
  "flake-parts": {
    name: "flake-parts",
    hint: "Hercules flake-parts layout",
    template: ({ packages, supportedSystems }) => `
    {
  description = "Dev environment (flake-parts)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    "flake-parts".url = "github:hercules-ci/flake-parts";
  };

  outputs = inputs@{nixpkgs, flake-parts, ...}:
    flake-parts.lib.mkFlake { inherit inputs; } (top@{ config, withSystem, moduleWithSystem, ... }: {
    systems = [
      ${supportedSystems.map((s) => `"${s}"`).join("\n      ")}
    ];

    perSystem = {pkgs, system, ...}: {
      packages.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            ${packages.map((p) => p.package).join("\n            ")}
          ];
        };
    };
  });
}
  `,
  },
  base: {
    name: "base",
    hint: "Simple mkShell setup",
    template: ({ packages, supportedSystems }) => `
{
  description = "Dev environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs =
    { self, ... }@inputs:

    let
      supportedSystems = [
        ${supportedSystems.map((s) => `"${s}"`).join("\n        ")}
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
              ${packages.map((p) => p.package).join("\n              ")}
            ];
          };
        }
      );
    };
}
  `,
  },
} satisfies Record<string, TemplateConfig>;

export type TemplateName = keyof typeof templates;

const resolveTemplate = async () => {
  return ensureAnswer(
    await select({
      message: "Select a flake template",
      options: typeSafeEntries(templates).map(([name, config]) => ({
        value: name,
        label: config.name,
        hint: config.hint,
      })),
    })
  );
};

const resolveSupportedSystems = async () => {
  return ensureAnswer(
    await multiselect({
      message: "Supported systems",
      options: [
        {
          value: "x86_64-linux",
          hint: "Linux (Intel/AMD)",
        },
        {
          value: "aarch64-linux",
          hint: "Linux (ARM)",
        },
        {
          value: "x86_64-darwin",
          hint: "macOS (Intel)",
        },
        {
          value: "aarch64-darwin",
          hint: "macOS (Apple Silicon)",
        },
      ],
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

export const resolveConfig = async () => {
  const template = await resolveTemplate();
  const supportedSystems = await resolveSupportedSystems();
  const lang = await resolveLang();

  return {
    template,
    lang,
    supportedSystems,
  };
};

export const renderTemplate = (
  template: TemplateName,
  props: { packages: NixPackage[]; supportedSystems: string[] }
) => {
  return templates[template].template(props);
};

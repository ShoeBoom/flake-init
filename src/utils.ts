import { cancel, isCancel } from "@clack/prompts";

export const typeSafeValues = <T extends Record<string, unknown>>(
  obj: T
): T[keyof T][] => {
  return Object.values(obj) as T[keyof T][];
};

export const typeSafeKeys = <T extends Record<string, unknown>>(
  obj: T
): (keyof T)[] => {
  return Object.keys(obj) as (keyof T)[];
};

export const typeSafeEntries = <T extends Record<string, unknown>>(
  obj: T
): [keyof T, T[keyof T]][] => {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
};

export const ensureAnswer = <T>(answer: T | symbol): T => {
  if (isCancel(answer)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }
  return answer;
};

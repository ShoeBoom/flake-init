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

export const DEVELOPER_TOOLS_STORAGE_KEYS = [
  "zcode:developer-tools:enabled",
  "zcode:token-debug:enabled",
] as const;

const DISABLED_VALUES = new Set(["0", "false", "off", "no"]);

export function isDeveloperToolsStorageValueEnabled(value: string | null): boolean {
  if (value === null) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return !DISABLED_VALUES.has(normalized);
}

export function readDeveloperToolsEnabled(storage: Storage | undefined = getLocalStorage()) {
  if (!storage) {
    return true;
  }
  const values = DEVELOPER_TOOLS_STORAGE_KEYS.map((key) => {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  });
  return (
    values.every((value) => value === null) || values.some(isDeveloperToolsStorageValueEnabled)
  );
}

function getLocalStorage(): Storage | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

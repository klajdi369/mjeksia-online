// constants/settings.ts
import Storage from "expo-sqlite/kv-store";
import { useCallback, useSyncExternalStore } from "react";

// Helper that enforces `default` is a valid option key at compile time
function defineSetting<
  O extends Record<string, string>,
  D extends keyof O & string,
>(config: {
  label: string;
  options: O;
  default: D;
  section: string;
  scope?: "dev";
  description?: string;
}) {
  return config;
}

export const settingsSchema = {
  user_theme: defineSetting({
    label: "Theme",
    options: { light: "Light", dark: "Dark" },
    default: "light",
    section: "Appearance",
  }),
  test_question_amount: defineSetting({
    label: "Questions per test",
    options: { "50": "50 pyetje", "10": "10 pyetje" },
    default: "50",
    section: "Debug",
    scope: "dev",
  }),
  test_time: defineSetting({
    label: "Time per test",
    options: {
      "50": "50 minuta",
      "10": "10 min",
      "1": "1 min",
      "0.5": "30 sekonda",
    },
    default: "50",
    section: "Debug",
    scope: "dev",
  }),
  // Adding a new setting later is just this:
  // review_mode: defineSetting({
  //   label: "Review mode",
  //   options: { all: "All questions", wrong: "Wrong only", unanswered: "Unanswered" },
  //   default: "all",
  //   section: "Learning",
  // }),
};

export type SettingsKey = keyof typeof settingsSchema;
type SettingValue<K extends SettingsKey> =
  keyof (typeof settingsSchema)[K]["options"] & string;

// Still in constants/settings.ts

const listeners = new Map<SettingsKey, Set<() => void>>();

function subscribe(key: SettingsKey, cb: () => void) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(cb);
  return () => {
    listeners.get(key)!.delete(cb);
  };
}

export function getSetting<K extends SettingsKey>(key: K): SettingValue<K> {
  const def = settingsSchema[key];
  try {
    const raw = Storage.getItemSync(`setting_${key}`);
    if (raw !== null && raw in def.options) {
      return raw as SettingValue<K>;
    }
  } catch (e) {
    console.warn(`Failed to read setting "${key}":`, e);
  }
  return def.default as SettingValue<K>;
}

export function setSetting<K extends SettingsKey>(
  key: K,
  value: SettingValue<K>,
) {
  const def = settingsSchema[key];
  if (!(value in def.options)) {
    console.warn(`Invalid value "${value}" for setting "${key}"`);
    return;
  }
  try {
    Storage.setItemSync(`setting_${key}`, value);
  } catch (e) {
    console.warn(`Failed to write setting "${key}":`, e);
    return;
  }
  listeners.get(key)?.forEach((l) => l());
}

// Still in constants/settings.ts

export function useSetting<K extends SettingsKey>(key: K) {
  const value = useSyncExternalStore(
    useCallback((cb) => subscribe(key, cb), [key]),
    () => getSetting(key),
  );

  const setter = useCallback((v: SettingValue<K>) => setSetting(key, v), [key]);

  return [value, setter] as const;
}

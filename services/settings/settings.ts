import Storage from "expo-sqlite/kv-store";
import { useCallback, useSyncExternalStore } from "react";
import type { AnySettingDef } from "./settingTypes";
import {
  settingsDefs,
  type SettingsKey,
  type SettingValue,
} from "./settingsSchema";

export * from "./settingTypes";
export * from "./settingsSchema";

// --- Runtime ---

const listeners = new Map<SettingsKey, Set<() => void>>();

function subscribe(key: SettingsKey, cb: () => void) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(cb);
  return () => {
    listeners.get(key)!.delete(cb);
  };
}

export function getSetting<K extends SettingsKey>(key: K): SettingValue<K> {
  const def: AnySettingDef = settingsDefs[key];

  try {
    const raw = Storage.getItemSync(`setting_${key}`);

    if (raw !== null) {
      if (def.type === "select") {
        if (def.options.some((o) => o.value === raw))
          return raw as unknown as SettingValue<K>;
      } else if (def.type === "toggle") {
        if (raw === "true" || raw === "false")
          return (raw === "true") as unknown as SettingValue<K>;
      }
    }
  } catch (e) {
    console.warn(`Failed to read setting "${key}":`, e);
  }
  return def.default as unknown as SettingValue<K>;
}

export function setSetting<K extends SettingsKey>(
  key: K,
  value: SettingValue<K>,
) {
  const def: AnySettingDef = settingsDefs[key];

  if (def.type === "select") {
    if (!def.options.some((o) => o.value === String(value))) {
      console.warn(`Invalid value "${String(value)}" for setting "${key}"`);
      return;
    }
  }

  try {
    Storage.setItemSync(`setting_${key}`, String(value));
  } catch (e) {
    console.warn(`Failed to write setting "${key}":`, e);
    return;
  }
  listeners.get(key)?.forEach((l) => l());
}

export function useSetting<K extends SettingsKey>(key: K) {
  const value = useSyncExternalStore(
    useCallback((cb) => subscribe(key, cb), [key]),
    () => getSetting(key),
  );

  const setter = useCallback((v: SettingValue<K>) => setSetting(key, v), [key]);

  return [value, setter] as const;
}

export function useSettingsSideEffects() {
  // Left for future side effects
}

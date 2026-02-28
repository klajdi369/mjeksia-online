import Constants from "expo-constants";
import type { AnySettingDef, SettingsSchema } from "./settingTypes";

// ── Flat registry (single source of truth for types) ────────────────────

export const settingsDefs = {
  user_color_scheme: {
    type: "select",
    label: "Theme",
    options: { Leadgen: "Leadgen", Dracula: "Dracula" },
    default: "Leadgen",
  },
  user_appearance: {
    type: "select",
    label: "Appearance",
    options: { light: "Light", dark: "Dark", system: "System" },
    default: "system",
  },
  hide_arena_explanation: {
    type: "toggle",
    label: "Hide Explanations",
    description: "Do not show explanations after guessing.",
    default: false,
  },
  test_question_amount: {
    type: "select",
    label: "Questions per test",
    options: { "50": "50 pyetje", "10": "10 pyetje" },
    default: "50",
    scope: "dev",
  },
  test_time: {
    type: "select",
    label: "Time per test",
    options: {
      "0.5": "30 sek",
      "1": "1 min",
      "5": "5 min",
      "10": "10 min",
      "50": "50 min",
    },
    default: "50",
    scope: "dev",
  },
  always_show_image_placeholder: {
    type: "toggle",
    label: "Always Show Image Placeholder",
    description: "Always show the image placeholder even if there is no image.",
    default: false,
  },
} as const satisfies Record<string, AnySettingDef>;

// ── Derived types ───────────────────────────────────────────────────────

type SettingsDefs = typeof settingsDefs;

export type SettingsKey = keyof SettingsDefs;

export type SettingValue<K extends SettingsKey> = SettingsDefs[K] extends {
  type: "select";
  options: infer O;
}
  ? keyof O & string
  : SettingsDefs[K] extends { type: "toggle" }
    ? boolean
    : never;

// ── Nested schema (UI layout only) ─────────────────────────────────────

export const settingsSchema: SettingsSchema = {
  Appearance: {
    title: "Appearance",
    icon: "color-palette-outline",
    subsections: {
      UI: {
        title: "User Interface",
        settings: {
          user_color_scheme: settingsDefs.user_color_scheme,
          user_appearance: settingsDefs.user_appearance,
        },
      },
    },
  },
  TestPreferences: {
    title: "Test Preferences",
    icon: "document-text-outline",
    subsections: {
      Arena: {
        title: "Arena",
        settings: {
          hide_arena_explanation: settingsDefs.hide_arena_explanation,
          always_show_image_placeholder:
            settingsDefs.always_show_image_placeholder,
        },
      },
    },
  },
  ...((Constants.expoConfig?.extra?.showDevSettings ?? __DEV__)
    ? {
        Developer: {
          title: "Developer Tools",
          icon: "code-slash-outline",
          subsections: {
            Debug: {
              title: "Debug & Testing",
              settings: {
                test_question_amount: settingsDefs.test_question_amount,
                test_time: settingsDefs.test_time,
              },
            },
          },
        },
      }
    : {}),
};

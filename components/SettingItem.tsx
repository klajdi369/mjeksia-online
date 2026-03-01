import { ColorSchemeName, getThemeColor } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { cn } from "@/lib/utils";
import {
  AnySettingDef,
  SettingsKey,
  setSetting,
  useSetting,
} from "@/services/settings/settings";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { ThemePreview } from "./ThemePreview";

export function SettingItem({
  settingKey,
  def,
}: {
  settingKey: SettingsKey;
  def: AnySettingDef;
}) {
  const [value] = useSetting(settingKey);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const { scheme, theme } = useAppTheme();

  const primaryColor = getThemeColor("--primary", scheme, theme);

  // Use a runtime-typed setter that bypasses the generic constraint issue.
  // This is safe because the schema + runtime validation in setSetting
  // already ensures only valid values are persisted.
  const setValueRaw = (v: string | boolean) =>
    setSetting(settingKey, v as never);

  if (def.type === "toggle") {
    const isEnabled = Boolean(value);

    return (
      <View className="flex-row items-center justify-between py-4 px-4 bg-transparent border-t-0">
        <View className="flex-1 pr-4">
          <Text className="text-foreground font-medium text-base">
            {def.label}
          </Text>
          {def.description && (
            <Text className="text-muted-foreground text-sm mt-1">
              {def.description}
            </Text>
          )}
        </View>
        <Switch
          // TODO: Update the color to use themed ones in the upcoming theme update
          trackColor={{ false: "#767577", true: primaryColor }}
          thumbColor={isEnabled ? "#ffffff" : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
          onValueChange={(val) => setValueRaw(val)}
          value={isEnabled}
        />
      </View>
    );
  }

  if (def.type === "select") {
    const options = def.options;
    const isDropdown = options.length > 3;

    const handleSelect = (optionValue: string) => {
      setValueRaw(optionValue);
      setDropdownOpen(false);
    };

    const currentLabel =
      options.find((o) => o.value === value)?.label || String(value);

    return (
      <View className="py-4 px-4 flex-col justify-start">
        <View className="mb-3">
          <Text className="text-foreground font-medium text-base">
            {def.label}
          </Text>
          {def.description && (
            <Text className="text-muted-foreground text-sm mt-1">
              {def.description}
            </Text>
          )}
        </View>

        {isDropdown ? (
          <>
            <Pressable
              onPress={() => setDropdownOpen(true)}
              className="flex-row items-center justify-between px-4 py-3 rounded-lg border border-border bg-background"
            >
              <View className="flex-row items-center">
                {settingKey === "user_color_scheme" && (
                  <ThemePreview
                    scheme={value as ColorSchemeName}
                    appearance={theme}
                  />
                )}
                <Text className="text-foreground font-medium">
                  {currentLabel}
                </Text>
              </View>
              <Text className="text-muted-foreground text-xs">▼</Text>
            </Pressable>

            <Modal
              visible={isDropdownOpen}
              transparent
              animationType="fade"
              onRequestClose={() => setDropdownOpen(false)}
            >
              <Pressable
                className="flex-1 bg-black/50 justify-center items-center px-4"
                onPress={() => setDropdownOpen(false)}
              >
                <Pressable
                  className="w-full max-h-[50%] bg-background rounded-xl overflow-hidden border border-border"
                  onPress={(e) => e.stopPropagation()}
                >
                  <View className="p-4 border-b border-border bg-card">
                    <Text className="text-foreground font-semibold text-lg">
                      Select {def.label}
                    </Text>
                  </View>

                  <ScrollView contentContainerStyle={{ padding: 8 }}>
                    {options.map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => handleSelect(option.value)}
                        className={cn(
                          "p-3 rounded-lg mb-1 flex-row items-center justify-between active:bg-secondary",
                          "bg-transparent",
                        )}
                      >
                        <View className="flex-row items-center">
                          {settingKey === "user_color_scheme" && (
                            <ThemePreview
                              scheme={option.value as ColorSchemeName}
                              appearance={theme}
                            />
                          )}
                          <Text
                            className={cn(
                              "text-base",
                              String(option.value) === String(value)
                                ? "text-primary font-semibold"
                                : "text-foreground",
                            )}
                          >
                            {String(option.label)}
                          </Text>
                        </View>
                        {String(option.value) === String(value) && (
                          <Text className="text-primary">✓</Text>
                        )}
                      </Pressable>
                    ))}
                  </ScrollView>
                </Pressable>
              </Pressable>
            </Modal>
          </>
        ) : (
          <View className="flex-row gap-2">
            {options.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => handleSelect(option.value)}
                className={cn(
                  "px-4 py-2 rounded-lg border",
                  String(option.value) === String(value)
                    ? "bg-primary border-primary"
                    : "bg-background border-border",
                )}
              >
                <View className="flex-row items-center">
                  {settingKey === "user_color_scheme" && (
                    <ThemePreview
                      scheme={option.value as ColorSchemeName}
                      appearance={theme}
                    />
                  )}
                  <Text
                    className={cn(
                      String(option.value) === String(value)
                        ? "text-primary-foreground font-semibold"
                        : "text-foreground",
                    )}
                  >
                    {String(option.label)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  }

  return null;
}

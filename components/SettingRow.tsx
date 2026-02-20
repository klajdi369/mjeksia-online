// components/SettingRow.tsx
import { SettingsKey, settingsSchema, useSetting } from "@/constants/settings";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

export function SettingRow<K extends SettingsKey>({
  settingKey,
  onUpdate,
}: {
  settingKey: K;
  onUpdate?: (value: string) => void;
}) {
  const [value, setValue] = useSetting(settingKey);
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const def = settingsSchema[settingKey];
  const entries = Object.entries(def.options);
  const isDropdown = entries.length > 3;

  const handleSelect = (optionValue: string) => {
    // Safe: optionValue comes directly from def.options keys
    setValue(optionValue as Parameters<typeof setValue>[0]);
    onUpdate?.(optionValue);
    setDropdownOpen(false);
  };

  // Helper to get the display label for the currently selected value
  const currentLabel = def.options[value as keyof typeof def.options] || value;

  return (
    <View className="py-4">
      <Text className="text-foreground font-medium mb-3">{def.label}</Text>

      {isDropdown ? (
        <>
          {/* Dropdown Trigger */}
          <Pressable
            onPress={() => setDropdownOpen(true)}
            className="flex-row items-center justify-between px-4 py-3 rounded-lg border border-border bg-secondary"
          >
            <Text className="text-foreground font-medium">{currentLabel}</Text>
            <Text className="text-muted-foreground text-xs">▼</Text>
          </Pressable>

          {/* Dropdown Modal */}
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
              {/* Modal Content */}
              <Pressable
                className="w-full max-h-[50%] bg-background rounded-xl overflow-hidden border border-border"
                onPress={(e) => e.stopPropagation()} // Prevent closing when clicking content
              >
                <View className="p-4 border-b border-border bg-secondary/50">
                  <Text className="text-foreground font-semibold text-lg">
                    Select {def.label}
                  </Text>
                </View>

                <ScrollView contentContainerStyle={{ padding: 8 }}>
                  {entries.map(([optVal, optLabel]) => (
                    <Pressable
                      key={optVal}
                      onPress={() => handleSelect(optVal)}
                      className={cn(
                        "p-3 rounded-lg mb-1 flex-row items-center justify-between",
                        optVal === value ? "bg-secondary" : "bg-transparent",
                      )}
                    >
                      <Text
                        className={cn(
                          "text-base",
                          optVal === value
                            ? "text-primary font-semibold"
                            : "text-foreground",
                        )}
                      >
                        {optLabel}
                      </Text>
                      {optVal === value && (
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
        /* Original Toggle Group (<= 3 options) */
        <View className="flex-row gap-2">
          {entries.map(([optVal, optLabel]) => (
            <Pressable
              key={optVal}
              onPress={() => handleSelect(optVal)}
              className={cn(
                "px-4 py-2 rounded-lg border",
                optVal === value
                  ? "bg-primary border-primary"
                  : "bg-secondary border-border",
              )}
            >
              <Text
                className={cn(
                  optVal === value
                    ? "text-primary-foreground font-semibold"
                    : "text-foreground",
                )}
              >
                {optLabel}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

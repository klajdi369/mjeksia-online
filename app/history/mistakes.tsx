import { useDrizzle } from "@/hooks/useDrizzle";
import { getUserMistakes } from "@/services/db/history";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MistakesList() {
  const { drizzleDb } = useDrizzle();
  const router = useRouter();

  const [mistakes, setMistakes] = useState<any[]>([]);

  const fetchMistakes = useCallback(async () => {
    const data = await getUserMistakes(drizzleDb);
    setMistakes(data);
  }, [drizzleDb]);

  useFocusEffect(
    useCallback(() => {
      fetchMistakes();
    }, [fetchMistakes]),
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="px-4 pt-4 pb-8 gap-6">
          {/* Header */}
          <View className="flex-row items-center gap-4">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-secondary items-center justify-center active:bg-secondary/80"
            >
              <Ionicons
                name="arrow-back"
                size={24}
                className="text-foreground"
                color="gray"
              />
            </Pressable>
            <View>
              <Text className="text-2xl font-bold text-foreground">
                Historia e Gabimeve
              </Text>
              <Text className="text-sm text-muted-foreground mt-1">
                Gjithsej {mistakes.length} përgjigje të pasakta
              </Text>
            </View>
          </View>

          {mistakes.length > 0 ? (
            <Pressable
              className="bg-primary p-4 rounded-xl items-center justify-center active:opacity-90 flex-row gap-2"
              onPress={() => alert("Krijimi i testit vjen së shpejti!")}
            >
              <Ionicons
                name="construct"
                size={20}
                className="text-primary-foreground"
                color="white"
              />
              <Text className="text-primary-foreground font-bold text-lg">
                Testo Vetëm Gabimet
              </Text>
            </Pressable>
          ) : (
            <View className="bg-card p-6 rounded-2xl border border-border items-center justify-center mt-4">
              <Ionicons
                name="checkmark-circle"
                size={48}
                color="#22c55e"
                className="mb-4"
              />
              <Text className="text-lg font-bold text-foreground text-center">
                Shkëlqyer!
              </Text>
              <Text className="text-sm text-muted-foreground text-center mt-2">
                Nuk keni bërë asnjë gabim ose nuk keni zhvilluar ende teste.
              </Text>
            </View>
          )}

          {/* Mistakes List */}
          {mistakes.length > 0 && (
            <View className="mt-4 gap-4">
              {mistakes.map((item: any, index: number) => {
                const q = item.question;
                const a = item.userAnswer;

                return (
                  <View
                    key={index}
                    className="bg-card p-4 rounded-2xl border border-destructive/30"
                  >
                    <Text className="text-foreground font-medium text-lg">
                      {index + 1}. {q.question_text}
                    </Text>

                    <View className="mt-4 gap-2">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-muted-foreground">
                          Gabimi juaj:
                        </Text>
                        <Text className="font-bold text-destructive">
                          Opsioni {a.selected_option || "I Përgjigjur (Zbrazët)"}
                        </Text>
                      </View>

                      <View className="flex-row items-center justify-between mt-1 pt-2 border-t border-border">
                        <Text className="text-muted-foreground">
                          Përgjigjja e saktë:
                        </Text>
                        <Text className="font-bold text-success">
                          Opsioni {a.correct_option}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

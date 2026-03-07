import { useDrizzle } from "@/hooks/useDrizzle";
import { formatDate } from "@/lib/utils";
import { getTestSessionDetails } from "@/services/db/history";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TestDetails() {
  const { id } = useLocalSearchParams();
  const { drizzleDb } = useDrizzle();
  const router = useRouter();

  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    if (id) {
      getTestSessionDetails(drizzleDb, Number(id)).then((data) => {
        setDetails(data);
      });
    }
  }, [id, drizzleDb]);

  if (!details) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted-foreground">Po ngarkohet...</Text>
      </SafeAreaView>
    );
  }

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
                {details.test_type === "focus"
                  ? "Test i Fokusuar"
                  : "Model Testi"}{" "}
                #{details.id}
              </Text>
              <Text className="text-sm text-muted-foreground mt-1">
                {formatDate(details.createdAt)}
              </Text>
            </View>
          </View>

          {/* Overview Cards */}
          <View className="flex-row justify-between gap-y-4 flex-wrap">
            <View className="w-[48%] bg-card p-4 rounded-2xl border border-border items-center justify-center">
              <Text className="text-3xl font-bold text-foreground">
                {details.score}/{details.total_questions}
              </Text>
              <Text className="text-sm text-muted-foreground mt-1 text-center">
                Pikët e Fituara
              </Text>
            </View>
            <View className="w-[48%] bg-card p-4 rounded-2xl border border-border items-center justify-center">
              <Text className="text-3xl font-bold text-foreground">
                {details.is_completed ? "Po" : "Jo"}
              </Text>
              <Text className="text-sm text-muted-foreground mt-1">
                Përfunduar
              </Text>
            </View>
          </View>

          {/* Retake Button Placeholder */}
          <Pressable
            className="bg-primary p-4 rounded-xl items-center justify-center active:opacity-90 mt-2"
            onPress={() =>
              alert("Funksionaliteti për ritestim vjen së shpejti!")
            }
          >
            <Text className="text-primary-foreground font-bold text-lg">
              Retesto (Vjen Së Shpejti)
            </Text>
          </Pressable>

          {/* Questions List */}
          <View className="mt-4">
            <Text className="text-xl font-bold text-foreground mb-4">
              Pyetjet dhe Përgjigjet
            </Text>
            <View className="gap-4">
              {details.answers.map((item: any, index: number) => {
                const q = item.question;
                const a = item.userAnswer;
                return (
                  <View
                    key={index}
                    className="bg-card p-4 rounded-2xl border border-border"
                  >
                    <Text className="text-foreground font-medium text-lg">
                      {index + 1}. {q.question_text}
                    </Text>

                    <View className="mt-4 gap-2">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-muted-foreground">
                          Zgjedhja juaj:
                        </Text>
                        <View className="flex-row items-center gap-2">
                          <Text
                            className={`font-bold ${a.is_correct ? "text-green-500" : "text-red-500"}`}
                          >
                            Opsioni{" "}
                            {a.selected_option || "I Përgjigjur (Zbrazët)"}
                          </Text>
                          <Ionicons
                            name={
                              a.is_correct ? "checkmark-circle" : "close-circle"
                            }
                            size={20}
                            color={a.is_correct ? "#22c55e" : "#ef4444"}
                          />
                        </View>
                      </View>

                      {!a.is_correct && (
                        <View className="flex-row items-center justify-between mt-1 pt-2 border-t border-border">
                          <Text className="text-muted-foreground">
                            Përgjigjja e saktë:
                          </Text>
                          <Text className="font-bold text-green-500">
                            Opsioni {a.correct_option}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import { useDrizzle } from "@/hooks/useDrizzle";
import { formatDate, truncateString } from "@/lib/utils";
import {
  getOverallStatistics,
  getTestSessionsSimple,
} from "@/services/db/history";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function History() {
  const { drizzleDb } = useDrizzle();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalTests: 0,
    averageScore: 0,
    totalTimeSpentSeconds: 0,
    accuracyRate: 0,
    correctAnswers: 0,
    totalAnswers: 0,
  });
  const [sessions, setSessions] = useState<
    Awaited<ReturnType<typeof getTestSessionsSimple>>
  >([]);

  const fetchData = useCallback(async () => {
    const s = await getOverallStatistics(drizzleDb);
    const sess = await getTestSessionsSimple(drizzleDb);
    setStats(s);
    setSessions(sess);
  }, [drizzleDb]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s}s`;
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="px-4 pt-4 pb-8 space-y-6 gap-6">
          {/* Statistics Grid */}
          <View>
            <Text className="text-xl font-bold text-foreground mb-4">
              Statistikat e Përgjithshme
            </Text>
            <View className="flex-row flex-wrap justify-between gap-y-4">
              <View className="w-[48%] bg-card p-4 rounded-2xl border border-border items-center justify-center">
                <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mb-2">
                  <Ionicons
                    name="document-text"
                    size={20}
                    className="text-primary"
                    color="gray"
                  />
                </View>
                <Text className="text-2xl font-bold text-foreground">
                  {stats.totalTests}
                </Text>
                <Text className="text-sm text-muted-foreground mt-1">
                  Teste Total
                </Text>
              </View>

              <View className="w-[48%] bg-card p-4 rounded-2xl border border-border items-center justify-center">
                <View className="w-10 h-10 rounded-full bg-green-500/20 items-center justify-center mb-2">
                  <Ionicons name="analytics" size={20} color="#22c55e" />
                </View>
                <Text className="text-2xl font-bold text-foreground">
                  {(stats.accuracyRate * 100).toFixed(1)}%
                </Text>
                <Text className="text-sm text-muted-foreground mt-1">
                  Saktësia
                </Text>
              </View>

              <View className="w-[48%] bg-card p-4 rounded-2xl border border-border items-center justify-center">
                <View className="w-10 h-10 rounded-full bg-amber-500/20 items-center justify-center mb-2">
                  <Ionicons name="time" size={20} color="#f59e0b" />
                </View>
                <Text className="text-2xl font-bold text-foreground">
                  {formatTime(stats.totalTimeSpentSeconds)}
                </Text>
                <Text className="text-sm text-muted-foreground text-center mt-1">
                  Koha e Harxhuar
                </Text>
              </View>

              <View className="w-[48%] bg-card p-4 rounded-2xl border border-border items-center justify-center">
                <View className="w-10 h-10 rounded-full bg-purple-500/20 items-center justify-center mb-2">
                  <Ionicons name="checkmark-circle" size={20} color="#a855f7" />
                </View>
                <Text className="text-2xl font-bold text-foreground">
                  {stats.averageScore.toFixed(0)}
                </Text>
                <Text className="text-sm text-muted-foreground mt-1 text-center">
                  Pikët Mesatare
                </Text>
              </View>
            </View>
          </View>

          {/* Mistakes Hub CTA */}
          <Pressable
            onPress={() => router.push("/history/mistakes")}
            className="bg-destructive/10 border border-destructive/20 p-5 rounded-2xl flex-row items-center justify-between active:opacity-70 mt-2"
          >
            <View className="flex-row items-center gap-4 flex-1">
              <View className="w-12 h-12 rounded-full bg-destructive/20 items-center justify-center">
                <Ionicons
                  name="close-circle"
                  size={24}
                  className="text-destructive"
                  color="#ef4444"
                />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-foreground">
                  Rishiko Gabimet
                </Text>
                <Text className="text-sm text-muted-foreground mt-1">
                  {stats.totalAnswers - stats.correctAnswers} gabime në total.
                  Klijo këtu për t'i parë dhe testuar.
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="gray" />
          </Pressable>

          {/* Recent Tests List */}
          <View className="mt-4">
            <Text className="text-xl font-bold text-foreground mb-4">
              Testet e Mëparshme
            </Text>
            {sessions.length === 0 ? (
              <Text className="text-muted-foreground">
                Nuk keni plotësuar asnjë test ende.
              </Text>
            ) : (
              <View className="gap-3">
                {sessions.map((test) => (
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/history/test/[id]",
                        params: {
                          id: test.id.toString(),
                        },
                      })
                    }
                    key={test.id}
                    className="w-full bg-card rounded-2xl border border-border p-4 flex-row justify-between items-center active:opacity-70"
                  >
                    <View className="flex-1 pr-4">
                      <Text className="text-lg font-semibold text-foreground">
                        {test.test_type === "focus"
                          ? "Test i Fokusuar"
                          : "Model Testi"}{" "}
                        #{test.id}
                      </Text>
                      <Text className="text-sm text-muted-foreground mt-1">
                        {formatDate(test.createdAt)}
                        {test.topic ? ` • ${truncateString(test.topic, 20)}` : ""}
                      </Text>
                    </View>
                    <View
                      className={`py-2 px-3 rounded-xl ${
                        (test.score / test.total_questions) * 100 < 60
                          ? "bg-red-500/10"
                          : (test.score / test.total_questions) * 100 < 80
                            ? "bg-yellow-500/10"
                            : "bg-green-500/10"
                      }`}
                    >
                      <Text
                        className={`font-bold ${
                          (test.score / test.total_questions) * 100 < 60
                            ? "text-red-500"
                            : (test.score / test.total_questions) * 100 < 80
                              ? "text-yellow-500"
                              : "text-green-500"
                        }`}
                      >
                        {test.score}/{test.total_questions}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

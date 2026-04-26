import { useDrizzle } from "@/hooks/useDrizzle";
import { formatDate, truncateString } from "@/lib/utils";
import { testSessions } from "@/services/db/schema";
import { getRecentTests } from "@/services/db/testSessions";
import { InferSelectModel } from "drizzle-orm";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";

const RecentTestList = () => {
  const { drizzleDb } = useDrizzle();

  const [refreshing, setRefreshing] = useState(false);
  const [recentTests, setRecentTests] = useState<
    InferSelectModel<typeof testSessions>[] | undefined
  >();
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchTests = useCallback(async () => {
    try {
      const response = await getRecentTests(drizzleDb, 3);
      setRecentTests(response);
      setLoadError(null);
    } catch (error: unknown) {
      setRecentTests([]);
      setLoadError(error instanceof Error ? error.message : String(error));
    }
  }, [drizzleDb]);

  useFocusEffect(
    useCallback(() => {
      fetchTests();
    }, [fetchTests]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTests();
    setRefreshing(false);
  }, [fetchTests]);

  if (loadError) {
    return (
      <Text className="text-muted-foreground">
        Test history is unavailable on this web preview. ({loadError})
      </Text>
    );
  }

  if (!recentTests || recentTests.length === 0) {
    return (
      <Text className="text-muted-foreground">
        Nuk keni plotesuar asnje test
      </Text>
    );
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="w-full gap-4 mt-4">
        {recentTests.map((test) => (
          <View
            className="w-full bg-card rounded-lg border border-border p-4 flex-row justify-between items-center"
            key={test.id}
          >
            <View>
              <Text className="text-lg font-medium text-card-foreground">
                Model Testi #{test.id}
              </Text>
              <Text className="text-sm text-muted-foreground w-64">
                {formatDate(test.createdAt)} -{" "}
                {truncateString(test.topic || "", 20)}
              </Text>
            </View>
            <View
              className={`py-2 px-3 rounded-lg ${
                (test.score / test.total_questions) * 100 < 60
                  ? "bg-red-400/40"
                  : (test.score / test.total_questions) * 100 < 80
                    ? "bg-yellow-400/40"
                    : "bg-green-400/40"
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
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default RecentTestList;

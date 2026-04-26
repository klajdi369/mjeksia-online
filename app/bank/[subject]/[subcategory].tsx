import { BankHeader } from "@/components/BankHeader";
import { QuestionCard } from "@/components/QuestionCard";
import { getThemeColor } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useDrizzle } from "@/hooks/useDrizzle";
import { questions as questionsSchema } from "@/services/db/schema";
import Ionicons from "@expo/vector-icons/Ionicons";
import { eq, InferSelectModel } from "drizzle-orm";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";

export default function BankQuestions() {
  const router = useRouter();
  const { scheme, theme } = useAppTheme();
  const { subject, subcategory } = useLocalSearchParams<{
    subject: string;
    subcategory: string;
  }>();
  const { drizzleDb } = useDrizzle();

  const [questions, setQuestions] = useState<
    InferSelectModel<typeof questionsSchema>[]
  >([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchQuestionsFor = useCallback(
    async (examTitle: string) => {
      if (!drizzleDb) return;

      setIsLoading(true);
      try {
        const result = await drizzleDb
          .select()
          .from(questionsSchema)
          .where(eq(questionsSchema.exam_title, examTitle));
        const normalized = result.filter(
          (item): item is InferSelectModel<typeof questionsSchema> =>
            item != null && typeof item.id === "number",
        );
        setQuestions(normalized);
      } catch (e) {
        console.error("Failed to load questions", e);
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [drizzleDb],
  );

  useEffect(() => {
    if (subcategory) {
      // subcategory strings correspond to `exam_title` in the DB
      fetchQuestionsFor(subcategory);
    }
  }, [subcategory, fetchQuestionsFor]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (subcategory) {
      await fetchQuestionsFor(subcategory);
    }
    setRefreshing(false);
  }, [subcategory, fetchQuestionsFor]);

  const startFocusedTest = (scope: {
    subject?: string | null;
    subcategory?: string | null;
  }) => {
    router.push({
      pathname: "/focus-test",
      params: {
        subject: scope.subject || "",
        subcategory: scope.subcategory || "",
      },
    });
  };

  if (!subject || !subcategory) return null;

  return (
    <View className="flex-1 bg-background">
      <BankHeader
        title={subcategory}
        subtitle={subject}
        onBack={() => {
          router.back();
        }}
        onFocusStart={() =>
          startFocusedTest({
            subject,
            subcategory,
          })
        }
        showFocusButton
      />

      <View className="flex-1 w-full px-5">
        <View className="bg-secondary p-5 rounded-3xl mb-4 flex-row items-center justify-between border border-border">
          <View className="flex-1">
            <Text className="text-3xl font-black text-secondary-foreground">
              {isLoading ? "..." : questions.length}
            </Text>
            <Text className="text-muted-foreground font-medium text-base mt-1">
              Pyetje në total
            </Text>
          </View>
          <View className="w-16 h-16 rounded-2xl bg-background items-center justify-center rotate-3 border border-border">
            <Ionicons
              name="document-text"
              size={32}
              color={getThemeColor("--info", scheme, theme)}
            />
          </View>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center py-16">
            <ActivityIndicator
              size="large"
              color={getThemeColor("--info", scheme, theme)}
            />
            <Text className="text-muted-foreground font-medium mt-4">
              Duke ngarkuar pyetjet...
            </Text>
          </View>
        ) : questions.length === 0 ? (
          <View className="items-center justify-center py-16">
            <View className="w-20 h-20 rounded-full bg-secondary items-center justify-center mb-6">
              <Ionicons name="search" size={40} color="#a1a1aa" />
            </View>
            <Text className="text-secondary-foreground font-bold text-xl mb-2">
              Nuk u gjetën pyetje
            </Text>
            <Text className="text-muted-foreground text-center px-4">
              Nuk ka pyetje të disponueshme për këtë nën-kategori aktualisht.
            </Text>
          </View>
        ) : (
          <FlatList
            data={questions}
            keyExtractor={(item, index) =>
              item?.id != null ? String(item.id) : `question-${index}`
            }
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{ paddingBottom: 40, gap: 16 }}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            renderItem={({ item: q, index }) => (
              <QuestionCard
                question={q}
                index={index}
                onPress={() => {
                  if (q?.id == null) return;
                  router.push({
                    pathname: "/bank/[subject]/[subcategory]/[questionId]",
                    params: {
                      subject,
                      subcategory,
                      questionId: String(q.id),
                    },
                  });
                }}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}

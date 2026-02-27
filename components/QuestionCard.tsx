import { getThemeColor } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { questions as questionsSchema } from "@/services/db/schema";
import Ionicons from "@expo/vector-icons/Ionicons";
import { InferSelectModel } from "drizzle-orm";
import React from "react";
import { Text, View } from "react-native";

interface QuestionCardProps {
  question: InferSelectModel<typeof questionsSchema>;
  index: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
}) => {
  const { theme } = useAppTheme();

  const accentForegroundColor = getThemeColor("--accent-foreground", theme);
  return (
    <View className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
      <View className="bg-secondary/60 px-5 py-3 flex-row items-center justify-between border-b border-border/50">
        <View className="flex-row items-center">
          <View className="w-7 h-7 rounded-full bg-background items-center justify-center mr-3 border border-border">
            <Text className="text-xs font-bold text-foreground">
              {index + 1}
            </Text>
          </View>
          <Text className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Pyetja #{question.id}
          </Text>
        </View>
        <View className="flex-row items-center">
          {(question.image || question.table_content) && (
            <View className="flex-row items-center bg-accent/80 px-2 py-1 rounded-md border border-accent mr-2">
              {question.image && (
                <Ionicons
                  name="image-outline"
                  size={12}
                  color={accentForegroundColor}
                  style={{ marginRight: 4 }}
                />
              )}
              {question.table_content && (
                <Ionicons
                  name="grid-outline"
                  size={12}
                  color={accentForegroundColor}
                  style={{ marginRight: 4 }}
                />
              )}
              <Text className="text-[10px] font-bold text-accent-foreground uppercase">
                {question.image && question.table_content
                  ? "Imazh & Tabelë"
                  : question.image
                    ? "Imazh"
                    : "Tabelë"}
              </Text>
            </View>
          )}
          <Ionicons name="help-circle" size={18} color="#a1a1aa" />
        </View>
      </View>
      <View className="p-5">
        <Text className="text-base text-foreground font-medium leading-relaxed">
          {question.question_text}
        </Text>
      </View>
    </View>
  );
};

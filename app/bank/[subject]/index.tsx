import { BankHeader } from "@/components/BankHeader";
import { SubcategoryCard } from "@/components/SubcategoryCard";
import { CATEGORIES } from "@/constants/categories";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";

export default function BankSubcategories() {
  const router = useRouter();
  const { subject } = useLocalSearchParams<{ subject: string }>();

  if (!subject || !CATEGORIES[subject]) return null;

  const startFocusedTest = (scope: {
    subject?: string | null;
    subcategory?: string | null;
  }) => {
    router.push({
      pathname: "/focus-test",
      params: {
        subject: scope.subject || "",
      },
    });
  };

  return (
    <View className="flex-1 bg-background">
      <BankHeader
        title={subject}
        subtitle={`${CATEGORIES[subject].length} nën-kategori`}
        onBack={() => router.back()}
        onFocusStart={() => startFocusedTest({ subject })}
        showFocusButton
      />

      <ScrollView
        className="w-full flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        {CATEGORIES[subject].map((sub, index) => (
          <SubcategoryCard
            key={sub}
            subcategory={sub}
            index={index}
            onPress={() => {
              router.push({
                pathname: "/bank/[subject]/[subcategory]",
                params: { subject, subcategory: sub },
              });
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

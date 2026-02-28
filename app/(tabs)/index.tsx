import RecentTestList from "@/components/RecentTestList";
import { useDrizzle } from "@/hooks/useDrizzle";
import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  const { migrationError, migrationSuccess } = useDrizzle();

  if (migrationError) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-lg text-foreground">
          Migration error: {migrationError.message}
        </Text>
      </View>
    );
  }

  if (!migrationSuccess) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-lg text-foreground">Updating...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background p-6">
      <View>
        <Link
          href="/arena"
          className="bg-primary p-4 w-full rounded-lg active:bg-primary/90"
        >
          <Text className="font-semibold text-lg text-primary-foreground">
            Pyetje te Cfaredoshme
          </Text>
        </Link>
        <View className="mt-4 flex flex-row gap-4">
          <Link
            href="/test"
            className="border border-border p-4 w-[48%] rounded-lg active:bg-secondary"
          >
            <Text className="text-foreground font-semibold text-lg">
              Model Testi
            </Text>
          </Link>
          <Link
            href="/bank"
            className="border border-border p-4 w-[48%] rounded-lg active:bg-secondary"
          >
            <Text className="text-foreground font-semibold text-lg">
              Fondi i pyetjeve
            </Text>
          </Link>
        </View>
      </View>
      <View className="mt-12">
        <Text className="text-foreground text-xl font-semibold">
          Historia e Testeve
        </Text>
        <RecentTestList />
      </View>
    </View>
  );
}

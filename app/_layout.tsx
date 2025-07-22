import "react-native-reanimated";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/useColorScheme";
import { useDatabase } from "@/hooks/useDatabase";
import { useNotifications } from "@/hooks/useNotifications";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isDBLoading } = useDatabase();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useNotifications();

  if (isDBLoading) {
    // DB初期化中はローディング画面などを表示しても良い
    return null;
  }

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="SubjectDetail"
            options={{
              title: "授業詳細",
              headerBackTitle: "戻る",
            }}
          />
          <Stack.Screen
            name="SubjectEdit"
            options={{ title: "編集", headerBackTitle: "戻る" }}
          />
          <Stack.Screen
            name="QRCodeScreen"
            options={{ title: "QRコード", presentation: "modal" }}
          />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

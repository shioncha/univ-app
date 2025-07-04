import "react-native-reanimated";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { useColorScheme } from "@/hooks/useColorScheme";
import { useDatabase } from "@/hooks/useDatabase";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isDBLoading } = useDatabase();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (isDBLoading) {
    // DB初期化中はローディング画面などを表示しても良い
    return null;
  }

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen
          name="SubjectDetail"
          options={{
            title: "授業詳細",
            headerBackTitle: "戻る",
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

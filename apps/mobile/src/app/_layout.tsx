import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { colors } from "@/theme";

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          animation: "slide_from_right",
          contentStyle: { backgroundColor: colors.background },
          headerBackButtonDisplayMode: "minimal",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="document/upload"
          options={{ title: "Hocam Şunu Anlat" }}
        />
        <Stack.Screen
          name="quick-study/index"
          options={{ title: "Sınava Az Kaldı" }}
        />
        <Stack.Screen
          name="exams/index"
          options={{ title: "Sınava Hazırlan" }}
        />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

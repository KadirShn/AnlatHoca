import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AppBootstrapProvider } from "@/providers/app-bootstrap-provider";
import { colors } from "@/theme";

export default function RootLayout() {
  return (
    <AppBootstrapProvider>
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
          name="document/ready"
          options={{ title: "Belge Hazır" }}
        />
        <Stack.Screen
          name="document/[documentId]/analysis"
          options={{ title: "Belge Analizi" }}
        />
        <Stack.Screen
          name="document/[documentId]/lesson/new"
          options={{ title: "Ne kadar vaktin var?" }}
        />
        <Stack.Screen
          name="lesson/[lessonId]"
          options={{ title: "Ders" }}
        />
        <Stack.Screen
          name="lesson/[lessonId]/presentation"
          options={{ headerShown: false, title: "Sunum Modu" }}
        />
        <Stack.Screen
          name="lesson/[lessonId]/quiz"
          options={{ title: "Beni Sına" }}
        />
        <Stack.Screen
          name="lesson/[lessonId]/teacher"
          options={{ title: "Hocaya Sor" }}
        />
        <Stack.Screen
          name="quiz/[attemptId]/result"
          options={{ title: "Quiz Sonucu" }}
        />
        <Stack.Screen
          name="quick-study/index"
          options={{ title: "Sınava Az Kaldı" }}
        />
        <Stack.Screen
          name="exams/index"
          options={{ title: "Sınava Hazırlan" }}
        />
        <Stack.Screen
          name="exams/[examId]"
          options={{ title: "Sınav Paketi" }}
        />
        <Stack.Screen
          name="exams/[examId]/[subjectId]/index"
          options={{ title: "Geçmiş Sınav Verileri" }}
        />
        <Stack.Screen
          name="exams/[examId]/[subjectId]/plan"
          options={{ title: "Ne kadar vaktin var?" }}
        />
        <Stack.Screen
          name="settings/privacy"
          options={{ title: "Gizlilik ve Veriler" }}
        />
      </Stack>
      <StatusBar style="dark" />
    </AppBootstrapProvider>
  );
}

import Ionicons from "@expo/vector-icons/Ionicons";
import {
  documentIdSchema,
  type LessonDuration,
} from "@anlat-hoca/contracts";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ApiClientError, generateLesson } from "@/api";
import {
  AppButton,
  AppText,
  InlineMessage,
  OwlLoader,
  ScreenContainer,
} from "@/components";
import { useAppBootstrap } from "@/providers/app-bootstrap-provider";
import { getOrCreateInstallationId } from "@/services/installation/installation-id";
import { colors, radius, spacing } from "@/theme";

const options: {
  duration: LessonDuration;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    duration: 10,
    label: "Acil tekrar",
    description: "En önemli konulara hızlıca odaklan.",
    icon: "flash-outline",
  },
  {
    duration: 30,
    label: "Dengeli",
    description: "Ana konuları anlaşılır bir akışla çalış.",
    icon: "options-outline",
  },
  {
    duration: 60,
    label: "Detaylı",
    description: "Konuları daha kapsamlı şekilde öğren.",
    icon: "book-outline",
  },
];

export function LessonDurationScreen() {
  const { documentId } = useLocalSearchParams<{
    documentId?: string | string[];
  }>();
  const { state: bootstrapState } = useAppBootstrap();
  const routeDocumentId = Array.isArray(documentId) ? undefined : documentId;
  const documentResult = documentIdSchema.safeParse(routeDocumentId);
  const [selectedDuration, setSelectedDuration] =
    useState<LessonDuration | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!documentResult.success || !selectedDuration || isGenerating) {
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const installationId =
        bootstrapState.status === "ready"
          ? bootstrapState.session.installationId
          : await getOrCreateInstallationId();
      const response = await generateLesson({
        installationId,
        documentId: documentResult.data,
        durationMinutes: selectedDuration,
      });

      router.replace({
        pathname: "/lesson/[lessonId]",
        params: { lessonId: response.lesson.id },
      });
    } catch (error) {
      setErrorMessage(getGenerationErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  };

  if (!documentResult.success) {
    return (
      <ScreenContainer
        contentContainerStyle={styles.centered}
        edges={["left", "right", "bottom"]}
      >
        <InlineMessage
          message="Ders oluşturmak için geçerli bir belge bulunamadı."
          tone="danger"
        />
        <AppButton
          label="PDF Yüklemeye Dön"
          onPress={() => router.replace("/document/upload")}
          variant="secondary"
        />
      </ScreenContainer>
    );
  }

  if (isGenerating) {
    return (
      <ScreenContainer contentContainerStyle={styles.centered} edges={["left", "right", "bottom"]}>
        <OwlLoader size="large" accessibilityLabel="Ders hazırlanıyor" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["left", "right", "bottom"]}>
      <View style={styles.intro}>
        <AppText variant="heading2">Çalışma süreni seç</AppText>
        <AppText tone="muted">
          Anlat Hoca içeriği seçtiğin süreye göre önceliklendirecek.
        </AppText>
      </View>

      <View accessibilityRole="radiogroup" style={styles.options}>
        {options.map((option) => {
          const selected = selectedDuration === option.duration;

          return (
            <Pressable
              accessibilityLabel={`${option.duration} dakika, ${option.label}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled: isGenerating }}
              disabled={isGenerating}
              key={option.duration}
              onPress={() => {
                setSelectedDuration(option.duration);
                setErrorMessage(null);
              }}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.optionPressed,
                isGenerating && styles.optionDisabled,
              ]}
            >
              <View
                style={[
                  styles.optionIcon,
                  selected && styles.optionIconSelected,
                ]}
              >
                <Ionicons
                  color={selected ? colors.textOnPrimary : colors.primary}
                  name={option.icon}
                  size={24}
                />
              </View>
              <View style={styles.optionCopy}>
                <AppText variant="heading3">{option.duration} dakika</AppText>
                <AppText tone="primary" variant="bodyMedium">
                  {option.label}
                </AppText>
                <AppText tone="muted">{option.description}</AppText>
              </View>
              <Ionicons
                color={selected ? colors.primary : colors.borderStrong}
                name={selected ? "checkmark-circle" : "ellipse-outline"}
                size={26}
              />
            </Pressable>
          );
        })}
      </View>


      {errorMessage ? (
        <InlineMessage message={errorMessage} tone="danger" />
      ) : null}

      <AppButton
        accessibilityLabel="Seçilen süreye göre dersi hazırla"
        disabled={!selectedDuration}
        label={isGenerating ? "Ders hazırlanıyor..." : "Dersi Hazırla"}
        loading={isGenerating}
        onPress={() => void handleGenerate()}
      />
    </ScreenContainer>
  );
}

function getGenerationErrorMessage(error: unknown): string {
  if (!(error instanceof ApiClientError)) {
    return "Ders şu anda oluşturulamadı. Tekrar deneyebilirsin.";
  }

  if (error.kind === "network") {
    return "Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.";
  }

  if (error.kind === "timeout") {
    return "Dersin hazırlanması beklenenden uzun sürdü. Tekrar deneyebilirsin.";
  }

  if (error.kind === "configuration") {
    return "Çevrimiçi hizmete şu anda ulaşılamıyor.";
  }

  switch (error.serverCode) {
    case "DOCUMENT_NOT_FOUND":
      return "Belge bulunamadı. PDF'yi yeniden seçebilirsin.";
    case "DOCUMENT_EXPIRED":
      return "Bu belgenin geçici analiz süresi dolmuş. PDF'yi yeniden yükle.";
    case "ANALYSIS_REQUIRED":
      return "Ders oluşturmadan önce belgeyi analiz etmelisin.";
    case "LESSON_IN_PROGRESS":
      return "Bu ders zaten hazırlanıyor. Biraz sonra tekrar deneyebilirsin.";
    case "INVALID_LESSON_DURATION":
      return "Çalışma süresi 10, 30 veya 60 dakika olmalıdır.";
    case "AI_NOT_CONFIGURED":
      return "Ders oluşturma hizmeti şu anda kullanılamıyor.";
    case "LESSON_GENERATION_FAILED":
    case "UPSTREAM_ERROR":
      return "Ders şu anda oluşturulamadı. Tekrar deneyebilirsin.";
    default:
      return "Ders şu anda oluşturulamadı. Tekrar deneyebilirsin.";
  }
}

const styles = StyleSheet.create({
  centered: {
    flexGrow: 1,
    justifyContent: "center",
  },
  intro: {
    gap: spacing.sm,
  },
  options: {
    gap: spacing.md,
  },
  option: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 116,
    padding: spacing.xl,
  },
  optionSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  optionPressed: {
    opacity: 0.76,
  },
  optionDisabled: {
    opacity: 0.72,
  },
  optionIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  optionIconSelected: {
    backgroundColor: colors.primary,
  },
  optionCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  generationCard: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderCurve: "continuous",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
  },
  generationCopy: {
    flex: 1,
    gap: spacing.xs,
  },
});

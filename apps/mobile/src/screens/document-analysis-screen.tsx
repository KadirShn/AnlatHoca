import Ionicons from "@expo/vector-icons/Ionicons";
import {
  documentIdSchema,
  type DocumentAnalysis,
} from "@anlat-hoca/contracts";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { ApiClientError, getDocumentAnalysis } from "@/api";
import {
  AnalysisTopicCard,
  AppButton,
  AppText,
  InlineMessage,
  ScreenContainer,
} from "@/components";
import { getOrCreateInstallationId } from "@/services/installation/installation-id";
import { colors, radius, spacing } from "@/theme";

type AnalysisScreenState =
  | { status: "loading" }
  | { status: "success"; analysis: DocumentAnalysis }
  | { status: "error"; message: string };

export function DocumentAnalysisScreen() {
  const { documentId } = useLocalSearchParams<{
    documentId?: string | string[];
  }>();
  const routeDocumentId = Array.isArray(documentId) ? undefined : documentId;
  const documentResult = documentIdSchema.safeParse(routeDocumentId);
  const validDocumentId = documentResult.success ? documentResult.data : null;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<AnalysisScreenState>({
    status: "loading",
  });

  useEffect(() => {
    let active = true;

    if (!validDocumentId) {
      return () => {
        active = false;
      };
    }

    void getOrCreateInstallationId()
      .then((installationId) =>
        getDocumentAnalysis({
          documentId: validDocumentId,
          installationId,
        }),
      )
      .then((response) => {
        if (active) {
          setState({
            status: "success",
            analysis: response.analysis,
          });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            status: "error",
            message: getReadErrorMessage(error),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [attempt, validDocumentId]);

  const screenState: AnalysisScreenState = validDocumentId
    ? state
    : {
        status: "error",
        message: "Belge analizi için geçerli bir belge bulunamadı.",
      };

  if (screenState.status === "loading") {
    return (
      <ScreenContainer
        contentContainerStyle={styles.centered}
        edges={["left", "right", "bottom"]}
      >
        <ActivityIndicator color={colors.primary} size="large" />
        <View style={styles.centerCopy}>
          <AppText variant="heading3">Analiz yükleniyor</AppText>
          <AppText tone="muted">
            Kaydedilmiş belge analizi hazırlanıyor.
          </AppText>
        </View>
      </ScreenContainer>
    );
  }

  if (screenState.status === "error") {
    return (
      <ScreenContainer
        contentContainerStyle={styles.centered}
        edges={["left", "right", "bottom"]}
      >
        <View style={styles.errorIcon}>
          <Ionicons
            color={colors.danger}
            name="document-text-outline"
            size={38}
          />
        </View>
        <AppText style={styles.centerText} variant="heading3">
          Analiz gösterilemedi
        </AppText>
        <InlineMessage message={screenState.message} tone="danger" />
        {validDocumentId ? (
          <AppButton
            label="Tekrar Dene"
            onPress={() => {
              setState({ status: "loading" });
              setAttempt((current) => current + 1);
            }}
          />
        ) : null}
        <AppButton
          label="PDF Yüklemeye Dön"
          onPress={() => router.replace("/document/upload")}
          variant="secondary"
        />
      </ScreenContainer>
    );
  }

  const { analysis } = screenState;

  return (
    <ScreenContainer edges={["left", "right", "bottom"]}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons
            color={colors.primary}
            name="document-text-outline"
            size={28}
          />
        </View>
        <View style={styles.heroCopy}>
          <AppText selectable variant="heading1">
            {analysis.title}
          </AppText>
          <AppText tone="primary" variant="bodyMedium">
            Belge Analizi
          </AppText>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <AppText variant="heading3">Kısa özet</AppText>
        <AppText selectable tone="muted" style={styles.summary}>
          {analysis.summary}
        </AppText>
      </View>

      <View style={styles.topicHeader}>
        <View style={styles.topicCount}>
          <Ionicons color={colors.primary} name="layers-outline" size={19} />
          <AppText variant="bodyMedium">
            {analysis.topics.length} konu bulundu
          </AppText>
        </View>
        <AppText selectable tone="muted" variant="caption">
          Önem seviyesi, konunun bu belge içindeki ağırlığını gösterir; sınavda
          çıkma olasılığı değildir.
        </AppText>
      </View>

      <View style={styles.topics}>
        {analysis.topics.map((topic, index) => (
          <AnalysisTopicCard
            index={index}
            key={index}
            topic={topic}
          />
        ))}
      </View>

      <View style={styles.lessonCta}>
        <View style={styles.lessonCtaHeading}>
          <View style={styles.lessonCtaIcon}>
            <Ionicons color={colors.primary} name="school-outline" size={25} />
          </View>
          <View style={styles.lessonCtaCopy}>
            <AppText variant="heading2">Bu belgeyle çalış</AppText>
            <AppText tone="muted">
              Konuları ayırabildiğin süreye göre gerçek bir derse dönüştür.
            </AppText>
          </View>
        </View>
        <AppButton
          accessibilityLabel="Bu belge için ders oluştur"
          label="Ders Oluştur"
          leftIcon={
            <Ionicons color={colors.textOnPrimary} name="sparkles" size={20} />
          }
          onPress={() => {
            if (!validDocumentId) {
              return;
            }

            router.push({
              pathname: "/document/[documentId]/lesson/new",
              params: { documentId: validDocumentId },
            });
          }}
        />
      </View>
    </ScreenContainer>
  );
}

function getReadErrorMessage(error: unknown): string {
  if (!(error instanceof ApiClientError)) {
    return "Kaydedilmiş analiz şu anda gösterilemiyor.";
  }

  if (error.kind === "network") {
    return "Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.";
  }

  if (error.kind === "timeout") {
    return "Analizin yüklenmesi beklenenden uzun sürdü.";
  }

  if (error.serverCode === "DOCUMENT_NOT_FOUND") {
    return "Belge bulunamadı. PDF'yi yeniden seçebilirsin.";
  }

  if (error.serverCode === "ANALYSIS_NOT_FOUND") {
    return "Bu belgeye ait tamamlanmış bir analiz bulunamadı.";
  }

  return "Kaydedilmiş analiz şu anda gösterilemiyor.";
}

const styles = StyleSheet.create({
  centered: {
    flexGrow: 1,
    justifyContent: "center",
  },
  centerCopy: {
    alignItems: "center",
    gap: spacing.sm,
  },
  centerText: {
    textAlign: "center",
  },
  errorIcon: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.full,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  hero: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  heroCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
  },
  summary: {
    lineHeight: 24,
  },
  topicHeader: {
    gap: spacing.sm,
  },
  topicCount: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  topics: {
    gap: spacing.lg,
  },
  lessonCta: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xl,
    padding: spacing.xl,
  },
  lessonCtaHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  lessonCtaIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  lessonCtaCopy: {
    flex: 1,
    gap: spacing.xs,
  },
});

import Ionicons from "@expo/vector-icons/Ionicons";
import { documentIdSchema } from "@anlat-hoca/contracts";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import {
  analyzeDocument,
  ApiClientError,
} from "@/api";
import {
  AppButton,
  AppText,
  InlineMessage,
  ScreenContainer,
} from "@/components";
import { useAppBootstrap } from "@/providers/app-bootstrap-provider";
import { getOrCreateInstallationId } from "@/services/installation/installation-id";
import { colors, radius, spacing } from "@/theme";

export function DocumentReadyScreen() {
  const { documentId } = useLocalSearchParams<{ documentId?: string }>();
  const { state: bootstrapState } = useAppBootstrap();
  const documentResult = documentIdSchema.safeParse(documentId);
  const uploadConfirmed = documentResult.success;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!documentResult.success || isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const installationId =
        bootstrapState.status === "ready"
          ? bootstrapState.session.installationId
          : await getOrCreateInstallationId();
      await analyzeDocument({
        documentId: documentResult.data,
        installationId,
      });
      router.replace({
        pathname: "/document/[documentId]/analysis",
        params: { documentId: documentResult.data },
      });
    } catch (error) {
      setAnalysisError(getAnalysisErrorMessage(error));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <ScreenContainer
      contentContainerStyle={styles.content}
      edges={["left", "right", "bottom"]}
    >
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons color={colors.success} name="checkmark-circle" size={44} />
        </View>
        <View style={styles.copy}>
          <AppText variant="heading2" style={styles.centerText}>
            {uploadConfirmed ? "Belge hazır" : "Belge seçimi gerekli"}
          </AppText>
          <AppText selectable tone="muted" style={styles.centerText}>
            {uploadConfirmed
              ? "PDF başarıyla hazırlandı. Bir sonraki adımda içeriğini analiz edip çalışma konularını çıkaracağız."
              : "Bu belgeye ait geçerli bir yükleme bilgisi bulunamadı. Devam etmek için yeniden bir PDF seç."}
          </AppText>
        </View>
        {analysisError ? (
          <InlineMessage message={analysisError} tone="danger" />
        ) : null}
        {uploadConfirmed ? (
          <View style={styles.actions}>
            <AppButton
              accessibilityLabel="Belgeyi analiz et"
              label={isAnalyzing ? "Belge inceleniyor..." : "Belgeyi Analiz Et"}
              loading={isAnalyzing}
              onPress={() => void handleAnalyze()}
            />
            {isAnalyzing ? (
              <AppText
                accessibilityLiveRegion="polite"
                style={styles.centerText}
                tone="muted"
                variant="caption"
              >
                PDF inceleniyor ve çalışma konuları belirleniyor. Bu işlem
                biraz sürebilir.
              </AppText>
            ) : null}
            <AppButton
              accessibilityLabel="Belge seçimine geri dön"
              disabled={isAnalyzing}
              label="Başka Bir PDF Seç"
              onPress={() => router.replace("/document/upload")}
              variant="secondary"
            />
          </View>
        ) : (
          <AppButton
            accessibilityLabel="Belge seçimine geri dön"
            label="Belge Seçimine Dön"
            onPress={() => router.replace("/document/upload")}
            variant="secondary"
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.xl,
    padding: spacing.xxxl,
  },
  iconContainer: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: radius.full,
    height: 82,
    justifyContent: "center",
    width: 82,
  },
  copy: {
    gap: spacing.sm,
  },
  centerText: {
    textAlign: "center",
  },
  actions: {
    alignSelf: "stretch",
    gap: spacing.sm,
  },
});

function getAnalysisErrorMessage(error: unknown): string {
  if (!(error instanceof ApiClientError)) {
    return "Bu belge şu anda analiz edilemedi. Tekrar deneyebilirsin.";
  }

  if (error.kind === "network") {
    return "Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.";
  }

  if (error.kind === "timeout") {
    return "Belge analizi beklenenden uzun sürdü. Tekrar deneyebilirsin.";
  }

  if (error.kind === "configuration") {
    return "Çevrim içi hizmete şu anda ulaşılamıyor.";
  }

  switch (error.serverCode) {
    case "DOCUMENT_NOT_FOUND":
      return "Belge bulunamadı. PDF'yi yeniden seçebilirsin.";
    case "DOCUMENT_EXPIRED":
      return "Bu belgenin geçici analiz süresi dolmuş. Lütfen PDF'yi yeniden yükle.";
    case "ANALYSIS_IN_PROGRESS":
      return "Bu belge zaten analiz ediliyor.";
    case "AI_NOT_CONFIGURED":
      return "Belge analiz hizmeti şu anda kullanılamıyor.";
    case "ANALYSIS_FAILED":
    case "UPSTREAM_ERROR":
      return "Bu belge şu anda analiz edilemedi. Tekrar deneyebilirsin.";
    default:
      return "Bu belge şu anda analiz edilemedi. Tekrar deneyebilirsin.";
  }
}

import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import {
  AppButton,
  AppText,
  DocumentPickerCard,
  InlineMessage,
  ScreenContainer,
  SelectedDocumentCard,
} from "@/components";
import { ApiClientError, uploadDocument } from "@/api";
import { useAppBootstrap } from "@/providers/app-bootstrap-provider";
import {
  pickPdfDocument,
  validateSelectedDocument,
  type SelectedDocument,
} from "@/services/documents";
import { getOrCreateInstallationId } from "@/services/installation/installation-id";
import { spacing } from "@/theme";

const PICKER_ERROR_MESSAGE =
  "Dosya seçici açılamadı. Lütfen tekrar deneyin.";

export function DocumentUploadScreen() {
  const { state: bootstrapState } = useAppBootstrap();
  const [selectedDocument, setSelectedDocument] =
    useState<SelectedDocument | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handlePick = async () => {
    if (isPicking || isUploading) {
      return;
    }

    setIsPicking(true);

    try {
      const result = await pickPdfDocument();

      if (result.status === "canceled") {
        return;
      }

      const validation = validateSelectedDocument(result.document);

      if (!validation.valid) {
        setSelectedDocument(null);
        setValidationError(validation.message);
        return;
      }

      setSelectedDocument(validation.document);
      setValidationError(null);
    } catch {
      setValidationError(PICKER_ERROR_MESSAGE);
    } finally {
      setIsPicking(false);
    }
  };

  const handleRemove = () => {
    setSelectedDocument(null);
    setValidationError(null);
  };

  const handleContinue = async () => {
    if (!selectedDocument || isPicking || isUploading) {
      return;
    }

    setIsUploading(true);
    setValidationError(null);

    try {
      const installationId =
        bootstrapState.status === "ready"
          ? bootstrapState.session.installationId
          : await getOrCreateInstallationId();
      const response = await uploadDocument({
        installationId,
        document: selectedDocument,
      });

      router.push({
        pathname: "/document/ready",
        params: { documentId: response.document.id },
      });
    } catch (error) {
      setValidationError(getUploadErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ScreenContainer edges={["left", "right", "bottom"]}>
      <View style={styles.intro}>
        <AppText variant="heading2">Notlarını derse dönüştür</AppText>
        <AppText tone="muted">
          Notlarını yükle, Anlat Hoca senin için çalışılabilir bir derse
          dönüştürsün.
        </AppText>
      </View>

      {selectedDocument ? (
        <SelectedDocumentCard
          document={selectedDocument}
          interactionDisabled={isPicking || isUploading}
          replaceLoading={isPicking}
          onRemove={handleRemove}
          onReplace={handlePick}
        />
      ) : (
        <DocumentPickerCard loading={isPicking} onPress={handlePick} />
      )}

      {validationError ? (
        <InlineMessage message={validationError} tone="danger" />
      ) : null}

      <InlineMessage message="Yüklediğin PDF, istediğin yapay zekâ özelliklerini oluşturmak için Anlat Hoca üzerinden Google'ın Gemini hizmetine gönderilir. Kişisel, gizli veya gereksiz hassas bilgiler içeren belgeleri yüklememeni öneririz. Orijinal PDF Anlat Hoca'nın veritabanında saklanmaz." />

      <View style={styles.footer}>
        <AppButton
          accessibilityLabel="Seçili PDF ile devam et"
          disabled={!selectedDocument || isPicking}
          label={isUploading ? "Belge hazırlanıyor..." : "Devam Et"}
          loading={isUploading}
          onPress={() => void handleContinue()}
        />
        {isUploading ? (
          <AppText
            accessibilityLiveRegion="polite"
            style={styles.footerCopy}
            tone="muted"
            variant="caption"
          >
            PDF güvenli şekilde aktarılıyor...
          </AppText>
        ) : null}
        <AppText
          selectable
          tone="muted"
          variant="caption"
          style={styles.footerCopy}
        >
          Yükleme otomatik olarak tekrarlanmaz; bir hata olursa yeniden
          deneyebilirsin.
        </AppText>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: spacing.sm,
  },
  footer: {
    gap: spacing.sm,
  },
  footerCopy: {
    textAlign: "center",
  },
});

function getUploadErrorMessage(error: unknown): string {
  if (!(error instanceof ApiClientError)) {
    return "Belge şu anda hazırlanamadı. Lütfen tekrar dene.";
  }

  if (error.kind === "network") {
    return "Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.";
  }

  if (error.kind === "timeout") {
    return "Belgenin gönderilmesi beklenenden uzun sürdü. Tekrar deneyebilirsin.";
  }

  if (error.kind === "configuration") {
    return "Çevrim içi hizmete şu anda ulaşılamıyor.";
  }

  switch (error.serverCode) {
    case "FILE_TOO_LARGE":
      return "Bu dosya 15 MB sınırını aşıyor.";
    case "UNSUPPORTED_FILE_TYPE":
      return "Şimdilik yalnızca PDF dosyaları destekleniyor.";
    case "INVALID_FILE":
      return "Bu PDF kullanılamıyor. Lütfen başka bir dosya seç.";
    case "AI_NOT_CONFIGURED":
      return "Belge işleme hizmeti şu anda kullanılamıyor.";
    case "UPSTREAM_ERROR":
      return "Belge şu anda hazırlanamadı. Lütfen tekrar dene.";
    default:
      return "Belge şu anda hazırlanamadı. Lütfen tekrar dene.";
  }
}

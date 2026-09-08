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
import {
  pickPdfDocument,
  validateSelectedDocument,
  type SelectedDocument,
} from "@/services/documents";
import { spacing } from "@/theme";

const PICKER_ERROR_MESSAGE =
  "Dosya seçici açılamadı. Lütfen tekrar deneyin.";

export function DocumentUploadScreen() {
  const [selectedDocument, setSelectedDocument] =
    useState<SelectedDocument | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);

  const handlePick = async () => {
    if (isPicking) {
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

  const handleContinue = () => {
    if (selectedDocument) {
      router.push("/document/ready");
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
          loading={isPicking}
          onRemove={handleRemove}
          onReplace={handlePick}
        />
      ) : (
        <DocumentPickerCard loading={isPicking} onPress={handlePick} />
      )}

      {validationError ? (
        <InlineMessage message={validationError} tone="danger" />
      ) : null}

      <InlineMessage message="Kişisel, gizli veya hassas bilgi içeren belgeleri yüklememeni öneririz. Bu adımda dosyan cihazında kalır; henüz yüklenmez veya analiz edilmez." />

      <View style={styles.footer}>
        <AppButton
          accessibilityLabel="Seçili PDF ile devam et"
          disabled={!selectedDocument || isPicking}
          label="Devam Et"
          onPress={handleContinue}
        />
        <AppText
          selectable
          tone="muted"
          variant="caption"
          style={styles.footerCopy}
        >
          Bir sonraki ekranda yalnızca seçimin hazır olduğu doğrulanır.
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

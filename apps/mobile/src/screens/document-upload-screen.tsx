import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";

import { AppButton, AppText, ScreenContainer } from "@/components";
import { colors, radius, spacing } from "@/theme";

export function DocumentUploadScreen() {
  return (
    <ScreenContainer edges={["left", "right", "bottom"]}>
      <View style={styles.intro}>
        <AppText variant="heading2">Notlarını derse dönüştür</AppText>
        <AppText tone="muted">
          PDF yükleme özelliği bir sonraki geliştirme adımında eklenecek.
        </AppText>
      </View>

      <View
        accessibilityLabel="PDF yükleme alanı, henüz kullanılamıyor"
        accessibilityRole="summary"
        style={styles.uploadArea}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            color={colors.primary}
            name="document-text-outline"
            size={36}
          />
        </View>
        <View style={styles.uploadCopy}>
          <AppText variant="heading3" style={styles.centerText}>
            PDF notunu buraya ekle
          </AppText>
          <AppText tone="muted" style={styles.centerText}>
            Dosya seçimi henüz etkin değil.
          </AppText>
        </View>
        <AppButton disabled label="PDF Seç — Yakında" />
      </View>

      <View style={styles.note}>
        <Ionicons
          color={colors.textMuted}
          name="information-circle-outline"
          size={22}
        />
        <AppText tone="muted" style={styles.noteText}>
          Dosya izni istenmez ve bu ekranda hiçbir belge yüklenmez.
        </AppText>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: spacing.sm,
  },
  uploadArea: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderCurve: "continuous",
    borderRadius: radius.xl,
    borderStyle: "dashed",
    borderWidth: 2,
    gap: spacing.lg,
    padding: spacing.xxxl,
  },
  iconContainer: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  uploadCopy: {
    gap: spacing.sm,
  },
  centerText: {
    textAlign: "center",
  },
  note: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  noteText: {
    flex: 1,
  },
});

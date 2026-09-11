import { OwlLoader } from "@/components/owl-loader";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, View } from "react-native";

import { PDF_SIZE_LIMIT_LABEL } from "@anlat-hoca/config";

import { colors, radius, spacing } from "@/theme";

import { AppText } from "./app-text";

interface DocumentPickerCardProps {
  loading: boolean;
  onPress: () => void;
}

export function DocumentPickerCard({
  loading,
  onPress,
}: DocumentPickerCardProps) {
  return (
    <Pressable
      accessibilityLabel="PDF dosyası seç"
      accessibilityHint={`${PDF_SIZE_LIMIT_LABEL}. Sistem dosya seçicisini açar.`}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: loading }}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && !loading && styles.pressed,
        loading && styles.loading,
      ]}
    >
      <View style={styles.iconContainer}>
        {loading ? (
          <OwlLoader color={colors.primary} decorative />
        ) : (
          <Ionicons
            color={colors.primary}
            name="document-text-outline"
            size={38}
          />
        )}
      </View>

      {!loading ? <View style={styles.copy}>
        <AppText variant="heading3" style={styles.centerText}>
          PDF Dosyası Seç
        </AppText>
        <AppText tone="muted" style={styles.centerText}>
          {PDF_SIZE_LIMIT_LABEL}
        </AppText>
      </View> : null}

      {!loading ? (
        <View style={styles.actionPill}>
          <Ionicons color={colors.primary} name="folder-open-outline" size={20} />
          <AppText tone="primary" variant="button">
            Dosyalara Göz At
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderCurve: "continuous",
    borderRadius: radius.xl,
    borderStyle: "dashed",
    borderWidth: 2,
    gap: spacing.lg,
    minHeight: 278,
    padding: spacing.xxxl,
  },
  pressed: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  loading: {
    opacity: 0.72,
  },
  iconContainer: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    height: 76,
    justifyContent: "center",
    width: 76,
  },
  copy: {
    gap: spacing.xs,
  },
  centerText: {
    textAlign: "center",
  },
  actionPill: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderCurve: "continuous",
    borderRadius: radius.full,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
});

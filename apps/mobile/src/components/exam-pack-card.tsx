import Ionicons from "@expo/vector-icons/Ionicons";
import type { ExamPackSummary } from "@anlat-hoca/contracts";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, radius, shadows, spacing } from "@/theme";

import { AppText } from "./app-text";

interface ExamPackCardProps {
  pack: ExamPackSummary;
  onPress: () => void;
}

export function ExamPackCard({ pack, onPress }: ExamPackCardProps) {
  return (
    <Pressable
      accessibilityHint="Sınav paketinin çalışma alanlarını açar"
      accessibilityLabel={`${pack.shortTitle}, ${pack.subjectCount} çalışma alanı`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.iconContainer}>
        <Ionicons color={colors.primary} name="school-outline" size={28} />
      </View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <AppText variant="heading3" style={styles.title}>
            {pack.shortTitle}
          </AppText>
          <AppText tone="muted" variant="caption">
            {pack.subjectCount} çalışma alanı
          </AppText>
        </View>
        <AppText tone="muted">{pack.description}</AppText>
      </View>
      <Ionicons
        accessibilityElementsHidden
        color={colors.textMuted}
        importantForAccessibility="no-hide-descendants"
        name="chevron-forward"
        size={22}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...shadows.card,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
    transform: [{ scale: 0.99 }],
  },
  iconContainer: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderCurve: "continuous",
    borderRadius: radius.md,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  copy: {
    flex: 1,
    gap: spacing.sm,
  },
  titleRow: {
    alignItems: "baseline",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
});

import type { ReactNode } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, radius, shadows, spacing } from "@/theme";

import { AppText } from "./app-text";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  onPress: () => void;
  badge?: string;
  accessibilityLabel?: string;
  variant?: "study" | "exam";
}

export function FeatureCard({
  icon,
  title,
  description,
  onPress,
  badge,
  accessibilityLabel,
  variant = "study",
}: FeatureCardProps) {
  return (
    <Pressable
      accessibilityHint="İlgili çalışma akışını açar"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, variant === "exam" && styles.examCard, pressed && styles.pressed]}
    >
      <View style={[styles.iconContainer, variant === "exam" && styles.examIcon]}>{icon}</View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <AppText variant="heading3" style={styles.title}>
            {title}
          </AppText>
          {badge ? (
            <View style={styles.badge}>
              <AppText variant="caption" tone="primary">
                {badge}
              </AppText>
            </View>
          ) : null}
        </View>
        <AppText tone="muted">{description}</AppText>
        <View style={styles.action}>
          <AppText variant="caption" tone="primary">
            {variant === "exam" ? "Paketleri keşfet" : "PDF ile başla"}
          </AppText>
          <Ionicons accessible={false} color={colors.primaryDark} name="arrow-forward" size={17} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...shadows.card,
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.lg,
    padding: spacing.xl,
  },
  examCard: {
    backgroundColor: colors.accentSoft,
    borderTopLeftRadius: radius.xl,
  },
  examIcon: {
    backgroundColor: colors.accent,
  },
  action: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  pressed: {
    backgroundColor: colors.primarySoftMuted,
    borderColor: colors.primary,
    transform: [{ scale: 0.99 }],
  },
  iconContainer: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderCurve: "continuous",
    borderRadius: radius.md,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  copy: {
    flex: 1,
    gap: spacing.sm,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  title: {
    flexShrink: 1,
  },
  badge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});

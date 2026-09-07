import type { ReactNode } from "react";
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
}

export function FeatureCard({
  icon,
  title,
  description,
  onPress,
  badge,
  accessibilityLabel,
}: FeatureCardProps) {
  return (
    <Pressable
      accessibilityHint="İlgili çalışma akışını açar"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.iconContainer}>{icon}</View>
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
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.lg,
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
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});

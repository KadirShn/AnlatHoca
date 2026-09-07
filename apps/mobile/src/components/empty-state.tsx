import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/theme";

import { AppButton } from "./app-button";
import { AppText } from "./app-text";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onActionPress,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.copy}>
        <AppText variant="heading3" style={styles.centerText}>
          {title}
        </AppText>
        <AppText tone="muted" style={styles.centerText}>
          {description}
        </AppText>
      </View>
      {actionLabel && onActionPress ? (
        <AppButton label={actionLabel} onPress={onActionPress} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.xxl,
  },
  iconContainer: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  copy: {
    gap: spacing.sm,
  },
  centerText: {
    textAlign: "center",
  },
});

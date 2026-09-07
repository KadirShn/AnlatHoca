import { Pressable, StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/theme";

import { AppText } from "./app-text";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function SectionHeader({
  title,
  actionLabel,
  onActionPress,
}: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <AppText variant="heading2" style={styles.title}>
        {title}
      </AppText>
      {actionLabel && onActionPress ? (
        <Pressable
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
          hitSlop={spacing.sm}
          onPress={onActionPress}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <AppText variant="bodyMedium" tone="primary">
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  title: {
    flex: 1,
  },
  action: {
    borderRadius: radius.sm,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.primarySoft,
  },
});

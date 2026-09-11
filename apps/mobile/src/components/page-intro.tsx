import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/theme";

import { AppText } from "./app-text";

interface PageIntroProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export function PageIntro({ title, description, icon }: PageIntroProps) {
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <View style={styles.marker} />
        <AppText variant="heading1">{title}</AppText>
        <AppText tone="muted">{description}</AppText>
      </View>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg,
    overflow: "hidden",
    paddingVertical: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.sm,
  },
  marker: {
    width: 28,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    marginBottom: spacing.xs,
  },
  icon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
});

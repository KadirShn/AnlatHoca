import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/theme";

import { AppText } from "./app-text";

interface InlineMessageProps {
  message: string;
  tone?: "danger" | "info";
}

export function InlineMessage({
  message,
  tone = "info",
}: InlineMessageProps) {
  const isDanger = tone === "danger";

  return (
    <View
      accessibilityLiveRegion={isDanger ? "assertive" : "polite"}
      accessibilityRole={isDanger ? "alert" : "summary"}
      style={[styles.container, isDanger ? styles.danger : styles.info]}
    >
      <Ionicons
        color={isDanger ? colors.danger : colors.textMuted}
        name={isDanger ? "alert-circle-outline" : "information-circle-outline"}
        size={22}
      />
      <AppText
        selectable
        style={styles.message}
        tone={isDanger ? "danger" : "muted"}
      >
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    borderCurve: "continuous",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    borderWidth: 1,
  },
  info: {
    backgroundColor: colors.surfaceMuted,
  },
  message: {
    flex: 1,
  },
});

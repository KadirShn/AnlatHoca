import Ionicons from "@expo/vector-icons/Ionicons";
import type { ExamSubject } from "@anlat-hoca/contracts";
import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/theme";

import { AppText } from "./app-text";

interface ExamSubjectRowProps {
  subject: ExamSubject;
}

export function ExamSubjectRow({ subject }: ExamSubjectRowProps) {
  const isAvailable = subject.status === "available";
  const statusLabel = isAvailable ? "Kullanıma hazır" : "Konu paketi hazırlanıyor";

  return (
    <View
      accessible
      accessibilityLabel={`${subject.title}. ${statusLabel}.`}
      style={styles.row}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          color={isAvailable ? colors.success : colors.textMuted}
          name="book-outline"
          size={24}
        />
      </View>
      <View style={styles.copy}>
        <AppText variant="bodyMedium">{subject.title}</AppText>
        <AppText
          style={isAvailable ? styles.availableText : undefined}
          tone={isAvailable ? "default" : "muted"}
          variant="caption"
        >
          {statusLabel}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 72,
    padding: spacing.md,
  },
  iconContainer: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  availableText: {
    color: colors.success,
  },
});

import Ionicons from "@expo/vector-icons/Ionicons";
import type { LibraryLessonSummary } from "@anlat-hoca/contracts";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/theme";
import { formatLibraryDate } from "@/utils/format-library-date";

import { AppText } from "./app-text";

interface LibraryLessonCardProps {
  lesson: LibraryLessonSummary;
  onPress: () => void;
}

export function LibraryLessonCard({
  lesson,
  onPress,
}: LibraryLessonCardProps) {
  const quizLabel = lesson.quiz.latestAttempt
    ? `Son quiz: %${lesson.quiz.latestAttempt.scorePercent}`
    : lesson.quiz.available
      ? "Quiz hazır"
      : "Quiz yok";
  const teacherLabel = lesson.teacher.threadExists
    ? `Hocaya Sor: ${lesson.teacher.messageCount} mesaj`
    : "Hocaya Sor başlatılmadı";

  return (
    <Pressable
      accessibilityHint="Kaydedilmiş dersi açar"
      accessibilityLabel={`${lesson.title}, ${lesson.durationMinutes} dakika`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.heading}>
        <View style={styles.icon}>
          <Ionicons color={colors.primary} name="school-outline" size={23} />
        </View>
        <View style={styles.headingCopy}>
          <AppText selectable variant="heading3">
            {lesson.title}
          </AppText>
          <AppText selectable tone="muted" variant="caption">
            {lesson.document.analysisTitle ?? lesson.document.name}
          </AppText>
        </View>
        <Ionicons color={colors.textMuted} name="chevron-forward" size={20} />
      </View>

      <View style={styles.metaRow}>
        <Metadata icon="time-outline" label={`${lesson.durationMinutes} dk`} />
        <Metadata icon="calendar-outline" label={formatLibraryDate(lesson.createdAt)} />
      </View>
      <View style={styles.metaRow}>
        <Metadata icon="checkbox-outline" label={quizLabel} />
        <Metadata icon="chatbubble-outline" label={teacherLabel} />
      </View>
    </Pressable>
  );
}

function Metadata({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.metadata}>
      <Ionicons color={colors.textMuted} name={icon} size={16} />
      <AppText tone="muted" variant="caption">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  pressed: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  heading: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  icon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  headingCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  metadata: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
});

import Ionicons from "@expo/vector-icons/Ionicons";
import type { LibraryDocumentSummary } from "@anlat-hoca/contracts";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, radius, shadows, spacing } from "@/theme";
import { formatLibraryDate } from "@/utils/format-library-date";

import { AppText } from "./app-text";

interface LibraryDocumentCardProps {
  document: LibraryDocumentSummary;
  onPress: () => void;
}

export function LibraryDocumentCard({
  document,
  onPress,
}: LibraryDocumentCardProps) {
  const isAnalyzed = document.status === "analyzed";

  return (
    <Pressable
      accessibilityHint={
        isAnalyzed
          ? "Kaydedilmiş belge analizini açar"
          : "Belgeyi analiz etmeye hazır ekrana gider"
      }
      accessibilityLabel={`${document.name}, ${isAnalyzed ? "analiz edildi" : "analiz bekliyor"}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.heading}>
        <View style={styles.icon}>
          <Ionicons color={colors.primary} name="document-text-outline" size={23} />
        </View>
        <View style={styles.headingCopy}>
          <AppText selectable variant="heading3">
            {document.name}
          </AppText>
          <AppText
            selectable
            tone={isAnalyzed ? "primary" : "muted"}
            variant="caption"
          >
            {isAnalyzed ? "Analiz edildi" : "Analiz bekliyor"}
          </AppText>
        </View>
        <Ionicons color={colors.textMuted} name="chevron-forward" size={20} />
      </View>

      {document.analysis ? (
        <AppText selectable tone="muted">
          {document.analysis.title} · {document.analysis.topicCount} konu
        </AppText>
      ) : null}

      <View style={styles.metaRow}>
        <Metadata
          icon="library-outline"
          label={`${document.lessonCount} ders`}
        />
        <Metadata
          icon="calendar-outline"
          label={formatLibraryDate(document.createdAt)}
        />
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
    ...shadows.card,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.xl,
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

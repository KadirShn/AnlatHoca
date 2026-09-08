import Ionicons from "@expo/vector-icons/Ionicons";
import type { AnalysisTopic } from "@anlat-hoca/contracts";
import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/theme";

import { AppText } from "./app-text";

interface AnalysisTopicCardProps {
  index: number;
  topic: AnalysisTopic;
}

export function AnalysisTopicCard({
  index,
  topic,
}: AnalysisTopicCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.number}>
          <AppText tone="primary" variant="bodyMedium">
            {index + 1}
          </AppText>
        </View>
        <AppText selectable style={styles.title} variant="heading3">
          {topic.title}
        </AppText>
      </View>

      <View style={styles.metrics}>
        <Metric
          icon="bookmark-outline"
          label="Belge içindeki önem"
          value={importanceLabel(topic.importance)}
        />
        <Metric
          icon="barbell-outline"
          label="Zorluk"
          value={difficultyLabel(topic.difficulty)}
        />
      </View>

      <AppText selectable tone="muted">
        {topic.summary}
      </AppText>

      <View style={styles.keyPoints}>
        <AppText variant="bodyMedium">Öğrenme noktaları</AppText>
        {topic.keyPoints.map((point, pointIndex) => (
          <View key={pointIndex} style={styles.keyPoint}>
            <Ionicons
              color={colors.primary}
              name="checkmark-circle-outline"
              size={19}
            />
            <AppText selectable style={styles.keyPointText}>
              {point}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metric}>
      <Ionicons color={colors.primary} name={icon} size={17} />
      <View style={styles.metricCopy}>
        <AppText tone="muted" variant="caption">
          {label}
        </AppText>
        <AppText selectable variant="bodyMedium">
          {value}
        </AppText>
      </View>
    </View>
  );
}

function importanceLabel(value: number): string {
  return ["Düşük", "Sınırlı", "Orta", "Önemli", "Çok önemli"][value - 1];
}

function difficultyLabel(value: number): string {
  return ["Çok kolay", "Kolay", "Orta", "Zor", "İleri"][value - 1];
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.xl,
  },
  heading: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  number: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  title: {
    flex: 1,
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metric: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderCurve: "continuous",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.sm,
    minWidth: 150,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  metricCopy: {
    gap: spacing.xs,
  },
  keyPoints: {
    gap: spacing.sm,
  },
  keyPoint: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  keyPointText: {
    flex: 1,
  },
});

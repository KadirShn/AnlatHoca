import type { HistoricalTopicInsight } from "@anlat-hoca/contracts";
import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/theme";

import { AppText } from "./app-text";

interface HistoricalInsightCardProps {
  insight: HistoricalTopicInsight;
}

export function HistoricalInsightCard({
  insight,
}: HistoricalInsightCardProps) {
  if (insight.evidenceStatus === "insufficient") {
    return (
      <View
        accessibilityLabel={`${insight.title}. Sayısal sonuç için kanıt yetersiz.`}
        style={styles.card}
      >
        <AppText variant="heading3">{insight.title}</AppText>
        <AppText tone="muted">{insight.reason}</AppText>
      </View>
    );
  }

  return (
    <View
      accessibilityLabel={`${insight.title}. Kamuya açık örnekte toplam ${insight.totalObserved} gözlem. ${insight.yearsAppeared} yılda görüldü.`}
      style={styles.card}
    >
      <AppText variant="heading3">{insight.title}</AppText>
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <AppText variant="heading2">{insight.totalObserved}</AppText>
          <AppText tone="muted" variant="caption">
            açık örnekte toplam
          </AppText>
        </View>
        <View style={styles.metric}>
          <AppText variant="heading2">
            {insight.averageObservedPerAdministration.toLocaleString("tr-TR")}
          </AppText>
          <AppText tone="muted" variant="caption">
            uygulama başına ortalama
          </AppText>
        </View>
        <View style={styles.metric}>
          <AppText variant="heading2">{insight.yearsAppeared}</AppText>
          <AppText tone="muted" variant="caption">
            örnek yılda görüldü
          </AppText>
        </View>
      </View>
      <View style={styles.years}>
        {insight.yearlyCounts.map((item) => (
          <View key={item.year} style={styles.year}>
            <AppText tone="muted" variant="caption">
              {item.year}
            </AppText>
            <AppText variant="bodyMedium">{item.count}</AppText>
          </View>
        ))}
      </View>
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
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metric: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flexBasis: 96,
    flexGrow: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  years: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  year: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});

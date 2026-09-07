import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";

import { AppText, ScreenContainer } from "@/components";
import { colors, radius, shadows, spacing } from "@/theme";

const exams = [
  {
    name: "TYT",
    description: "Temel Yeterlilik Testi için planlanan çalışma akışı.",
  },
  {
    name: "KPSS Lisans",
    description: "Lisans düzeyi KPSS için planlanan çalışma akışı.",
  },
] as const;

export function ExamsScreen() {
  return (
    <ScreenContainer edges={["left", "right", "bottom"]}>
      <View style={styles.intro}>
        <AppText variant="heading2">Sınav yolculuğunu planla</AppText>
        <AppText tone="muted">
          Hazırlanmış sınav çalışma akışları sonraki geliştirme adımlarında
          burada yer alacak.
        </AppText>
      </View>

      <View style={styles.examList}>
        {exams.map((exam) => (
          <View key={exam.name} style={styles.examCard}>
            <View style={styles.examIcon}>
              <Ionicons color={colors.primary} name="school" size={28} />
            </View>
            <View style={styles.examCopy}>
              <View style={styles.titleRow}>
                <AppText variant="heading3" style={styles.examTitle}>
                  {exam.name}
                </AppText>
                <View style={styles.badge}>
                  <AppText variant="caption" tone="primary">
                    Yakında
                  </AppText>
                </View>
              </View>
              <AppText tone="muted">{exam.description}</AppText>
            </View>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: spacing.sm,
  },
  examList: {
    gap: spacing.md,
  },
  examCard: {
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
  examIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderCurve: "continuous",
    borderRadius: radius.md,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  examCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  examTitle: {
    flex: 1,
  },
  badge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});

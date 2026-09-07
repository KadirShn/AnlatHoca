import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";

import { AppText, ScreenContainer } from "@/components";
import { colors, radius, spacing } from "@/theme";

const studyTimes = ["10 dakika", "30 dakika", "60 dakika"] as const;

export function QuickStudyScreen() {
  return (
    <ScreenContainer edges={["left", "right", "bottom"]}>
      <View style={styles.intro}>
        <View style={styles.iconContainer}>
          <Ionicons color={colors.primary} name="timer-outline" size={30} />
        </View>
        <AppText variant="heading2">Zamanına göre odaklan</AppText>
        <AppText tone="muted">
          Bu akışta sınavını, dersini ve ayırabileceğin çalışma süresini
          seçebileceksin.
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="heading3">Çalışma süresi</AppText>
        <View style={styles.timeList}>
          {studyTimes.map((time) => (
            <View key={time} style={styles.timeCard}>
              <Ionicons color={colors.primary} name="time-outline" size={24} />
              <AppText variant="bodyMedium" style={styles.timeLabel}>
                {time}
              </AppText>
              <AppText variant="caption" tone="muted">
                Yakında
              </AppText>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.notice}>
        <Ionicons color={colors.accent} name="construct-outline" size={24} />
        <View style={styles.noticeCopy}>
          <AppText variant="bodyMedium">Hazırlanıyor</AppText>
          <AppText tone="muted">
            Bu seçenekler henüz içerik oluşturmaz veya bir API çağrısı yapmaz.
          </AppText>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: spacing.md,
  },
  iconContainer: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    height: 60,
    justifyContent: "center",
    width: 60,
  },
  section: {
    gap: spacing.md,
  },
  timeList: {
    gap: spacing.md,
  },
  timeCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 60,
    padding: spacing.lg,
  },
  timeLabel: {
    flex: 1,
  },
  notice: {
    alignItems: "flex-start",
    backgroundColor: colors.accentSoft,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
  },
  noticeCopy: {
    flex: 1,
    gap: spacing.xs,
  },
});

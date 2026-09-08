import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppButton, AppText, ScreenContainer } from "@/components";
import { colors, radius, spacing } from "@/theme";

export function DocumentReadyScreen() {
  return (
    <ScreenContainer
      contentContainerStyle={styles.content}
      edges={["left", "right", "bottom"]}
    >
      <View accessibilityRole="summary" style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons color={colors.success} name="checkmark-circle" size={44} />
        </View>
        <View style={styles.copy}>
          <AppText variant="heading2" style={styles.centerText}>
            Belge hazır
          </AppText>
          <AppText selectable tone="muted" style={styles.centerText}>
            PDF seçimi tamamlandı. Analiz özelliği sonraki adımda bağlanacak.
          </AppText>
        </View>
        <AppButton
          accessibilityLabel="Belge seçimine geri dön"
          label="Belge Seçimine Dön"
          onPress={() => router.back()}
          variant="secondary"
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.xl,
    padding: spacing.xxxl,
  },
  iconContainer: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: radius.full,
    height: 82,
    justifyContent: "center",
    width: 82,
  },
  copy: {
    gap: spacing.sm,
  },
  centerText: {
    textAlign: "center",
  },
});

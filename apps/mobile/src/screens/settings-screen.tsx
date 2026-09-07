import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import type { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";

import {
  AppText,
  ConnectionStatusCard,
  ScreenContainer,
  SectionHeader,
} from "@/components";
import { colors, radius, spacing } from "@/theme";

type SettingsIcon = ComponentProps<typeof Ionicons>["name"];

interface SettingsRowProps {
  icon: SettingsIcon;
  label: string;
  value: string;
}

function SettingsRow({ icon, label, value }: SettingsRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons color={colors.primary} name={icon} size={20} />
      </View>
      <AppText variant="bodyMedium" style={styles.rowLabel}>
        {label}
      </AppText>
      <AppText variant="caption" tone="muted" selectable>
        {value}
      </AppText>
    </View>
  );
}

export function SettingsScreen() {
  const version = Constants.expoConfig?.version ?? "—";

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <AppText variant="heading1">Ayarlar</AppText>
        <AppText tone="muted">
          Uygulama bilgilerini ve gelecekte sunulacak seçenekleri görüntüle.
        </AppText>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Bağlantı" />
        <ConnectionStatusCard />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Uygulama" />
        <View style={styles.settingsCard}>
          <SettingsRow icon="layers-outline" label="Sürüm" value={version} />
          <View style={styles.divider} />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Gizlilik"
            value="Yakında"
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="information-circle-outline"
            label="Hakkında"
            value="Yakında"
          />
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoIcon}>
          <Ionicons color={colors.accent} name="bulb-outline" size={24} />
        </View>
        <View style={styles.infoCopy}>
          <AppText variant="heading3">Anlat Hoca V1</AppText>
          <AppText tone="muted">
            İlk sürüm, notlardan AI destekli çalışma içerikleri oluşturmaya
            odaklanacak.
          </AppText>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  section: {
    gap: spacing.lg,
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 60,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  rowLabel: {
    flex: 1,
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
    marginHorizontal: spacing.lg,
  },
  infoCard: {
    alignItems: "flex-start",
    backgroundColor: colors.accentSoft,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
  },
  infoIcon: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  infoCopy: {
    flex: 1,
    gap: spacing.sm,
  },
});

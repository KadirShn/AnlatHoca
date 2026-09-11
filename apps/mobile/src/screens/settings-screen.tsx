import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { type Href, useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import {
  AppText,
  ConnectionStatusCard,
  PageIntro,
  ScreenContainer,
  SectionHeader,
} from "@/components";
import { colors, radius, spacing } from "@/theme";

type SettingsIcon = ComponentProps<typeof Ionicons>["name"];

interface SettingsRowProps {
  icon: SettingsIcon;
  label: string;
  value?: string;
  onPress?: () => void;
}

function SettingsRow({ icon, label, value, onPress }: SettingsRowProps) {
  const content = (
    <>
      <View style={styles.rowIcon}>
        <Ionicons color={colors.primary} name={icon} size={20} />
      </View>
      <AppText variant="bodyMedium" style={styles.rowLabel}>
        {label}
      </AppText>
      {value ? (
        <AppText variant="caption" tone="muted" selectable>
          {value}
        </AppText>
      ) : null}
      {onPress ? (
        <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {content}
    </Pressable>
  );
}

export function SettingsScreen() {
  const router = useRouter();
  const version = Constants.expoConfig?.version ?? "—";

  return (
    <ScreenContainer>
      <PageIntro
        description="Uygulama bilgilerini, hizmet durumunu ve gizlilik açıklamalarını görüntüle."
        icon={<Ionicons color={colors.primary} name="settings-outline" size={27} />}
        title="Ayarlar"
      />

      <View style={styles.section}>
        <SectionHeader title="Anlat Hoca" />
        <View style={styles.settingsCard}>
          <SettingsRow icon="layers-outline" label="Uygulama sürümü" value={version} />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Gizlilik ve Veriler" />
        <View style={styles.settingsCard}>
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Gizlilik Politikası"
            onPress={() => router.push("/settings/privacy" as Href)}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="server-outline"
            label="Verilerim nasıl kullanılıyor?"
            onPress={() => router.push("/settings/privacy" as Href)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Hizmet Durumu" />
        <ConnectionStatusCard />
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoIcon}>
          <Ionicons color={colors.accent} name="bulb-outline" size={24} />
        </View>
        <View style={styles.infoCopy}>
          <AppText variant="heading3">Hakkında</AppText>
          <AppText tone="muted">
            Anlat Hoca V1; PDF notlarından analiz, 10 / 30 / 60 dakikalık ders,
            sunum, quiz ve Hocaya Sor deneyimleri oluşturur. Sınava Hazırlan
            alanında doğrulanmış geçmiş gözlemleri ve yerel çalışma planlarını sunar.
          </AppText>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  rowPressed: {
    backgroundColor: colors.primarySoft,
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

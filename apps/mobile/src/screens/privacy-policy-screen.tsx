import Ionicons from "@expo/vector-icons/Ionicons";
import {
  PRIVACY_POLICY_INTRO,
  PRIVACY_POLICY_LAST_UPDATED,
  PRIVACY_POLICY_SECTIONS,
  PUBLIC_PRIVACY_POLICY_URL,
} from "@anlat-hoca/config";
import { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";

import { AppButton, AppText, InlineMessage, ScreenContainer } from "@/components";
import { colors, radius, spacing } from "@/theme";

export function PrivacyPolicyScreen() {
  const [linkError, setLinkError] = useState<string | null>(null);

  async function openPublicPolicy() {
    setLinkError(null);

    try {
      await Linking.openURL(PUBLIC_PRIVACY_POLICY_URL);
    } catch {
      setLinkError("Gizlilik politikasının internet sayfası şu anda açılamadı.");
    }
  }

  return (
    <ScreenContainer edges={["left", "right", "bottom"]}>
      <View style={styles.intro}>
        <View style={styles.iconContainer}>
          <Ionicons color={colors.primary} name="shield-checkmark-outline" size={28} />
        </View>
        <AppText variant="heading2">Gizlilik Politikası</AppText>
        <AppText selectable tone="muted">
          Son güncelleme: {PRIVACY_POLICY_LAST_UPDATED}
        </AppText>
        <AppText selectable>{PRIVACY_POLICY_INTRO}</AppText>
      </View>

      {PRIVACY_POLICY_SECTIONS.map((section) => (
        <View key={section.title} style={styles.sectionCard}>
          <AppText selectable variant="heading3">
            {section.title}
          </AppText>
          {section.paragraphs.map((paragraph) => (
            <AppText key={paragraph} selectable tone="muted" style={styles.paragraph}>
              {paragraph}
            </AppText>
          ))}
        </View>
      ))}

      <View style={styles.publicLink}>
        <AppText variant="bodyMedium">İnternette görüntüle</AppText>
        <AppText selectable tone="muted" variant="caption">
          {PUBLIC_PRIVACY_POLICY_URL}
        </AppText>
        {linkError ? <InlineMessage message={linkError} tone="danger" /> : null}
        <AppButton
          label="Halka Açık Politikayı Aç"
          onPress={() => void openPublicPolicy()}
          variant="secondary"
        />
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
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
  },
  paragraph: {
    lineHeight: 24,
  },
  publicLink: {
    gap: spacing.md,
  },
});

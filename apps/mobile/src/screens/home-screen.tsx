import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import {
  AppText,
  EmptyState,
  FeatureCard,
  ScreenContainer,
  SectionHeader,
} from "@/components";
import { colors, radius, spacing } from "@/theme";

const iconSize = 25;

export function HomeScreen() {
  const router = useRouter();

  return (
    <ScreenContainer>
      <View style={styles.brandHeader}>
        <View style={styles.brandIcon}>
          <Ionicons color={colors.textOnPrimary} name="book" size={22} />
        </View>
        <View style={styles.brandCopy}>
          <AppText variant="heading3">Anlat Hoca</AppText>
          <AppText variant="caption" tone="muted">
            AI destekli çalışma asistanın
          </AppText>
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons color={colors.primary} name="sparkles" size={24} />
        </View>
        <AppText variant="display">Bugün ne çalışıyoruz?</AppText>
        <AppText tone="muted">
          Notlarını yükle, süreni seç ve sana özel çalışma içeriğini
          hazırla.
        </AppText>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Çalışmaya Başla" />
        <View style={styles.cardList}>
          <FeatureCard
            badge="Hızlı"
            description="10, 30 veya 60 dakikada en önemli konulara odaklan."
            icon={
              <Ionicons color={colors.primary} name="timer" size={iconSize} />
            }
            onPress={() => router.push("/quick-study")}
            title="Sınava Az Kaldı"
          />
          <FeatureCard
            badge="AI"
            description="PDF notlarını yükle, konuları analiz edip sana uygun bir derse dönüştürelim."
            icon={
              <Ionicons
                color={colors.primary}
                name="document-text"
                size={iconSize}
              />
            }
            onPress={() => router.push("/document/upload")}
            title="Hocam Şunu Anlat"
          />
          <FeatureCard
            description="TYT ve KPSS için hazırlanmış çalışma akışlarını keşfet."
            icon={
              <Ionicons color={colors.primary} name="school" size={iconSize} />
            }
            onPress={() => router.push("/exams")}
            title="Sınava Hazırlan"
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Son Dersler" />
        <EmptyState
          actionLabel="İlk Notunu Yükle"
          description="İlk notunu yükleyerek çalışmaya başlayabilirsin."
          icon={
            <Ionicons
              color={colors.primary}
              name="library-outline"
              size={30}
            />
          }
          onActionPress={() => router.push("/document/upload")}
          title="Henüz bir ders oluşturmadın."
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  brandHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  brandIcon: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderCurve: "continuous",
    borderRadius: radius.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  brandCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  hero: {
    backgroundColor: colors.primarySoft,
    borderCurve: "continuous",
    borderRadius: radius.xl,
    gap: spacing.md,
    padding: spacing.xxl,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  section: {
    gap: spacing.lg,
  },
  cardList: {
    gap: spacing.md,
  },
});

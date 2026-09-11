import { OwlLoader } from "@/components/owl-loader";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Image, StyleSheet, View } from "react-native";
import {
  HOME_RECENT_LESSON_LIMIT,
} from "@anlat-hoca/config";

import {
  AppText,
  EmptyState,
  FeatureCard,
  InlineMessage,
  LibraryLessonCard,
  AppButton,
  ScreenContainer,
  SectionHeader,
} from "@/components";
import { useLibraryData } from "@/hooks/use-library-data";
import { colors, radius, spacing } from "@/theme";

const iconSize = 25;

export function HomeScreen() {
  const router = useRouter();
  const { data, error, isLoading, retry } = useLibraryData({
    lessonLimit: HOME_RECENT_LESSON_LIMIT,
    documentLimit: 1,
  });
  const recentLessons = data?.lessons ?? [];

  return (
    <ScreenContainer>
      <View style={styles.brandHeader}>
        <View style={styles.brandIcon}>
          <Ionicons color={colors.textOnPrimary} name="book" size={22} />
        </View>
        <View style={styles.brandCopy}>
          <AppText variant="heading3">Anlat Hoca</AppText>
          <AppText variant="caption" tone="muted">
            Daha iyi öğren. Daha ileri git.
          </AppText>
        </View>
      </View>

      <View style={styles.hero}>
        <View pointerEvents="none" accessible={false} style={styles.heroGlow} />
        <View style={styles.heroTop}>
          <View style={styles.heroBadge}>
            <Ionicons color={colors.primaryDeep} name="sparkles" size={15} />
            <AppText variant="caption" style={styles.heroBadgeText}>
              SENİN ÇALIŞMA ALANIN
            </AppText>
          </View>
          <Image
            accessible={false}
            resizeMode="contain"
            source={require("../../assets/branding/mascot-master.png")}
            style={styles.mascot}
          />
        </View>
        <View style={styles.heroCopy}>
          <AppText variant="display" tone="onPrimary">
            Anlamanın verdiği{"\n"}o güzel his.
          </AppText>
          <AppText style={styles.heroDescription}>
            Bir PDF ile başla. Konuları keşfet, kendi hızında öğren.
          </AppText>
        </View>
        <AppButton
          label="Notlarımdan ders oluştur"
          leftIcon={<Ionicons color={colors.primaryDeep} name="add-circle-outline" size={22} />}
          onPress={() => router.push("/document/upload")}
          variant="accent"
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Bir sonraki hedefin" />
        <View style={styles.cardList}>
          <FeatureCard
            badge="TYT · KPSS"
            variant="exam"
            description="Hedefini seç, konuları keşfet ve zamanına uygun bir çalışma planı hazırla."
            icon={
              <Ionicons color={colors.primaryDeep} name="school" size={iconSize} />
            }
            onPress={() => router.push("/exams")}
            title="Sınava Hazırlan"
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Kaldığın yerden" actionLabel="Kütüphanem" onActionPress={() => router.push("/library")} />
        {isLoading && data === null ? (
          <View
            accessibilityLiveRegion="polite"
            style={styles.recentLoading}
          >
            <OwlLoader color={colors.primary} accessibilityLabel="Son dersler yükleniyor." />
          </View>
        ) : error && data === null ? (
          <View style={styles.recentError}>
            <InlineMessage message={error} tone="danger" />
            <AppButton label="Tekrar Dene" onPress={() => void retry()} />
          </View>
        ) : recentLessons.length === 0 ? (
          <EmptyState
            actionLabel="İlk Dersini Oluştur"
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
        ) : (
          <View style={styles.cardList}>
            {error ? <InlineMessage message={error} tone="danger" /> : null}
            {recentLessons.map((lesson) => (
              <LibraryLessonCard
                key={lesson.id}
                lesson={lesson}
                onPress={() =>
                  router.push({
                    pathname: "/lesson/[lessonId]",
                    params: { lessonId: lesson.id },
                  })
                }
              />
            ))}
          </View>
        )}
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
    backgroundColor: colors.primaryDark,
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
    alignItems: "stretch",
    backgroundColor: colors.primaryDeep,
    borderCurve: "continuous",
    borderRadius: radius.xxl,
    gap: spacing.xl,
    overflow: "hidden",
    padding: spacing.xl,
  },
  heroTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  heroGlow: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 220,
    opacity: 0.4,
    position: "absolute",
    right: -110,
    top: 72,
    width: 220,
  },
  heroCopy: {
    gap: spacing.md,
    zIndex: 1,
  },
  heroBadge: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexShrink: 1,
  },
  heroBadgeText: {
    flexShrink: 1,
    color: colors.primaryDeep,
    fontWeight: "800",
    letterSpacing: 0.35,
  },
  heroDescription: {
    color: colors.primarySoft,
  },
  mascot: {
    height: 72,
    width: 72,
  },
  section: {
    gap: spacing.lg,
  },
  cardList: {
    gap: spacing.md,
  },
  recentLoading: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.xl,
  },
  recentError: {
    gap: spacing.md,
  },
});

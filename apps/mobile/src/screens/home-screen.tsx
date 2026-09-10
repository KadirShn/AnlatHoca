import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
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
            badge="Yapay zekâ"
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
            description="TYT ve KPSS alanlarını keşfet; doğrulanmış konularda 10, 30 veya 60 dakikalık plan oluştur."
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
        {isLoading && data === null ? (
          <View
            accessibilityLiveRegion="polite"
            style={styles.recentLoading}
          >
            <ActivityIndicator color={colors.primary} />
            <AppText tone="muted">Son dersler yükleniyor.</AppText>
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

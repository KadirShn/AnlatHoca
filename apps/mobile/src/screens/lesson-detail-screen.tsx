import Ionicons from "@expo/vector-icons/Ionicons";
import {
  lessonIdSchema,
  type Lesson,
  type LessonSection,
} from "@anlat-hoca/contracts";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { ApiClientError, getLessonDetail } from "@/api";
import {
  AppButton,
  AppText,
  InlineMessage,
  ScreenContainer,
} from "@/components";
import { getOrCreateInstallationId } from "@/services/installation/installation-id";
import { colors, radius, spacing } from "@/theme";

type LessonScreenState =
  | { status: "loading" }
  | { status: "success"; lesson: Lesson }
  | { status: "error"; message: string };

export function LessonDetailScreen() {
  const { lessonId } = useLocalSearchParams<{
    lessonId?: string | string[];
  }>();
  const routeLessonId = Array.isArray(lessonId) ? undefined : lessonId;
  const lessonResult = lessonIdSchema.safeParse(routeLessonId);
  const validLessonId = lessonResult.success ? lessonResult.data : null;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LessonScreenState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    if (!validLessonId) {
      return () => {
        active = false;
      };
    }

    void getOrCreateInstallationId()
      .then((installationId) =>
        getLessonDetail({ lessonId: validLessonId, installationId }),
      )
      .then((response) => {
        if (active) {
          setState({ status: "success", lesson: response.lesson });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState({ status: "error", message: getReadErrorMessage(error) });
        }
      });

    return () => {
      active = false;
    };
  }, [attempt, validLessonId]);

  const screenState: LessonScreenState = validLessonId
    ? state
    : { status: "error", message: "Geçerli bir ders bulunamadı." };

  if (screenState.status === "loading") {
    return (
      <ScreenContainer
        contentContainerStyle={styles.centered}
        edges={["left", "right", "bottom"]}
      >
        <ActivityIndicator color={colors.primary} size="large" />
        <View style={styles.centerCopy}>
          <AppText variant="heading3">Ders yükleniyor</AppText>
          <AppText tone="muted">Kaydedilmiş ders içeriği hazırlanıyor.</AppText>
        </View>
      </ScreenContainer>
    );
  }

  if (screenState.status === "error") {
    return (
      <ScreenContainer
        contentContainerStyle={styles.centered}
        edges={["left", "right", "bottom"]}
      >
        <View style={styles.errorIcon}>
          <Ionicons color={colors.danger} name="book-outline" size={38} />
        </View>
        <AppText style={styles.centerText} variant="heading3">
          Ders gösterilemedi
        </AppText>
        <InlineMessage message={screenState.message} tone="danger" />
        {validLessonId ? (
          <AppButton
            label="Tekrar Dene"
            onPress={() => {
              setState({ status: "loading" });
              setAttempt((current) => current + 1);
            }}
          />
        ) : null}
        <AppButton
          label="Ana Sayfaya Dön"
          onPress={() => router.replace("/")}
          variant="secondary"
        />
      </ScreenContainer>
    );
  }

  const { lesson } = screenState;

  return (
    <ScreenContainer edges={["left", "right", "bottom"]}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons color={colors.primary} name="school-outline" size={28} />
        </View>
        <View style={styles.heroCopy}>
          <AppText selectable variant="heading1">
            {lesson.title}
          </AppText>
          <AppText tone="primary" variant="bodyMedium">
            Yaklaşık {lesson.durationMinutes} dakikalık çalışma
          </AppText>
        </View>
      </View>

      <View style={styles.presentationCta}>
        <View style={styles.presentationCtaCopy}>
          <View style={styles.blockHeading}>
            <Ionicons color={colors.primary} name="easel-outline" size={23} />
            <AppText variant="heading3">Sunum modu</AppText>
          </View>
          <AppText tone="muted">
            Konuları tek tek, daha odaklı bir akışla çalış.
          </AppText>
        </View>
        <AppButton
          accessibilityLabel="Dersi sunum modunda aç"
          label="Sunum Modunda Çalış"
          leftIcon={
            <Ionicons
              color={colors.textOnPrimary}
              name="albums-outline"
              size={21}
            />
          }
          onPress={() =>
            router.push({
              pathname: "/lesson/[lessonId]/presentation",
              params: { lessonId: lesson.id },
            })
          }
        />
      </View>

      <View style={styles.quizCta}>
        <View style={styles.presentationCtaCopy}>
          <View style={styles.blockHeading}>
            <Ionicons color={colors.primary} name="checkbox-outline" size={23} />
            <AppText variant="heading3">Ders sonu quizi</AppText>
          </View>
          <AppText tone="muted">
            Yalnızca bu derste çalıştığın konularla kendini sına.
          </AppText>
        </View>
        <AppButton
          accessibilityLabel="Bu ders için quizi aç"
          label="Beni Sına"
          leftIcon={
            <Ionicons
              color={colors.textOnPrimary}
              name="help-circle-outline"
              size={21}
            />
          }
          onPress={() =>
            router.push({
              pathname: "/lesson/[lessonId]/quiz",
              params: { lessonId: lesson.id },
            })
          }
        />
      </View>

      <View style={styles.overviewCard}>
        <AppText variant="heading3">Derse genel bakış</AppText>
        <AppText selectable tone="muted" style={styles.readableText}>
          {lesson.overview}
        </AppText>
      </View>

      <View style={styles.block}>
        <AppText variant="heading2">Öğreneceklerin</AppText>
        <BulletList items={lesson.learningObjectives} icon="flag-outline" />
      </View>

      <View style={styles.sections}>
        {lesson.sections.map((section, index) => (
          <LessonSectionCard key={index} index={index} section={section} />
        ))}
      </View>

      <View style={styles.recapCard}>
        <View style={styles.blockHeading}>
          <Ionicons color={colors.primary} name="repeat-outline" size={23} />
          <AppText variant="heading2">Son Tekrar</AppText>
        </View>
        <BulletList items={lesson.recap} icon="checkmark-circle-outline" />
      </View>

      {lesson.skippedTopics.length > 0 ? (
        <View style={styles.skippedCard}>
          <View style={styles.blockHeading}>
            <Ionicons color={colors.accent} name="time-outline" size={23} />
            <AppText variant="heading3">Bu sürede işlemediklerimiz</AppText>
          </View>
          <AppText tone="muted" style={styles.readableText}>
            Seçtiğin süre nedeniyle bazı daha düşük öncelikli konular bu derse
            dahil edilmedi.
          </AppText>
          <BulletList items={lesson.skippedTopics} icon="remove-circle-outline" />
        </View>
      ) : null}
    </ScreenContainer>
  );
}

function LessonSectionCard({
  index,
  section,
}: {
  index: number;
  section: LessonSection;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeading}>
        <View style={styles.sectionNumber}>
          <AppText tone="primary" variant="bodyMedium">
            {index + 1}
          </AppText>
        </View>
        <View style={styles.sectionTitleCopy}>
          <AppText selectable variant="heading3">
            {section.title}
          </AppText>
          <AppText tone="muted" variant="caption">
            Yaklaşık {section.estimatedMinutes} dk
          </AppText>
        </View>
      </View>

      <AppText selectable style={styles.readableText}>
        {section.explanation}
      </AppText>

      <View style={styles.block}>
        <AppText variant="bodyMedium">Önemli noktalar</AppText>
        <BulletList items={section.keyPoints} icon="checkmark-circle-outline" />
      </View>

      {section.memoryTip ? (
        <View style={styles.memoryTip}>
          <Ionicons color={colors.accent} name="bulb-outline" size={21} />
          <View style={styles.memoryTipCopy}>
            <AppText variant="bodyMedium">Hatırlama İpucu</AppText>
            <AppText selectable tone="muted">
              {section.memoryTip}
            </AppText>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function BulletList({
  items,
  icon,
}: {
  items: string[];
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.bulletList}>
      {items.map((item, index) => (
        <View key={index} style={styles.bulletRow}>
          <Ionicons color={colors.primary} name={icon} size={19} />
          <AppText selectable style={styles.bulletText}>
            {item}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function getReadErrorMessage(error: unknown): string {
  if (!(error instanceof ApiClientError)) {
    return "Kaydedilmiş ders şu anda gösterilemiyor.";
  }

  if (error.kind === "network") {
    return "Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.";
  }

  if (error.kind === "timeout") {
    return "Dersin yüklenmesi beklenenden uzun sürdü. Tekrar deneyebilirsin.";
  }

  if (error.serverCode === "LESSON_NOT_FOUND") {
    return "Bu ders bulunamadı.";
  }

  return "Kaydedilmiş ders şu anda gösterilemiyor.";
}

const styles = StyleSheet.create({
  centered: {
    flexGrow: 1,
    justifyContent: "center",
  },
  centerCopy: {
    alignItems: "center",
    gap: spacing.sm,
  },
  centerText: {
    textAlign: "center",
  },
  errorIcon: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.full,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  hero: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  heroCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  overviewCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
  },
  presentationCta: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.xl,
  },
  presentationCtaCopy: {
    gap: spacing.sm,
  },
  quizCta: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.xl,
  },
  readableText: {
    lineHeight: 25,
  },
  block: {
    gap: spacing.md,
  },
  blockHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  bulletList: {
    gap: spacing.sm,
  },
  bulletRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  bulletText: {
    flex: 1,
  },
  sections: {
    gap: spacing.lg,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xl,
    padding: spacing.xl,
  },
  sectionHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  sectionNumber: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  sectionTitleCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  memoryTip: {
    alignItems: "flex-start",
    backgroundColor: colors.accentSoft,
    borderCurve: "continuous",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  memoryTipCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  recapCard: {
    backgroundColor: colors.primarySoft,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    gap: spacing.lg,
    padding: spacing.xl,
  },
  skippedCard: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
  },
});

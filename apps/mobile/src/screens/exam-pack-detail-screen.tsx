import Ionicons from "@expo/vector-icons/Ionicons";
import {
  examPackIdSchema,
  type ExamPackDetail,
} from "@anlat-hoca/contracts";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { getExamPackDetail } from "@/api";
import {
  AppButton,
  AppText,
  ExamSubjectRow,
  InlineMessage,
  ScreenContainer,
} from "@/components";
import { colors, radius, spacing } from "@/theme";

const LOAD_ERROR = "Sınav paketi şu anda yüklenemedi.";

export function ExamPackDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ examId?: string | string[] }>();
  const packId = useMemo(() => {
    const candidate = Array.isArray(params.examId)
      ? params.examId[0]
      : params.examId;
    const result = examPackIdSchema.safeParse(candidate);
    return result.success ? result.data : null;
  }, [params.examId]);
  const [pack, setPack] = useState<ExamPackDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    setPack(null);
    setError(null);
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    let active = true;

    if (!packId) {
      return () => {
        active = false;
      };
    }

    void getExamPackDetail(packId)
      .then((response) => {
        if (active) setPack(response.pack);
      })
      .catch(() => {
        if (active) setError(LOAD_ERROR);
      });

    return () => {
      active = false;
    };
  }, [attempt, packId]);

  const visibleError = packId ? error : LOAD_ERROR;

  return (
    <ScreenContainer edges={["left", "right", "bottom"]}>
      {!pack && !visibleError ? (
        <View accessibilityLiveRegion="polite" style={styles.status}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText tone="muted">Sınav paketi yükleniyor.</AppText>
        </View>
      ) : null}

      {visibleError ? (
        <View style={styles.status}>
          <InlineMessage message={visibleError} tone="danger" />
          {packId ? <AppButton label="Tekrar Dene" onPress={retry} /> : null}
        </View>
      ) : null}

      {pack ? (
        <>
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons color={colors.primary} name="school-outline" size={30} />
            </View>
            <AppText variant="heading1">{pack.shortTitle}</AppText>
            <AppText tone="muted">{pack.description}</AppText>
            <View style={styles.meta}>
              <AppText variant="bodyMedium">Kimler için?</AppText>
              <AppText tone="muted">{pack.audience}</AppText>
              <AppText tone="muted" variant="caption">
                {pack.subjects.length} çalışma alanı · İçerik {pack.contentVersion}
              </AppText>
            </View>
          </View>

          <View style={styles.section}>
            <AppText variant="heading2">Çalışma alanları</AppText>
            <View style={styles.subjects}>
              {pack.subjects.map((subject) => (
                <ExamSubjectRow
                  key={subject.id}
                  onPress={
                    subject.status === "available"
                      ? () =>
                          router.push(
                            `/exams/${pack.id}/${subject.id}` as Href,
                          )
                      : undefined
                  }
                  subject={subject}
                />
              ))}
            </View>
          </View>

          <InlineMessage
            message="Yalnızca doğrulanmış kaynak verisi bulunan çalışma alanları açılır. Diğer alanlar hazırlanıyor."
            tone="info"
          />
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  status: {
    alignItems: "center",
    gap: spacing.lg,
    paddingVertical: spacing.xxxl,
  },
  hero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  meta: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingTop: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  subjects: {
    gap: spacing.sm,
  },
});

import Ionicons from "@expo/vector-icons/Ionicons";
import {
  examPackIdSchema,
  type ExamSubjectInsightsResponse,
} from "@anlat-hoca/contracts";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { getExamSubjectInsights } from "@/api";
import {
  AppButton,
  AppText,
  InlineMessage,
  ScreenContainer,
} from "@/components";
import {
  createExamStudyPlan,
  type ExamStudyDuration,
  type ExamStudyPlan,
} from "@/features/exam-study-plan/create-exam-study-plan";
import { colors, radius, spacing } from "@/theme";

const LOAD_ERROR = "Çalışma planı için geçmiş gözlemler yüklenemedi.";
const DISCLAIMER =
  "Bu plan, ÖSYM'nin kamuya açık kısmi örneklerinde gözlenen dağılıma dayanır; gelecek sınav dağılımını garanti etmez.";

const durationOptions: {
  duration: ExamStudyDuration;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    duration: 10,
    label: "Acil tekrar",
    description: "İlk sıradaki birkaç başlığa kısa bir çalışma süresi ayırır.",
    icon: "flash-outline",
  },
  {
    duration: 30,
    label: "Dengeli",
    description: "Geçmiş örnek sırasındaki daha geniş bir başlık grubunu kapsar.",
    icon: "options-outline",
  },
  {
    duration: 60,
    label: "Detaylı",
    description: "Sayısal kanıtı bulunan tüm başlıklara süre ayırır.",
    icon: "book-outline",
  },
];

export function ExamStudyPlanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    examId?: string | string[];
    subjectId?: string | string[];
  }>();
  const routeIds = useMemo(() => {
    const examId = examPackIdSchema.safeParse(first(params.examId));
    const subjectId = examPackIdSchema.safeParse(first(params.subjectId));
    return examId.success && subjectId.success
      ? { examId: examId.data, subjectId: subjectId.data }
      : null;
  }, [params.examId, params.subjectId]);
  const [insights, setInsights] =
    useState<ExamSubjectInsightsResponse | null>(null);
  const [selectedDuration, setSelectedDuration] =
    useState<ExamStudyDuration | null>(null);
  const [plan, setPlan] = useState<ExamStudyPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setError(null);
    setInsights(null);
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    let active = true;

    if (!routeIds) {
      return () => {
        active = false;
      };
    }

    void getExamSubjectInsights(routeIds.examId, routeIds.subjectId)
      .then((response) => {
        if (active) setInsights(response);
      })
      .catch(() => {
        if (active) setError(LOAD_ERROR);
      });

    return () => {
      active = false;
    };
  }, [attempt, routeIds]);

  const createPlan = () => {
    if (!insights || !selectedDuration) return;

    const nextPlan = createExamStudyPlan(insights, selectedDuration);
    if (!nextPlan) {
      setError("Plan oluşturmak için yeterli sayısal gözlem bulunmuyor.");
      return;
    }

    setError(null);
    setPlan(nextPlan);
  };

  const returnToInsights = () => {
    if (!routeIds) return;
    router.replace(
      `/exams/${routeIds.examId}/${routeIds.subjectId}` as Href,
    );
  };

  if (!routeIds) {
    return (
      <ScreenContainer
        contentContainerStyle={styles.centered}
        edges={["left", "right", "bottom"]}
      >
        <InlineMessage
          message="Çalışma planı için geçerli bir sınav alanı bulunamadı."
          tone="danger"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["left", "right", "bottom"]}>
      {!insights && !error ? (
        <View accessibilityLiveRegion="polite" style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText tone="muted">Geçmiş gözlemler yükleniyor.</AppText>
        </View>
      ) : null}

      {error && !insights ? (
        <View style={styles.centered}>
          <InlineMessage message={error} tone="danger" />
          <AppButton label="Tekrar Dene" onPress={retry} />
        </View>
      ) : null}

      {insights && !plan ? (
        <>
          <View style={styles.intro}>
            <AppText variant="heading2">Çalışma süreni seç</AppText>
            <AppText tone="muted">
              Plan, kamuya açık geçmiş örneklerdeki gözlemlere göre konuları
              sürene dağıtır.
            </AppText>
          </View>

          <View accessibilityRole="radiogroup" style={styles.options}>
            {durationOptions.map((option) => {
              const selected = selectedDuration === option.duration;

              return (
                <Pressable
                  accessibilityLabel={`${option.duration} dakika, ${option.label}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  key={option.duration}
                  onPress={() => {
                    setSelectedDuration(option.duration);
                    setError(null);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    selected && styles.optionSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.optionIcon,
                      selected && styles.optionIconSelected,
                    ]}
                  >
                    <Ionicons
                      color={selected ? colors.textOnPrimary : colors.primary}
                      name={option.icon}
                      size={24}
                    />
                  </View>
                  <View style={styles.optionCopy}>
                    <AppText variant="heading3">
                      {option.duration} dakika
                    </AppText>
                    <AppText tone="primary" variant="bodyMedium">
                      {option.label}
                    </AppText>
                    <AppText tone="muted">{option.description}</AppText>
                  </View>
                  <Ionicons
                    color={selected ? colors.primary : colors.borderStrong}
                    name={selected ? "checkmark-circle" : "ellipse-outline"}
                    size={26}
                  />
                </Pressable>
              );
            })}
          </View>

          {error ? <InlineMessage message={error} tone="danger" /> : null}
          <InlineMessage message={DISCLAIMER} tone="info" />
          <AppButton
            disabled={!selectedDuration}
            label="Planımı Oluştur"
            onPress={createPlan}
          />
        </>
      ) : null}

      {insights && plan ? (
        <PlanResult
          insights={insights}
          onChangeDuration={() => setPlan(null)}
          onReturn={returnToInsights}
          plan={plan}
        />
      ) : null}
    </ScreenContainer>
  );
}

function PlanResult({
  insights,
  onChangeDuration,
  onReturn,
  plan,
}: {
  insights: ExamSubjectInsightsResponse;
  onChangeDuration: () => void;
  onReturn: () => void;
  plan: ExamStudyPlan;
}) {
  return (
    <>
      <View style={styles.resultHero}>
        <View style={styles.resultIcon}>
          <Ionicons color={colors.primary} name="calendar-outline" size={28} />
        </View>
        <AppText variant="heading1">
          {plan.durationMinutes} Dakikalık {insights.subjectTitle} Planın
        </AppText>
        <AppText tone="muted">
          Kamuya açık örneklerdeki geçmiş gözlemlere göre hazırlandı.
        </AppText>
      </View>

      <View style={styles.planList}>
        {plan.plannedTopics.map((topic, index) => (
          <View key={topic.topicId} style={styles.planItem}>
            <View style={styles.rank}>
              <AppText tone="onPrimary" variant="bodyMedium">
                {index + 1}
              </AppText>
            </View>
            <View style={styles.planCopy}>
              <AppText variant="heading3">{topic.title}</AppText>
              <AppText tone="muted" variant="caption">
                Kamu örneklerinde {topic.observedCount} gözlem ·{" "}
                {topic.yearsAppeared} farklı yıl
              </AppText>
            </View>
            <View style={styles.minutes}>
              <AppText tone="primary" variant="bodyMedium">
                {topic.allocatedMinutes} dk
              </AppText>
            </View>
          </View>
        ))}
      </View>

      {plan.skippedTopics.length > 0 ? (
        <View style={styles.skipped}>
          <AppText variant="heading2">
            Bu sürede plana dahil edilmeyenler
          </AppText>
          <AppText tone="muted">
            Süre sınırı nedeniyle daha düşük gözlem sırasındaki bazı başlıklar
            bu plana eklenmedi.
          </AppText>
          <View style={styles.skippedList}>
            {plan.skippedTopics.map((topic) => (
              <View key={topic.topicId} style={styles.skippedItem}>
                <AppText tone="muted">•</AppText>
                <AppText style={styles.skippedTitle}>{topic.title}</AppText>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <InlineMessage message={DISCLAIMER} tone="info" />
      <View style={styles.actions}>
        <AppButton
          label="Süreyi Değiştir"
          onPress={onChangeDuration}
          variant="secondary"
        />
        <AppButton
          label="Konu Eğilimlerine Dön"
          onPress={onReturn}
          variant="ghost"
        />
      </View>
    </>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    gap: spacing.lg,
    paddingVertical: spacing.xxxl,
  },
  intro: {
    gap: spacing.sm,
  },
  options: {
    gap: spacing.md,
  },
  option: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 112,
    padding: spacing.xl,
  },
  optionSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  pressed: {
    opacity: 0.76,
  },
  optionIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  optionIconSelected: {
    backgroundColor: colors.primary,
  },
  optionCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  resultHero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
  },
  resultIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  planList: {
    gap: spacing.md,
  },
  planItem: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
  },
  rank: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  planCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  minutes: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  skipped: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  skippedList: {
    gap: spacing.sm,
  },
  skippedItem: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  skippedTitle: {
    flex: 1,
  },
  actions: {
    gap: spacing.sm,
  },
});

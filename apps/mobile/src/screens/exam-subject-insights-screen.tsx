import Ionicons from "@expo/vector-icons/Ionicons";
import {
  examPackIdSchema,
  type ExamSubjectInsightsResponse,
  type HistoricalExamSource,
} from "@anlat-hoca/contracts";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { getExamSubjectInsights } from "@/api";
import {
  AppButton,
  AppText,
  HistoricalInsightCard,
  InlineMessage,
  ScreenContainer,
} from "@/components";
import { colors, radius, spacing } from "@/theme";

const LOAD_ERROR = "Doğrulanmış geçmiş sınav verileri şu anda yüklenemedi.";

export function ExamSubjectInsightsScreen() {
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
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [methodologyVisible, setMethodologyVisible] = useState(false);

  const retry = useCallback(() => {
    setInsights(null);
    setError(null);
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

  const visibleError = routeIds ? error : LOAD_ERROR;

  return (
    <ScreenContainer edges={["left", "right", "bottom"]}>
      {!insights && !visibleError ? (
        <View accessibilityLiveRegion="polite" style={styles.status}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText tone="muted">Geçmiş veriler yükleniyor.</AppText>
        </View>
      ) : null}

      {visibleError ? (
        <View style={styles.status}>
          <InlineMessage message={visibleError} tone="danger" />
          {routeIds ? <AppButton label="Tekrar Dene" onPress={retry} /> : null}
        </View>
      ) : null}

      {insights ? (
        <>
          <View style={styles.hero}>
            <View style={styles.titleRow}>
              <View style={styles.icon}>
                <Ionicons
                  color={colors.primary}
                  name="analytics-outline"
                  size={28}
                />
              </View>
              <View style={styles.titleCopy}>
                <AppText variant="heading1">{insights.subjectTitle}</AppText>
                <AppText tone="muted" variant="caption">
                  Geçmiş veri {insights.historicalDataVersion}
                </AppText>
              </View>
            </View>
            <View style={styles.coverageBadge}>
              <AppText tone="primary" variant="caption">
                Kısmi kapsama · {insights.coverage.administrationCount} uygulama
              </AppText>
            </View>
            <AppText tone="muted">{insights.coverage.note}</AppText>
          </View>

          <View style={styles.section}>
            <AppText variant="heading2">Kamuya açık örnekte konular</AppText>
            <AppText tone="muted">
              Konular, örnekte gözlenen toplam sayıya göre sıralanır.
            </AppText>
            <View style={styles.list}>
              {insights.topics.map((topic) => (
                <HistoricalInsightCard insight={topic} key={topic.topicId} />
              ))}
            </View>
          </View>

          <InlineMessage message={insights.disclaimer} tone="info" />
          <AppButton
            label="Çalışma Planı Oluştur"
            onPress={() =>
              router.push(
                `/exams/${insights.examPackId}/${insights.subjectId}/plan` as Href,
              )
            }
          />
          <AppButton
            label="Bu veriler nasıl hazırlandı?"
            onPress={() => setMethodologyVisible(true)}
            variant="secondary"
          />
          <MethodologyModal
            insights={insights}
            onClose={() => setMethodologyVisible(false)}
            visible={methodologyVisible}
          />
        </>
      ) : null}
    </ScreenContainer>
  );
}

function MethodologyModal({
  insights,
  onClose,
  visible,
}: {
  insights: ExamSubjectInsightsResponse;
  onClose: () => void;
  visible: boolean;
}) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={visible}
    >
      <ScreenContainer>
        <View style={styles.modalHeader}>
          <AppText variant="heading1">Yöntem ve kaynaklar</AppText>
          <AppButton label="Kapat" onPress={onClose} variant="ghost" />
        </View>
        <AppText>{insights.methodology}</AppText>
        <InlineMessage message={insights.disclaimer} tone="info" />
        <View style={styles.section}>
          <AppText variant="heading2">Birincil kaynaklar</AppText>
          <AppText tone="muted">
            {"Her bağlantı ÖSYM'nin kamuya açık kısmi kitapçığına gider."}
          </AppText>
          {insights.sources.map((source) => (
            <SourceLink key={source.id} source={source} />
          ))}
        </View>
      </ScreenContainer>
    </Modal>
  );
}

function SourceLink({ source }: { source: HistoricalExamSource }) {
  return (
    <Pressable
      accessibilityHint="ÖSYM kaynağını tarayıcıda açar"
      accessibilityRole="link"
      onPress={() => void Linking.openURL(source.url)}
      style={({ pressed }) => [styles.source, pressed && styles.pressed]}
    >
      <View style={styles.sourceCopy}>
        <AppText variant="bodyMedium">{source.administrationYear}</AppText>
        <AppText tone="muted" variant="caption">
          {source.title}
        </AppText>
      </View>
      <Ionicons color={colors.primary} name="open-outline" size={20} />
    </Pressable>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
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
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  titleCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  icon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  coverageBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  section: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  source: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  sourceCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
});

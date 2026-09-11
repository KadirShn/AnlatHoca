import { OwlLoader } from "@/components/owl-loader";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  quizAttemptIdSchema,
  type QuizAttemptResult,
} from "@anlat-hoca/contracts";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { ApiClientError, getQuizAttemptDetail } from "@/api";
import { AppButton, AppText, InlineMessage, ScreenContainer } from "@/components";
import { getOrCreateInstallationId } from "@/services/installation/installation-id";
import { colors, radius, spacing } from "@/theme";

type ResultScreenState =
  | { status: "loading" }
  | { status: "success"; attempt: QuizAttemptResult }
  | { status: "error"; message: string };

export function QuizResultScreen() {
  const { attemptId } = useLocalSearchParams<{
    attemptId?: string | string[];
  }>();
  const routeAttemptId = Array.isArray(attemptId) ? undefined : attemptId;
  const attemptResult = quizAttemptIdSchema.safeParse(routeAttemptId);
  const validAttemptId = attemptResult.success ? attemptResult.data : null;
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [state, setState] = useState<ResultScreenState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    if (!validAttemptId) {
      return () => {
        active = false;
      };
    }

    void getOrCreateInstallationId()
      .then((installationId) =>
        getQuizAttemptDetail({
          attemptId: validAttemptId,
          installationId,
        }),
      )
      .then((response) => {
        if (active) {
          setState({ status: "success", attempt: response.attempt });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState({ status: "error", message: getResultErrorMessage(error) });
        }
      });

    return () => {
      active = false;
    };
  }, [loadAttempt, validAttemptId]);

  const screenState: ResultScreenState = validAttemptId
    ? state
    : { status: "error", message: "Geçerli bir quiz sonucu bulunamadı." };

  if (screenState.status === "loading") {
    return (
      <ScreenContainer
        contentContainerStyle={styles.centered}
        edges={["left", "right", "bottom"]}
      >
        <OwlLoader color={colors.primary} size="large" accessibilityLabel="Sonuçların hazırlanıyor..." />

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
          <Ionicons color={colors.danger} name="alert-circle-outline" size={38} />
        </View>
        <AppText style={styles.centerText} variant="heading3">
          Sonuç gösterilemedi
        </AppText>
        <InlineMessage message={screenState.message} tone="danger" />
        {validAttemptId ? (
          <AppButton
            label="Tekrar Dene"
            onPress={() => {
              setState({ status: "loading" });
              setLoadAttempt((current) => current + 1);
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

  return <ResultContent attempt={screenState.attempt} />;
}

function ResultContent({ attempt }: { attempt: QuizAttemptResult }) {
  return (
    <ScreenContainer edges={["left", "right", "bottom"]}>
      <View style={styles.resultHero}>
        <View style={styles.resultIcon}>
          <Ionicons
            color={colors.success}
            name="checkmark-circle-outline"
            size={44}
          />
        </View>
        <AppText variant="heading1">Quiz Sonucu</AppText>
        <AppText selectable style={styles.scoreCount} variant="heading2">
          {attempt.correctCount} / {attempt.totalQuestions} doğru
        </AppText>
        <AppText
          accessibilityLabel={"Yüzde " + attempt.scorePercent}
          selectable
          style={styles.scorePercent}
        >
          %{attempt.scorePercent}
        </AppText>
      </View>

      <View style={styles.weakSectionCard}>
        <View style={styles.cardHeading}>
          <Ionicons color={colors.accent} name="refresh-outline" size={23} />
          <AppText variant="heading3">Tekrar etmen iyi olabilir</AppText>
        </View>
        {attempt.weakSections.length > 0 ? (
          <View style={styles.weakSectionList}>
            {attempt.weakSections.map((section) => (
              <View key={section.sectionIndex} style={styles.weakSectionRow}>
                <AppText selectable>{section.title}</AppText>
                <AppText tone="muted" variant="caption">
                  {section.wrongAnswers} soruda tekrar gerekebilir
                </AppText>
              </View>
            ))}
          </View>
        ) : (
          <AppText selectable tone="muted">
            Bu quizde tekrar gerektiren belirgin bir konu görünmüyor.
          </AppText>
        )}
      </View>

      <View style={styles.review}>
        <AppText variant="heading2">Cevaplarını İncele</AppText>
        {attempt.questions.map((question, index) => (
          <View key={question.questionId} style={styles.reviewCard}>
            <View style={styles.cardHeading}>
              <Ionicons
                color={question.isCorrect ? colors.success : colors.danger}
                name={
                  question.isCorrect
                    ? "checkmark-circle"
                    : "close-circle"
                }
                size={23}
              />
              <AppText variant="bodyMedium">
                Soru {index + 1} · {question.isCorrect ? "Doğru" : "Yanlış"}
              </AppText>
            </View>
            <AppText selectable variant="heading3">
              {question.question}
            </AppText>
            <AnswerRow
              label="Senin cevabın"
              value={question.options[question.selectedOptionIndex]}
            />
            <AnswerRow
              label="Doğru cevap"
              value={question.options[question.correctOptionIndex]}
            />
            <View style={styles.explanation}>
              <AppText variant="bodyMedium">Açıklama</AppText>
              <AppText selectable tone="muted" style={styles.readableText}>
                {question.explanation}
              </AppText>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <AppButton
          label="Derse Dön"
          onPress={() =>
            router.replace({
              pathname: "/lesson/[lessonId]",
              params: { lessonId: attempt.lessonId },
            })
          }
        />
        <AppButton
          label="Quizi Tekrar Çöz"
          onPress={() =>
            router.replace({
              pathname: "/lesson/[lessonId]/quiz",
              params: { lessonId: attempt.lessonId },
            })
          }
          variant="secondary"
        />
      </View>
    </ScreenContainer>
  );
}

function AnswerRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.answerRow}>
      <AppText tone="muted" variant="caption">
        {label}
      </AppText>
      <AppText selectable>{value}</AppText>
    </View>
  );
}

function getResultErrorMessage(error: unknown): string {
  if (!(error instanceof ApiClientError)) {
    return "Kaydedilmiş quiz sonucu şu anda gösterilemiyor.";
  }

  if (error.kind === "network") {
    return "Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.";
  }

  if (error.kind === "timeout") {
    return "Sonucun yüklenmesi beklenenden uzun sürdü. Tekrar deneyebilirsin.";
  }

  if (error.serverCode === "QUIZ_ATTEMPT_NOT_FOUND") {
    return "Bu quiz sonucu bulunamadı.";
  }

  return "Kaydedilmiş quiz sonucu şu anda gösterilemiyor.";
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
  resultHero: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xxl,
  },
  resultIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  scoreCount: {
    fontVariant: ["tabular-nums"],
  },
  scorePercent: {
    color: colors.success,
    fontSize: 38,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
  },
  weakSectionCard: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.xl,
  },
  cardHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  weakSectionList: {
    gap: spacing.md,
  },
  weakSectionRow: {
    gap: spacing.xs,
  },
  review: {
    gap: spacing.lg,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.xl,
  },
  answerRow: {
    backgroundColor: colors.surfaceMuted,
    borderCurve: "continuous",
    borderRadius: radius.md,
    gap: spacing.xs,
    padding: spacing.md,
  },
  explanation: {
    gap: spacing.sm,
  },
  readableText: {
    lineHeight: 25,
  },
  actions: {
    gap: spacing.md,
  },
});

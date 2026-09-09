import Ionicons from "@expo/vector-icons/Ionicons";
import {
  lessonIdSchema,
  type PublicQuiz,
  type QuizSubmissionAnswer,
} from "@anlat-hoca/contracts";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { ApiClientError, getOrCreateQuiz, submitQuiz } from "@/api";
import { AppButton, AppText, InlineMessage, ScreenContainer } from "@/components";
import { getOrCreateInstallationId } from "@/services/installation/installation-id";
import { colors, radius, spacing } from "@/theme";

type QuizScreenState =
  | { status: "loading" }
  | { status: "success"; quiz: PublicQuiz; installationId: string }
  | { status: "error"; message: string };

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

export function LessonQuizScreen() {
  const { lessonId } = useLocalSearchParams<{
    lessonId?: string | string[];
  }>();
  const routeLessonId = Array.isArray(lessonId) ? undefined : lessonId;
  const lessonResult = lessonIdSchema.safeParse(routeLessonId);
  const validLessonId = lessonResult.success ? lessonResult.data : null;
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [state, setState] = useState<QuizScreenState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    if (!validLessonId) {
      return () => {
        active = false;
      };
    }

    void getOrCreateInstallationId()
      .then(async (installationId) => ({
        installationId,
        response: await getOrCreateQuiz({
          lessonId: validLessonId,
          installationId,
        }),
      }))
      .then(({ installationId, response }) => {
        if (active) {
          setState({
            status: "success",
            quiz: response.quiz,
            installationId,
          });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState({ status: "error", message: getQuizErrorMessage(error) });
        }
      });

    return () => {
      active = false;
    };
  }, [loadAttempt, validLessonId]);

  const screenState: QuizScreenState = validLessonId
    ? state
    : { status: "error", message: "Geçerli bir ders bulunamadı." };

  if (screenState.status === "loading") {
    return (
      <ScreenContainer
        contentContainerStyle={styles.centered}
        edges={["left", "right", "bottom"]}
      >
        <ActivityIndicator color={colors.primary} size="large" />
        <View accessibilityLiveRegion="polite" style={styles.centerCopy}>
          <AppText variant="heading3">Quiz hazırlanıyor...</AppText>
          <AppText selectable tone="muted" style={styles.centerText}>
            Sorular çalıştığın derse göre hazırlanıyor.
          </AppText>
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
          <Ionicons color={colors.danger} name="help-circle-outline" size={38} />
        </View>
        <AppText style={styles.centerText} variant="heading3">
          Quiz açılamadı
        </AppText>
        <InlineMessage message={screenState.message} tone="danger" />
        {validLessonId ? (
          <AppButton
            label="Tekrar Dene"
            onPress={() => {
              setState({ status: "loading" });
              setLoadAttempt((current) => current + 1);
            }}
          />
        ) : null}
        <AppButton
          label="Derse Dön"
          onPress={() => returnToLesson(validLessonId)}
          variant="secondary"
        />
      </ScreenContainer>
    );
  }

  return (
    <QuizViewer
      installationId={screenState.installationId}
      quiz={screenState.quiz}
    />
  );
}

function QuizViewer({
  installationId,
  quiz,
}: {
  installationId: string;
  quiz: PublicQuiz;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const question = quiz.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === quiz.questions.length;
  const isLastQuestion = currentIndex === quiz.questions.length - 1;
  const progress = (currentIndex + 1) / quiz.questions.length;

  if (!question) {
    return null;
  }

  const finishQuiz = async () => {
    if (!allAnswered || submitting) {
      setSubmissionError("Tüm soruları yanıtlamalısın.");
      return;
    }

    setSubmitting(true);
    setSubmissionError(null);

    const submissionAnswers: QuizSubmissionAnswer[] = quiz.questions.map(
      (quizQuestion) => ({
        questionId: quizQuestion.id,
        selectedOptionIndex: answers[quizQuestion.id] ?? -1,
      }),
    );

    try {
      const response = await submitQuiz({
        installationId,
        quizId: quiz.id,
        answers: submissionAnswers,
      });

      router.replace({
        pathname: "/quiz/[attemptId]/result",
        params: { attemptId: response.attempt.id },
      });
    } catch (error) {
      setSubmissionError(getSubmissionErrorMessage(error));
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer edges={["left", "right", "bottom"]}>
      <View style={styles.quizHeading}>
        <View style={styles.quizIcon}>
          <Ionicons color={colors.primary} name="checkbox-outline" size={25} />
        </View>
        <View style={styles.headingCopy}>
          <AppText selectable variant="heading2">
            {quiz.title}
          </AppText>
          <AppText tone="muted">
            Cevaplar quiz tamamlandığında birlikte değerlendirilecek.
          </AppText>
        </View>
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.progressLabels}>
          <AppText
            accessibilityLabel={`Soru ${currentIndex + 1}, toplam ${quiz.questions.length}`}
            selectable
            style={styles.counter}
            variant="bodyMedium"
          >
            {currentIndex + 1} / {quiz.questions.length}
          </AppText>
          <AppText tone="muted" variant="caption">
            {answeredCount} yanıtlandı
          </AppText>
        </View>
        <View
          accessibilityLabel={`Quiz ilerlemesi: ${currentIndex + 1} / ${quiz.questions.length}`}
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 1,
            max: quiz.questions.length,
            now: currentIndex + 1,
          }}
          style={styles.progressTrack}
        >
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <View style={styles.questionCard}>
        <AppText selectable variant="heading2">
          {question.question}
        </AppText>
        <View
          accessibilityLabel="Cevap seçenekleri"
          accessibilityRole="radiogroup"
          style={styles.options}
        >
          {question.options.map((option, index) => {
            const selected = answers[question.id] === index;

            return (
              <Pressable
                accessibilityLabel={`${OPTION_LABELS[index]}. ${option}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                key={`${question.id}:${index}`}
                onPress={() => {
                  setAnswers((current) => ({
                    ...current,
                    [question.id]: index,
                  }));
                  setSubmissionError(null);
                }}
                style={({ pressed }) => [
                  styles.option,
                  selected && styles.optionSelected,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.optionMarker,
                    selected && styles.optionMarkerSelected,
                  ]}
                >
                  <AppText
                    tone={selected ? "onPrimary" : "primary"}
                    variant="bodyMedium"
                  >
                    {OPTION_LABELS[index]}
                  </AppText>
                </View>
                <AppText selectable style={styles.optionText}>
                  {option}
                </AppText>
                {selected ? (
                  <Ionicons color={colors.primary} name="checkmark" size={22} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      {submissionError ? (
        <InlineMessage message={submissionError} tone="danger" />
      ) : null}

      {submitting ? (
        <View accessibilityLiveRegion="polite" style={styles.submitting}>
          <ActivityIndicator color={colors.primary} />
          <AppText variant="bodyMedium">Sonuçların hazırlanıyor...</AppText>
        </View>
      ) : null}

      <View style={styles.navigation}>
        <AppButton
          disabled={currentIndex === 0 || submitting}
          label="Önceki"
          onPress={() => setCurrentIndex((current) => current - 1)}
          style={styles.navigationButton}
          variant="secondary"
        />
        {isLastQuestion ? (
          <AppButton
            disabled={!allAnswered}
            label="Quizi Bitir"
            loading={submitting}
            onPress={() => void finishQuiz()}
            style={styles.navigationButton}
          />
        ) : (
          <AppButton
            disabled={submitting}
            label="Sonraki"
            onPress={() => setCurrentIndex((current) => current + 1)}
            style={styles.navigationButton}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

function returnToLesson(lessonId: string | null) {
  if (router.canGoBack()) {
    router.back();
  } else if (lessonId) {
    router.replace({ pathname: "/lesson/[lessonId]", params: { lessonId } });
  } else {
    router.replace("/");
  }
}

function getQuizErrorMessage(error: unknown): string {
  if (!(error instanceof ApiClientError)) {
    return "Quiz şu anda hazırlanamadı. Tekrar deneyebilirsin.";
  }

  if (error.kind === "network") {
    return "Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.";
  }

  if (error.kind === "timeout") {
    return "Quizin hazırlanması beklenenden uzun sürdü. Tekrar deneyebilirsin.";
  }

  if (error.serverCode === "QUIZ_IN_PROGRESS") {
    return "Quiz zaten hazırlanıyor. Biraz sonra tekrar deneyebilirsin.";
  }

  if (error.serverCode === "QUIZ_NOT_FOUND") {
    return "Bu ders için quiz oluşturulamadı.";
  }

  return "Quiz şu anda hazırlanamadı. Tekrar deneyebilirsin.";
}

function getSubmissionErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.kind === "network") {
      return "Cevaplar gönderilemedi. Bağlantını kontrol edip tekrar dene.";
    }

    if (error.kind === "timeout") {
      return "Sonuçların hazırlanması beklenenden uzun sürdü. Tekrar deneyebilirsin.";
    }
  }

  return "Cevaplar gönderilemedi. Lütfen tekrar dene.";
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
  quizHeading: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
  },
  quizIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  headingCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  progressBlock: {
    gap: spacing.sm,
  },
  progressLabels: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  counter: {
    fontVariant: ["tabular-nums"],
  },
  progressTrack: {
    backgroundColor: colors.border,
    borderRadius: radius.full,
    height: 6,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 6,
  },
  questionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xl,
    padding: spacing.xl,
  },
  options: {
    gap: spacing.md,
  },
  option: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 58,
    padding: spacing.md,
  },
  optionSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  optionMarker: {
    alignItems: "center",
    borderColor: colors.primary,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  optionMarkerSelected: {
    backgroundColor: colors.primary,
  },
  optionText: {
    flex: 1,
  },
  pressed: {
    opacity: 0.72,
  },
  submitting: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderCurve: "continuous",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  navigation: {
    flexDirection: "row",
    gap: spacing.md,
  },
  navigationButton: {
    flex: 1,
  },
});

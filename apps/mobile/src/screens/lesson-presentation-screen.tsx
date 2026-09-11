import { OwlLoader } from "@/components/owl-loader";
import Ionicons from "@expo/vector-icons/Ionicons";
import { lessonIdSchema, type Lesson } from "@anlat-hoca/contracts";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { ApiClientError, getLessonDetail } from "@/api";
import { AppButton, AppText, InlineMessage, ScreenContainer } from "@/components";
import { PresentationSlide } from "@/features/presentation/components/presentation-slide";
import { createLessonSlides, type LessonSlide } from "@/features/presentation";
import { getOrCreateInstallationId } from "@/services/installation/installation-id";
import { colors, radius, spacing } from "@/theme";

type PresentationScreenState =
  | { status: "loading" }
  | { status: "success"; lesson: Lesson }
  | { status: "error"; message: string };

export function LessonPresentationScreen() {
  const { lessonId } = useLocalSearchParams<{
    lessonId?: string | string[];
  }>();
  const routeLessonId = Array.isArray(lessonId) ? undefined : lessonId;
  const lessonResult = lessonIdSchema.safeParse(routeLessonId);
  const validLessonId = lessonResult.success ? lessonResult.data : null;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<PresentationScreenState>({
    status: "loading",
  });

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

  const screenState: PresentationScreenState = validLessonId
    ? state
    : { status: "error", message: "Geçerli bir ders bulunamadı." };

  if (screenState.status === "loading") {
    return <PresentationLoadingState />;
  }

  if (screenState.status === "error") {
    return (
      <PresentationErrorState
        canRetry={Boolean(validLessonId)}
        message={screenState.message}
        onBack={() => returnToLesson(validLessonId)}
        onRetry={() => {
          setState({ status: "loading" });
          setAttempt((current) => current + 1);
        }}
      />
    );
  }

  return <PresentationViewer lesson={screenState.lesson} />;
}

function PresentationViewer({ lesson }: { lesson: Lesson }) {
  const slides = useMemo(() => createLessonSlides(lesson), [lesson]);
  const listRef = useRef<FlatList<LessonSlide>>(null);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pageWidth = Math.max(1, width - insets.left - insets.right);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentSlideNumber = currentIndex + 1;
  const isLastSlide = currentIndex === slides.length - 1;
  const progress = currentSlideNumber / slides.length;

  useEffect(() => {
    listRef.current?.scrollToOffset({
      animated: false,
      offset: currentIndex * pageWidth,
    });
  }, [currentIndex, pageWidth]);

  const moveToSlide = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, slides.length - 1));
    listRef.current?.scrollToIndex({ animated: true, index: nextIndex });
    setCurrentIndex(nextIndex);
  };

  const handleMomentumEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.x / pageWidth,
    );
    setCurrentIndex(Math.max(0, Math.min(nextIndex, slides.length - 1)));
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={styles.safeArea}
    >
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Ders özetine dön"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => returnToLesson(lesson.id)}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Ionicons color={colors.text} name="arrow-back" size={24} />
        </Pressable>
        <AppText
          accessibilityLabel={`Slayt ${currentSlideNumber}, toplam ${slides.length}`}
          accessibilityLiveRegion="polite"
          selectable
          style={styles.slideCounter}
          variant="bodyMedium"
        >
          {currentSlideNumber} / {slides.length}
        </AppText>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.topSpacer}
        />
      </View>

      <View
        accessibilityLabel={`Sunum ilerlemesi: ${currentSlideNumber} / ${slides.length}`}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 1,
          max: slides.length,
          now: currentSlideNumber,
          text: `${currentSlideNumber} / ${slides.length}`,
        }}
        style={styles.progressTrack}
      >
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <FlatList
        accessibilityLabel="Ders sunumu slaytları"
        contentInsetAdjustmentBehavior="automatic"
        data={slides}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: pageWidth,
          offset: pageWidth * index,
          index,
        })}
        horizontal
        initialNumToRender={2}
        keyExtractor={(slide) => slide.id}
        maxToRenderPerBatch={2}
        onMomentumScrollEnd={handleMomentumEnd}
        onScrollToIndexFailed={({ index }) => {
          listRef.current?.scrollToOffset({
            animated: true,
            offset: index * pageWidth,
          });
        }}
        pagingEnabled
        ref={listRef}
        removeClippedSubviews
        renderItem={({ item }) => (
          <PresentationSlide slide={item} width={pageWidth} />
        )}
        showsHorizontalScrollIndicator={false}
        style={styles.slideList}
        windowSize={3}
      />

      <View style={styles.navigationBar}>
        <NavigationButton
          disabled={currentIndex === 0}
          icon="arrow-back"
          label="Önceki"
          onPress={() => moveToSlide(currentIndex - 1)}
        />
        <NavigationButton
          icon={isLastSlide ? "checkmark" : "arrow-forward"}
          label={isLastSlide ? "Ders Özetine Dön" : "Sonraki"}
          onPress={() =>
            isLastSlide
              ? returnToLesson(lesson.id)
              : moveToSlide(currentIndex + 1)
          }
          primary
        />
      </View>
    </SafeAreaView>
  );
}

function NavigationButton({
  disabled = false,
  icon,
  label,
  onPress,
  primary = false,
}: {
  disabled?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.navigationButton,
        primary && styles.navigationButtonPrimary,
        pressed && styles.pressed,
        disabled && styles.navigationButtonDisabled,
      ]}
    >
      {primary ? null : <Ionicons color={colors.primary} name={icon} size={21} />}
      <AppText tone={primary ? "onPrimary" : "primary"} variant="button">
        {label}
      </AppText>
      {primary ? (
        <Ionicons color={colors.textOnPrimary} name={icon} size={21} />
      ) : null}
    </Pressable>
  );
}

function PresentationLoadingState() {
  return (
    <ScreenContainer
      contentContainerStyle={styles.centered}
      edges={["top", "left", "right", "bottom"]}
    >
      <OwlLoader color={colors.primary} size="large" accessibilityLabel="Sunum açılıyor..." />

    </ScreenContainer>
  );
}

function PresentationErrorState({
  canRetry,
  message,
  onBack,
  onRetry,
}: {
  canRetry: boolean;
  message: string;
  onBack: () => void;
  onRetry: () => void;
}) {
  return (
    <ScreenContainer
      contentContainerStyle={styles.centered}
      edges={["top", "left", "right", "bottom"]}
    >
      <View style={styles.errorIcon}>
        <Ionicons color={colors.danger} name="easel-outline" size={38} />
      </View>
      <AppText selectable style={styles.centerText} variant="heading3">
        Sunum açılamadı
      </AppText>
      <InlineMessage message={message} tone="danger" />
      {canRetry ? <AppButton label="Tekrar Dene" onPress={onRetry} /> : null}
      <AppButton label="Ders Özetine Dön" onPress={onBack} variant="secondary" />
    </ScreenContainer>
  );
}

function returnToLesson(lessonId: string | null) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  if (lessonId) {
    router.replace({ pathname: "/lesson/[lessonId]", params: { lessonId } });
  } else {
    router.replace("/");
  }
}

function getReadErrorMessage(error: unknown): string {
  if (!(error instanceof ApiClientError)) {
    return "Kaydedilmiş ders şu anda gösterilemiyor.";
  }

  if (error.kind === "network") {
    return "Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.";
  }

  if (error.kind === "timeout") {
    return "Sunumun açılması beklenenden uzun sürdü. Tekrar deneyebilirsin.";
  }

  if (error.serverCode === "LESSON_NOT_FOUND") {
    return "Bu ders bulunamadı.";
  }

  return "Kaydedilmiş ders şu anda gösterilemiyor.";
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  iconButton: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radius.full,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  topSpacer: {
    height: 48,
    width: 48,
  },
  slideCounter: {
    fontVariant: ["tabular-nums"],
  },
  progressTrack: {
    backgroundColor: colors.border,
    borderRadius: radius.full,
    height: 4,
    marginHorizontal: spacing.xl,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 4,
  },
  slideList: {
    flex: 1,
  },
  navigationBar: {
    flexDirection: "row",
    gap: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  navigationButton: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  navigationButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    flex: 1.4,
  },
  navigationButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.72,
  },
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
});

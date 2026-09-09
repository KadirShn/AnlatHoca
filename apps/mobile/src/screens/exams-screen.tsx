import Ionicons from "@expo/vector-icons/Ionicons";
import type { ExamPackSummary } from "@anlat-hoca/contracts";
import { type Href, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { getExamPacks } from "@/api";
import {
  AppButton,
  AppText,
  EmptyState,
  ExamPackCard,
  InlineMessage,
  ScreenContainer,
} from "@/components";
import { colors, spacing } from "@/theme";

const LOAD_ERROR = "Sınav paketleri şu anda yüklenemedi.";

export function ExamsScreen() {
  const router = useRouter();
  const [packs, setPacks] = useState<ExamPackSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setError(null);
    setPacks(null);
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    let active = true;

    void getExamPacks()
      .then((response) => {
        if (active) setPacks(response.packs);
      })
      .catch(() => {
        if (active) setError(LOAD_ERROR);
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  return (
    <ScreenContainer edges={["left", "right", "bottom"]}>
      <View style={styles.intro}>
        <AppText variant="heading2">Sınav yolculuğunu planla</AppText>
        <AppText tone="muted">
          Hazır çalışma paketlerinden birini seç.
        </AppText>
      </View>

      {packs === null && error === null ? (
        <View accessibilityLiveRegion="polite" style={styles.status}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText tone="muted">Sınav paketleri yükleniyor.</AppText>
        </View>
      ) : null}

      {error ? (
        <View style={styles.status}>
          <InlineMessage message={error} tone="danger" />
          <AppButton label="Tekrar Dene" onPress={retry} />
        </View>
      ) : null}

      {packs?.length === 0 ? (
        <EmptyState
          description="Yayınlanmış bir sınav paketi henüz bulunmuyor."
          icon={<Ionicons color={colors.primary} name="school-outline" size={30} />}
          title="Sınav paketi bulunamadı"
        />
      ) : null}

      {packs && packs.length > 0 ? (
        <View style={styles.list}>
          {packs.map((pack) => (
            <ExamPackCard
              key={pack.id}
              onPress={() =>
                router.push(`/exams/${pack.id}` as Href)
              }
              pack={pack}
            />
          ))}
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  status: {
    alignItems: "center",
    gap: spacing.lg,
    paddingVertical: spacing.xxxl,
  },
});

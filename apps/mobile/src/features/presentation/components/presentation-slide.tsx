import Ionicons from "@expo/vector-icons/Ionicons";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppText } from "@/components";
import { colors, radius, shadows, spacing } from "@/theme";

import type { LessonSlide } from "../lesson-slide";

interface PresentationSlideProps {
  slide: LessonSlide;
  width: number;
}

export function PresentationSlide({ slide, width }: PresentationSlideProps) {
  return (
    <View style={[styles.page, { width }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        directionalLockEnabled
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View
          accessibilityLabel={getSlideAccessibilityLabel(slide)}
          style={[
            styles.card,
            slide.type === "intro" && styles.introCard,
            slide.type === "recap" && styles.recapCard,
            slide.type === "skipped-topics" && styles.skippedCard,
          ]}
        >
          <SlideContent slide={slide} />
        </View>
      </ScrollView>
    </View>
  );
}

function SlideContent({ slide }: { slide: LessonSlide }) {
  switch (slide.type) {
    case "intro":
      return (
        <>
          <View style={styles.brandRow}>
            <Ionicons
              color={colors.textOnPrimary}
              name="school-outline"
              size={22}
            />
            <AppText tone="onPrimary" variant="caption">
              ANLAT HOCA
            </AppText>
          </View>
          <View style={styles.introCopy}>
            <AppText selectable tone="onPrimary" variant="display">
              {slide.title}
            </AppText>
            <AppText selectable style={styles.introDuration} tone="onPrimary">
              Yaklaşık {slide.durationMinutes} dakikalık çalışma
            </AppText>
          </View>
          <AppText selectable style={styles.introOverview} tone="onPrimary">
            {slide.overview}
          </AppText>
        </>
      );
    case "objectives":
      return (
        <>
          <SlideEyebrow icon="flag-outline" label="DERS PLANI" />
          <AppText selectable variant="heading1">
            Bu derste öğreneceklerin
          </AppText>
          <BulletList items={slide.objectives} />
        </>
      );
    case "section-summary":
      return (
        <>
          <SlideEyebrow
            icon="bookmark-outline"
            label={`BÖLÜM ${slide.sectionNumber} / ${slide.sectionCount}`}
          />
          <View style={styles.titleBlock}>
            <AppText selectable variant="heading1">
              {slide.title}
            </AppText>
            <AppText selectable tone="primary" variant="bodyMedium">
              Yaklaşık {slide.estimatedMinutes} dk
            </AppText>
          </View>
          <BulletList items={slide.keyPoints} />
          {slide.memoryTip ? (
            <View style={styles.memoryTip}>
              <Ionicons color={colors.accent} name="bulb-outline" size={23} />
              <View style={styles.memoryTipCopy}>
                <AppText variant="bodyMedium">Hatırlama İpucu</AppText>
                <AppText selectable tone="muted">
                  {slide.memoryTip}
                </AppText>
              </View>
            </View>
          ) : null}
        </>
      );
    case "section-explanation":
      return (
        <>
          <SlideEyebrow
            icon="chatbubble-ellipses-outline"
            label={`BÖLÜM ${slide.sectionNumber}`}
          />
          <View style={styles.titleBlock}>
            <AppText selectable variant="heading2">
              {slide.title}
            </AppText>
            <AppText tone="primary" variant="bodyMedium">
              Hocanın Anlatımı
              {slide.partCount > 1
                ? ` · ${slide.partNumber}/${slide.partCount}`
                : ""}
            </AppText>
          </View>
          <AppText selectable style={styles.readableText}>
            {slide.explanation}
          </AppText>
        </>
      );
    case "recap":
      return (
        <>
          <SlideEyebrow icon="repeat-outline" label="DERSİN ÖZÜ" />
          <AppText selectable variant="heading1">
            Son Tekrar
            {slide.partCount > 1
              ? ` · ${slide.partNumber}/${slide.partCount}`
              : ""}
          </AppText>
          <BulletList items={slide.items} />
        </>
      );
    case "skipped-topics":
      return (
        <>
          <SlideEyebrow icon="time-outline" label="ŞEFFAFLIK" />
          <AppText selectable variant="heading1">
            Bu Sürede İşlemediklerimiz
          </AppText>
          <AppText selectable tone="muted" style={styles.supportingText}>
            Seçtiğin süre nedeniyle bazı daha düşük öncelikli konular bu derse
            dahil edilmedi.
          </AppText>
          <BulletList items={slide.items} icon="remove-circle-outline" />
        </>
      );
  }
}

function SlideEyebrow({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.eyebrow}>
      <Ionicons color={colors.primary} name={icon} size={19} />
      <AppText tone="primary" variant="caption">
        {label}
      </AppText>
    </View>
  );
}

function BulletList({
  items,
  icon = "checkmark-circle-outline",
}: {
  items: string[];
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.bulletList}>
      {items.map((item, index) => (
        <View key={`${index}:${item}`} style={styles.bulletRow}>
          <Ionicons color={colors.primary} name={icon} size={21} />
          <AppText selectable style={styles.bulletText}>
            {item}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function getSlideAccessibilityLabel(slide: LessonSlide): string {
  switch (slide.type) {
    case "intro":
      return `Ders sunumu başlangıcı: ${slide.title}`;
    case "objectives":
      return "Bu derste öğreneceklerin";
    case "section-summary":
      return `Bölüm ${slide.sectionNumber}: ${slide.title}`;
    case "section-explanation":
      return `${slide.title}, hocanın anlatımı, bölüm ${slide.partNumber}`;
    case "recap":
      return `Son tekrar, bölüm ${slide.partNumber}`;
    case "skipped-topics":
      return "Bu sürede işlemediklerimiz";
  }
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.xxl,
    justifyContent: "center",
    minHeight: 440,
    padding: spacing.xxxl,
    ...shadows.raised,
  },
  introCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  recapCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  skippedCard: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  introCopy: {
    gap: spacing.md,
  },
  introDuration: {
    fontWeight: "600",
    opacity: 0.9,
  },
  introOverview: {
    lineHeight: 25,
    opacity: 0.95,
  },
  eyebrow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  titleBlock: {
    gap: spacing.sm,
  },
  bulletList: {
    gap: spacing.lg,
  },
  bulletRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
  },
  bulletText: {
    flex: 1,
    lineHeight: 25,
  },
  memoryTip: {
    alignItems: "flex-start",
    backgroundColor: colors.accentSoft,
    borderCurve: "continuous",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
  },
  memoryTipCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  readableText: {
    lineHeight: 26,
  },
  supportingText: {
    lineHeight: 25,
  },
});

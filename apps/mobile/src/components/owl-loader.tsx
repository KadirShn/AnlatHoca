import { useEffect, useState } from "react";
import { AccessibilityInfo, AppState, StyleSheet, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";

import { colors } from "@/theme";

interface OwlLoaderProps {
  size?: "small" | "large";
  color?: string;
  accessibilityLabel?: string;
  decorative?: boolean;
}

/** A logo-inspired native illustration: the eyes animate, not a static image. */
export function OwlLoader({
  size = "small",
  color = colors.primaryDeep,
  accessibilityLabel = "Yükleniyor",
  decorative = false,
}: OwlLoaderProps) {
  const initialReducedMotion = useReducedMotion();
  const [reducedMotion, setReducedMotion] = useState(initialReducedMotion);
  const [active, setActive] = useState(AppState.currentState === "active");

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReducedMotion(value);
    }).catch(() => { /* Keep the synchronous system preference on failure. */ });
    const motion = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducedMotion);
    const app = AppState.addEventListener("change", (state) => setActive(state === "active"));
    return () => {
      mounted = false;
      motion.remove();
      app.remove();
    };
  }, []);

  const large = size === "large";
  const animate = active && !reducedMotion;

  return (
    <View
      accessible={!decorative}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityLiveRegion="polite"
      accessibilityState={{ busy: true }}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? "no-hide-descendants" : "yes"}
      style={[styles.frame, large ? styles.large : styles.small]}
    >
      {large ? <View style={styles.halo} /> : null}
      <View style={[styles.illustration, { transform: [{ scale: large ? 1.25 : 0.34 }] }]}>
        <View style={styles.body} />
        <View style={[styles.ear, styles.leftEar]} />
        <View style={[styles.ear, styles.rightEar]} />
        <View style={[styles.wing, styles.leftWing]} />
        <View style={[styles.wing, styles.rightWing]} />
        <View style={styles.cap} />
        <View style={styles.tassel} />
        <View style={styles.bridge} />
        {(["left", "right"] as const).map((side) => (
          <Animated.View
            key={side}
            style={[
              styles.eye,
              side === "left" ? styles.leftEye : styles.rightEye,
              { borderColor: large ? colors.primaryDeep : color },
              animate && {
                animationName: {
                  "0%, 40%, 46%, 100%": { transform: [{ scaleY: 1 }] },
                  "43%": { transform: [{ scaleY: 0.08 }] },
                },
                animationDuration: 4200,
                animationTimingFunction: "ease-in-out",
                animationIterationCount: "infinite",
              },
            ]}
          >
            <Animated.View
              style={[
                styles.orbit,
                animate && {
                  animationName: {
                    from: { transform: [{ rotate: "0deg" }] },
                    to: { transform: [{ rotate: "360deg" }] },
                  },
                  animationDuration: 2400,
                  animationTimingFunction: "linear",
                  animationIterationCount: "infinite",
                },
              ]}
            >
              <View style={[styles.pupil, !animate && styles.restingPupil]}>
                <View style={styles.reflection} />
              </View>
            </Animated.View>
          </Animated.View>
        ))}
        <View style={styles.beak} />
        <View style={[styles.page, styles.leftPage]} />
        <View style={[styles.page, styles.rightPage]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: "center", justifyContent: "center", flexShrink: 0 },
  large: { width: 148, height: 148, alignSelf: "center" },
  small: { width: 36, height: 36 },
  halo: { position: "absolute", width: 136, height: 136, borderRadius: 68, backgroundColor: colors.primarySoft },
  illustration: { position: "absolute", width: 100, height: 100 },
  body: { position: "absolute", left: 10, top: 24, width: 80, height: 66, borderRadius: 32, backgroundColor: colors.primary },
  ear: { position: "absolute", top: 24, width: 18, height: 22, backgroundColor: colors.primary },
  leftEar: { left: 12, transform: [{ rotate: "-20deg" }] },
  rightEar: { right: 12, transform: [{ rotate: "20deg" }] },
  wing: { position: "absolute", top: 59, width: 19, height: 32, borderRadius: 12, backgroundColor: colors.primaryDark },
  leftWing: { left: 5, transform: [{ rotate: "20deg" }] },
  rightWing: { right: 5, transform: [{ rotate: "-20deg" }] },
  cap: { position: "absolute", left: 20, top: 11, width: 60, height: 23, borderRadius: 5, backgroundColor: colors.primaryDeep, transform: [{ rotate: "-8deg" }] },
  tassel: { position: "absolute", right: 19, top: 19, width: 4, height: 23, borderRadius: 2, backgroundColor: colors.accent },
  bridge: { position: "absolute", left: 44, top: 49, width: 12, height: 4, backgroundColor: colors.primaryDeep },
  eye: { position: "absolute", top: 36, width: 34, height: 36, borderRadius: 18, borderWidth: 3, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  leftEye: { left: 15 },
  rightEye: { right: 15 },
  orbit: { width: 24, height: 24 },
  pupil: { position: "absolute", left: 7, top: 3, width: 11, height: 11, borderRadius: 6, backgroundColor: colors.primaryDeep },
  restingPupil: { top: 6 },
  reflection: { position: "absolute", top: 2, left: 2, width: 3, height: 3, borderRadius: 2, backgroundColor: colors.surface },
  beak: { position: "absolute", left: 45, top: 67, width: 10, height: 12, borderRadius: 3, backgroundColor: colors.accent, transform: [{ rotate: "45deg" }] },
  page: { position: "absolute", top: 82, width: 42, height: 13, backgroundColor: colors.accentSoft, borderBottomWidth: 4, borderColor: colors.primaryDeep, borderRadius: 3 },
  leftPage: { left: 9, transform: [{ rotate: "10deg" }] },
  rightPage: { right: 9, transform: [{ rotate: "-10deg" }] },
});

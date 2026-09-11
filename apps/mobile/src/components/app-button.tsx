import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, radius, spacing } from "@/theme";

import { AppText } from "./app-text";
import { OwlLoader } from "./owl-loader";

type AppButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "accent";

interface AppButtonProps {
  label: string;
  onPress?: () => void;
  variant?: AppButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function AppButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  leftIcon,
  accessibilityLabel,
  style,
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  const selectedVariant = variantStyles[variant];

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        selectedVariant.container,
        pressed && selectedVariant.pressed,
        disabled && !loading && styles.disabled,
        style,
      ]}
    >
        <View style={styles.content}>
          {loading ? (
            <View pointerEvents="none" style={styles.loadingOverlay}>
              <OwlLoader color={selectedVariant.spinnerColor} decorative />
            </View>
          ) : leftIcon}
          <AppText
            accessible={!loading}
            accessibilityElementsHidden={loading}
            importantForAccessibility={loading ? "no-hide-descendants" : "auto"}
            variant="button"
            tone={selectedVariant.textTone}
            style={[styles.label, loading && styles.hiddenLabel, disabled && !loading && styles.disabledText]}
          >
            {label}
          </AppText>
        </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radius.lg,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  hiddenLabel: { opacity: 0 },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.primaryDark,
    boxShadow: "0 6px 16px rgba(22, 163, 74, 0.20)",
  },
  accent: {
    backgroundColor: colors.accent,
  },
  accentPressed: {
    backgroundColor: colors.accentPressed,
  },
  primaryPressed: {
    backgroundColor: colors.primaryDeep,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  secondaryPressed: {
    backgroundColor: colors.border,
  },
  ghost: {
    backgroundColor: colors.transparent,
  },
  ghostPressed: {
    backgroundColor: colors.primarySoft,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  dangerPressed: {
    backgroundColor: "#991B1B",
  },
  disabled: {
    boxShadow: "none",
    backgroundColor: colors.disabled,
    borderColor: colors.disabled,
    opacity: 0.72,
  },
  disabledText: {
    color: colors.disabledText,
  },
  label: {
    flexShrink: 1,
    textAlign: "center",
  },
});

const variantStyles = {
  accent: {
    container: styles.accent,
    pressed: styles.accentPressed,
    textTone: "default" as const,
    spinnerColor: colors.primaryDeep,
  },
  primary: {
    container: styles.primary,
    pressed: styles.primaryPressed,
    textTone: "onPrimary" as const,
    spinnerColor: colors.textOnPrimary,
  },
  secondary: {
    container: styles.secondary,
    pressed: styles.secondaryPressed,
    textTone: "primary" as const,
    spinnerColor: colors.primary,
  },
  ghost: {
    container: styles.ghost,
    pressed: styles.ghostPressed,
    textTone: "primary" as const,
    spinnerColor: colors.primary,
  },
  danger: {
    container: styles.danger,
    pressed: styles.dangerPressed,
    textTone: "onPrimary" as const,
    spinnerColor: colors.textOnPrimary,
  },
};

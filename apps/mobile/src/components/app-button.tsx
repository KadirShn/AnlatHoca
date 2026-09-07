import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, radius, spacing } from "@/theme";

import { AppText } from "./app-text";

type AppButtonVariant = "primary" | "secondary" | "ghost";

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
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={selectedVariant.spinnerColor} />
      ) : (
        <View style={styles.content}>
          {leftIcon}
          <AppText
            variant="button"
            tone={selectedVariant.textTone}
            style={isDisabled ? styles.disabledText : undefined}
          >
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radius.md,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.primary,
  },
  primaryPressed: {
    backgroundColor: colors.primaryPressed,
  },
  secondary: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
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
  disabled: {
    backgroundColor: colors.disabled,
    borderColor: colors.disabled,
    opacity: 0.72,
  },
  disabledText: {
    color: colors.disabledText,
  },
});

const variantStyles = {
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
};

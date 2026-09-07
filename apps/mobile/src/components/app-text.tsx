import type { PropsWithChildren } from "react";
import { StyleSheet, Text, type TextProps } from "react-native";

import {
  colors,
  typography,
  type TypographyVariant,
} from "@/theme";

type AppTextProps = PropsWithChildren<
  TextProps & {
    variant?: TypographyVariant;
    tone?: "default" | "muted" | "primary" | "danger" | "onPrimary";
  }
>;

const tones = StyleSheet.create({
  default: { color: colors.text },
  muted: { color: colors.textMuted },
  primary: { color: colors.primary },
  danger: { color: colors.danger },
  onPrimary: { color: colors.textOnPrimary },
});

export function AppText({
  variant = "body",
  tone = "default",
  style,
  children,
  ...props
}: AppTextProps) {
  return (
    <Text style={[typography[variant], tones[tone], style]} {...props}>
      {children}
    </Text>
  );
}

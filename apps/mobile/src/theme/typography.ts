import type { TextStyle } from "react-native";

export const typography = {
  display: {
    fontSize: 32,
    lineHeight: 39,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  heading1: {
    fontSize: 26,
    lineHeight: 33,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  heading2: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "800",
    letterSpacing: -0.25,
  },
  heading3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
  },
  bodyMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  button: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600",
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

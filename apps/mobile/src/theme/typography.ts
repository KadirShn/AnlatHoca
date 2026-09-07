import type { TextStyle } from "react-native";

export const typography = {
  display: {
    fontSize: 32,
    lineHeight: 39,
    fontWeight: "700",
  },
  heading1: {
    fontSize: 26,
    lineHeight: 33,
    fontWeight: "700",
  },
  heading2: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "700",
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

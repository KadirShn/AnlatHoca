import type { ViewStyle } from "react-native";

export const shadows = {
  card: {
    boxShadow: "0 3px 14px rgba(6, 78, 59, 0.07)",
  },
  raised: {
    boxShadow: "0 12px 30px rgba(6, 78, 59, 0.14)",
  },
} as const satisfies Record<string, ViewStyle>;

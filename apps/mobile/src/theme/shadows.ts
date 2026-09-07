import type { ViewStyle } from "react-native";

export const shadows = {
  card: {
    boxShadow: "0 2px 10px rgba(15, 23, 42, 0.06)",
  },
  raised: {
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.10)",
  },
} as const satisfies Record<string, ViewStyle>;

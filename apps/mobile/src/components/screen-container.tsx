import type { PropsWithChildren } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  SafeAreaView,
  type Edge,
} from "react-native-safe-area-context";

import { colors, spacing } from "@/theme";

import { BrandBackdrop } from "./brand-backdrop";

interface ScreenContainerProps extends PropsWithChildren {
  scroll?: boolean;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

const defaultEdges: Edge[] = ["top", "left", "right"];

export function ScreenContainer({
  children,
  scroll = true,
  edges = defaultEdges,
  style,
  contentContainerStyle,
}: ScreenContainerProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, style]}>
      <BrandBackdrop />
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentContainerStyle]}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill, contentContainerStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 780,
    gap: spacing.xxl,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  fill: {
    flex: 1,
  },
});

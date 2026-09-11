import { StyleSheet, View } from "react-native";

import { colors } from "@/theme";

export function BrandBackdrop() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    >
      <View style={[styles.orb, styles.topOrb]} />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    opacity: 0.28,
    position: "absolute",
  },
  topOrb: {
    height: 240,
    right: -145,
    top: -95,
    width: 240,
  },
  middleOrb: {
    height: 180,
    left: -132,
    top: 360,
    width: 180,
  },
  bottomOrb: {
    bottom: -150,
    height: 280,
    right: -170,
    width: 280,
  },
});

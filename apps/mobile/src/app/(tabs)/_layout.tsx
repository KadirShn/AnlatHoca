import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, spacing, typography } from "@/theme";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarActiveBackgroundColor: colors.primarySoftMuted,
        tabBarItemStyle: {
          borderRadius: 16,
          marginHorizontal: spacing.xs,
        },
        tabBarLabelStyle: {
          fontSize: typography.caption.fontSize,
          fontWeight: typography.caption.fontWeight,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64 + Math.max(insets.bottom, spacing.sm),
          paddingBottom: Math.max(insets.bottom, spacing.sm),
          paddingTop: spacing.sm,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarAccessibilityLabel: "Ana Sayfa sekmesi",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons color={color} name={focused ? "home" : "home-outline"} size={size} />
          ),
          title: "Ana Sayfa",
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          tabBarAccessibilityLabel: "Kütüphane sekmesi",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons color={color} name={focused ? "library" : "library-outline"} size={size} />
          ),
          title: "Kütüphane",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarAccessibilityLabel: "Ayarlar sekmesi",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons color={color} name={focused ? "settings" : "settings-outline"} size={size} />
          ),
          title: "Ayarlar",
        }}
      />
    </Tabs>
  );
}

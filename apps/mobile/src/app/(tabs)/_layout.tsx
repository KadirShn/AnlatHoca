import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";

import { colors, spacing, typography } from "@/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: typography.caption.fontSize,
          fontWeight: typography.caption.fontWeight,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: spacing.sm,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarAccessibilityLabel: "Ana Sayfa sekmesi",
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="home" size={size} />
          ),
          title: "Ana Sayfa",
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          tabBarAccessibilityLabel: "Kütüphane sekmesi",
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="library" size={size} />
          ),
          title: "Kütüphane",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarAccessibilityLabel: "Ayarlar sekmesi",
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="settings" size={size} />
          ),
          title: "Ayarlar",
        }}
      />
    </Tabs>
  );
}

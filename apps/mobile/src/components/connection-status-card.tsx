import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";

import {
  type AppBootstrapState,
  useAppBootstrap,
} from "@/providers/app-bootstrap-provider";
import { colors, radius, spacing } from "@/theme";

import { AppButton } from "./app-button";
import { AppText } from "./app-text";

type StatusIcon = ComponentProps<typeof Ionicons>["name"];

interface StatusPresentation {
  title: string;
  description: string;
  icon: StatusIcon;
  color: string;
}

function getStatusPresentation(state: AppBootstrapState): StatusPresentation {
  switch (state.status) {
    case "initializing":
      return {
        title: "Bağlantı kontrol ediliyor",
        description: "Çevrim içi özellikler hazırlanıyor.",
        icon: "time-outline",
        color: colors.accent,
      };
    case "ready":
      return {
        title: "Çevrim içi",
        description: "Çevrim içi özellikler kullanılabilir.",
        icon: "checkmark-circle-outline",
        color: colors.success,
      };
    case "offline":
      return {
        title: "Bağlantı kurulamadı",
        description:
          state.reason === "timeout"
            ? "Sunucu zamanında yanıt vermedi."
            : "İnternet bağlantını kontrol edip tekrar dene.",
        icon: "cloud-offline-outline",
        color: colors.danger,
      };
    case "configurationError":
      return {
        title: "Çevrim içi özellikler kullanılamıyor",
        description: "Uygulama desteğine başvurup daha sonra tekrar dene.",
        icon: "warning-outline",
        color: colors.accent,
      };
    case "error":
      return {
        title: "Bağlantı durumu doğrulanamadı",
        description: "Beklenmeyen bir sorun oluştu. Yeniden deneyebilirsin.",
        icon: "alert-circle-outline",
        color: colors.danger,
      };
  }
}

export function ConnectionStatusCard() {
  const { retry, state } = useAppBootstrap();
  const presentation = getStatusPresentation(state);
  const isLoading = state.status === "initializing";

  return (
    <View style={styles.card}>
      <View style={styles.statusRow}>
        <View style={styles.iconContainer}>
          <Ionicons
            color={presentation.color}
            name={presentation.icon}
            size={24}
          />
        </View>
        <View style={styles.copy}>
          <AppText variant="heading3">{presentation.title}</AppText>
          <AppText tone="muted">{presentation.description}</AppText>
        </View>
      </View>
      <AppButton
        label="Durumu Tekrar Kontrol Et"
        loading={isLoading}
        onPress={retry}
        variant="secondary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  statusRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
  },
  iconContainer: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
});

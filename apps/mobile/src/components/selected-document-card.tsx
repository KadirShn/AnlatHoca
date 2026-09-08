import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";

import {
  formatFileSize,
  type SelectedDocument,
} from "@/services/documents";
import { colors, radius, spacing } from "@/theme";

import { AppButton } from "./app-button";
import { AppText } from "./app-text";

interface SelectedDocumentCardProps {
  document: SelectedDocument;
  loading: boolean;
  onRemove: () => void;
  onReplace: () => void;
}

export function SelectedDocumentCard({
  document,
  loading,
  onRemove,
  onReplace,
}: SelectedDocumentCardProps) {
  return (
    <View accessibilityLabel={`${document.name}, analize hazır`} style={styles.card}>
      <View style={styles.fileRow}>
        <View style={styles.fileIcon}>
          <Ionicons color={colors.danger} name="document-text" size={30} />
        </View>
        <View style={styles.fileDetails}>
          <AppText tone="danger" variant="caption">
            PDF
          </AppText>
          <AppText numberOfLines={2} selectable variant="bodyMedium">
            {document.name}
          </AppText>
          <AppText selectable tone="muted" variant="caption">
            {formatFileSize(document.size)}
          </AppText>
        </View>
      </View>

      <View style={styles.statusRow}>
        <Ionicons color={colors.success} name="checkmark-circle" size={22} />
        <AppText variant="bodyMedium">Analize hazır</AppText>
      </View>

      <View style={styles.actions}>
        <AppButton
          accessibilityLabel="Seçili PDF dosyasını değiştir"
          disabled={loading}
          label="Değiştir"
          loading={loading}
          onPress={onReplace}
          style={styles.action}
          variant="secondary"
        />
        <AppButton
          accessibilityLabel="Seçili PDF dosyasını kaldır"
          disabled={loading}
          label="Kaldır"
          onPress={onRemove}
          style={styles.action}
          variant="ghost"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.xl,
    padding: spacing.xl,
  },
  fileRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  fileIcon: {
    alignItems: "center",
    backgroundColor: colors.dangerSoft,
    borderCurve: "continuous",
    borderRadius: radius.md,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  fileDetails: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  statusRow: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderCurve: "continuous",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  action: {
    flex: 1,
  },
});

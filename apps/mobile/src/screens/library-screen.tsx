import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppText, EmptyState, ScreenContainer } from "@/components";
import { colors, spacing } from "@/theme";

export function LibraryScreen() {
  const router = useRouter();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <AppText variant="heading1">Kütüphane</AppText>
        <AppText tone="muted">
          Oluşturduğun dersler ve çalışma notları burada düzenli bir şekilde
          görünecek.
        </AppText>
      </View>
      <EmptyState
        actionLabel="İlk Dersini Oluştur"
        description="Bir PDF notu yüklediğinde oluşturulan derslerine buradan ulaşabileceksin."
        icon={
          <Ionicons
            color={colors.primary}
            name="book-outline"
            size={30}
          />
        }
        onActionPress={() => router.push("/document/upload")}
        title="Kütüphanen henüz boş"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
});

import { OwlLoader } from "@/components/owl-loader";
import Ionicons from "@expo/vector-icons/Ionicons";
import type {
  LibraryDocumentSummary,
  LibraryLessonSummary,
} from "@anlat-hoca/contracts";
import {
  DEFAULT_LIBRARY_ITEM_LIMIT,
} from "@anlat-hoca/config";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AppButton,
  AppText,
  BrandBackdrop,
  EmptyState,
  InlineMessage,
  LibraryDocumentCard,
  LibraryLessonCard,
  PageIntro,
} from "@/components";
import { useLibraryData } from "@/hooks/use-library-data";
import { colors, radius, spacing } from "@/theme";

type LibraryTab = "lessons" | "documents";
type LibraryItem = LibraryLessonSummary | LibraryDocumentSummary;

export function LibraryScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<LibraryTab>("lessons");
  const { data, error, isLoading, isRefreshing, refresh, retry } =
    useLibraryData({
      lessonLimit: DEFAULT_LIBRARY_ITEM_LIMIT,
      documentLimit: DEFAULT_LIBRARY_ITEM_LIMIT,
    });
  const items: LibraryItem[] =
    selectedTab === "lessons"
      ? (data?.lessons ?? [])
      : (data?.documents ?? []);

  const renderItem = ({ item }: { item: LibraryItem }) => {
    if ("durationMinutes" in item) {
      return (
        <LibraryLessonCard
          lesson={item}
          onPress={() =>
            router.push({
              pathname: "/lesson/[lessonId]",
              params: { lessonId: item.id },
            })
          }
        />
      );
    }

    return (
      <LibraryDocumentCard
        document={item}
        onPress={() =>
          router.push(
            item.status === "analyzed"
              ? {
                  pathname: "/document/[documentId]/analysis",
                  params: { documentId: item.id },
                }
              : {
                  pathname: "/document/ready",
                  params: { documentId: item.id },
                },
          )
        }
      />
    );
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <BrandBackdrop />
      <FlatList
        contentContainerStyle={[
          styles.content,
          items.length === 0 && styles.fillContent,
        ]}
        contentInsetAdjustmentBehavior="automatic"
        data={items}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <LibraryEmptyContent
            error={error}
            isLoading={isLoading}
            onCreate={() => router.push("/document/upload")}
            onRetry={() => void retry()}
            tab={selectedTab}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerArea}>
            <PageIntro
              description="Kaydettiğin derslere ve yüklediğin belgelere yeniden ulaş."
              icon={<Ionicons color={colors.primary} name="library" size={26} />}
              title="Kütüphane"
            />
            <View
              accessibilityLabel="Kütüphane bölümleri"
              accessibilityRole="tablist"
              style={styles.tabs}
            >
              <TabButton
                label="Dersler"
                onPress={() => setSelectedTab("lessons")}
                selected={selectedTab === "lessons"}
              />
              <TabButton
                label="Belgeler"
                onPress={() => setSelectedTab("documents")}
                selected={selectedTab === "documents"}
              />
            </View>
            {error && data !== null ? (
              <InlineMessage message={error} tone="danger" />
            ) : null}
          </View>
        }
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void refresh()}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function TabButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tab,
        selected && styles.selectedTab,
        pressed && styles.pressedTab,
      ]}
    >
      <AppText tone={selected ? "onPrimary" : "muted"} variant="bodyMedium">
        {label}
      </AppText>
    </Pressable>
  );
}

function LibraryEmptyContent({
  error,
  isLoading,
  onCreate,
  onRetry,
  tab,
}: {
  error: string | null;
  isLoading: boolean;
  onCreate: () => void;
  onRetry: () => void;
  tab: LibraryTab;
}) {
  if (isLoading) {
    return (
      <View accessibilityLiveRegion="polite" style={styles.status}>
        <OwlLoader color={colors.primary} size="large" accessibilityLabel="Kütüphane yükleniyor." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.status}>
        <InlineMessage message={error} tone="danger" />
        <AppButton label="Tekrar Dene" onPress={onRetry} />
      </View>
    );
  }

  return (
    <EmptyState
      actionLabel="İlk Dersini Oluştur"
      description={
        tab === "lessons"
          ? "Bir PDF yükleyip ders oluşturduğunda burada görünecek."
          : "Yüklediğin PDF belgeleri burada görünecek."
      }
      icon={
        <Ionicons
          color={colors.primary}
          name={tab === "lessons" ? "book-outline" : "document-outline"}
          size={30}
        />
      }
      onActionPress={onCreate}
      title={tab === "lessons" ? "Henüz dersin yok" : "Henüz belgen yok"}
    />
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
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  fillContent: {
    flexGrow: 1,
  },
  headerArea: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  tabs: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    padding: spacing.xs,
  },
  tab: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radius.sm,
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  selectedTab: {
    backgroundColor: colors.primaryDark,
    boxShadow: "0 4px 10px rgba(22, 163, 74, 0.18)",
  },
  pressedTab: {
    opacity: 0.78,
  },
  separator: {
    height: spacing.md,
  },
  status: {
    gap: spacing.lg,
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
  },
});

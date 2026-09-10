import Ionicons from "@expo/vector-icons/Ionicons";
import {
  lessonIdSchema,
  type TeacherMessage,
  type TeacherThread,
} from "@anlat-hoca/contracts";
import { MAX_TEACHER_QUESTION_CHARS } from "@anlat-hoca/config";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ApiClientError,
  openTeacherThread,
  sendTeacherMessage,
} from "@/api";
import { AppButton, AppText, InlineMessage } from "@/components";
import { getOrCreateInstallationId } from "@/services/installation/installation-id";
import { colors, radius, spacing, typography } from "@/theme";

type ScreenState =
  | { status: "loading" }
  | { status: "success"; thread: TeacherThread }
  | { status: "error"; message: string };

export function LessonTeacherScreen() {
  const { lessonId } = useLocalSearchParams<{
    lessonId?: string | string[];
  }>();
  const routeLessonId = Array.isArray(lessonId) ? undefined : lessonId;
  const lessonResult = lessonIdSchema.safeParse(routeLessonId);
  const validLessonId = lessonResult.success ? lessonResult.data : null;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<ScreenState>({ status: "loading" });
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const installationIdRef = useRef<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    let active = true;

    if (!validLessonId) {
      return () => {
        active = false;
      };
    }

    void getOrCreateInstallationId()
      .then((installationId) => {
        installationIdRef.current = installationId;
        return openTeacherThread({ installationId, lessonId: validLessonId });
      })
      .then((response) => {
        if (active) {
          setState({ status: "success", thread: response.thread });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState({ status: "error", message: getLoadErrorMessage(error) });
        }
      });

    return () => {
      active = false;
    };
  }, [attempt, validLessonId]);

  const screenState: ScreenState = validLessonId
    ? state
    : { status: "error", message: "Geçerli bir ders bulunamadı." };

  const trimmedDraft = draft.trim();
  const canSend =
    screenState.status === "success" &&
    !sending &&
    trimmedDraft.length > 0 &&
    trimmedDraft.length <= MAX_TEACHER_QUESTION_CHARS;

  async function handleSend() {
    if (!canSend || state.status !== "success" || !validLessonId) {
      return;
    }

    const installationId = installationIdRef.current;

    if (!installationId) {
      setSendError("Kurulum bilgisi hazır değil. Ekranı yeniden açıp dene.");
      return;
    }

    setSending(true);
    setSendError(null);

    try {
      const response = await sendTeacherMessage({
        installationId,
        lessonId: validLessonId,
        message: trimmedDraft,
      });

      setState((current) =>
        current.status === "success"
          ? {
              status: "success",
              thread: {
                ...current.thread,
                messages: [
                  ...current.thread.messages,
                  response.userMessage,
                  response.message,
                ],
              },
            }
          : current,
      );
      setDraft("");
    } catch (error) {
      setSendError(getSendErrorMessage(error));
    } finally {
      setSending(false);
    }
  }

  if (screenState.status === "loading") {
    return (
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText variant="heading3">Hoca hazırlanıyor</AppText>
          <AppText tone="muted">Kaydedilmiş konuşma getiriliyor.</AppText>
        </View>
      </SafeAreaView>
    );
  }

  if (screenState.status === "error") {
    return (
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
        <View style={styles.centered}>
          <View style={styles.teacherIcon}>
            <Ionicons color={colors.primary} name="chatbubbles-outline" size={34} />
          </View>
          <AppText variant="heading3">Konuşma açılamadı</AppText>
          <InlineMessage message={screenState.message} tone="danger" />
          {validLessonId ? (
            <AppButton
              label="Tekrar Dene"
              onPress={() => {
                setState({ status: "loading" });
                setAttempt((current) => current + 1);
              }}
            />
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
        style={styles.fill}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.lessonHeader}>
            <View style={styles.teacherIconSmall}>
              <Ionicons color={colors.primary} name="school-outline" size={23} />
            </View>
            <View style={styles.headerCopy}>
              <AppText variant="heading3">Hocaya Sor</AppText>
              <AppText numberOfLines={2} tone="muted" variant="caption">
                {screenState.thread.lessonTitle}
              </AppText>
            </View>
          </View>

          <View style={styles.aiNotice}>
            <Ionicons color={colors.textMuted} name="information-circle-outline" size={18} />
            <AppText selectable tone="muted" variant="caption" style={styles.aiNoticeCopy}>
              Sorun ve ilgili ders bağlamı, yanıt oluşturulurken bir yapay zekâ
              hizmeti tarafından işlenir.
            </AppText>
          </View>

          {screenState.thread.messages.length === 0 ? (
            <TeacherIntroduction />
          ) : (
            screenState.thread.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onFollowUp={(question) => {
                  setDraft(question);
                  setSendError(null);
                  inputRef.current?.focus();
                }}
              />
            ))
          )}

          {sending ? (
            <View accessibilityLiveRegion="polite" style={styles.thinkingRow}>
              <ActivityIndicator color={colors.primary} size="small" />
              <AppText tone="muted">Hoca düşünüyor...</AppText>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.composer}>
          {sendError ? <InlineMessage message={sendError} tone="danger" /> : null}
          <TextInput
            ref={inputRef}
            accessibilityLabel="Hocaya sorunu yaz"
            editable={!sending}
            multiline
            onChangeText={(value) => {
              setDraft(value);
              if (sendError) {
                setSendError(null);
              }
            }}
            placeholder="Bu derste anlamadığın yeri sor..."
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            textAlignVertical="top"
            value={draft}
          />
          <View style={styles.composerFooter}>
            {draft.length >= 1_000 ? (
              <AppText
                tone={
                  trimmedDraft.length > MAX_TEACHER_QUESTION_CHARS
                    ? "danger"
                    : "muted"
                }
                variant="caption"
              >
                {trimmedDraft.length}/{MAX_TEACHER_QUESTION_CHARS}
              </AppText>
            ) : (
              <View />
            )}
            <AppButton
              accessibilityLabel="Soruyu gönder"
              disabled={!canSend}
              label="Sor"
              loading={sending}
              onPress={() => void handleSend()}
              style={styles.sendButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TeacherIntroduction() {
  return (
    <View style={styles.introCard}>
      <Ionicons color={colors.primary} name="chatbubble-ellipses-outline" size={28} />
      <AppText variant="heading3">Bu ders hakkında neyi merak ediyorsun?</AppText>
      <AppText tone="muted" style={styles.readableText}>
        Yalnızca çalıştığın ders içeriğine dayanarak açıklama yapabilirim. Derste
        yer almayan bir konuysa bunu açıkça söylerim.
      </AppText>
    </View>
  );
}

function MessageBubble({
  message,
  onFollowUp,
}: {
  message: TeacherMessage;
  onFollowUp: (question: string) => void;
}) {
  const isUser = message.role === "user";

  return (
    <View style={[styles.messageGroup, isUser && styles.userMessageGroup]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.teacherBubble]}>
        <AppText selectable tone={isUser ? "onPrimary" : "default"}>
          {message.content}
        </AppText>
      </View>

      {!isUser && message.relatedSections.length > 0 ? (
        <View style={styles.metadataGroup}>
          <AppText tone="muted" variant="caption">İlgili ders bölümleri</AppText>
          <View style={styles.chips}>
            {message.relatedSections.map((section) => (
              <View key={section.sectionIndex} style={styles.sectionChip}>
                <AppText tone="primary" variant="caption">
                  {section.sectionIndex + 1}. {section.title}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {!isUser && message.suggestedFollowUps.length > 0 ? (
        <View style={styles.metadataGroup}>
          <AppText tone="muted" variant="caption">Devam etmek istersen</AppText>
          <View style={styles.followUps}>
            {message.suggestedFollowUps.map((question) => (
              <Pressable
                accessibilityRole="button"
                key={question}
                onPress={() => onFollowUp(question)}
                style={({ pressed }) => [
                  styles.followUpChip,
                  pressed && styles.followUpChipPressed,
                ]}
              >
                <AppText tone="primary" variant="caption">{question}</AppText>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function getLoadErrorMessage(error: unknown): string {
  if (!(error instanceof ApiClientError)) {
    return "Kaydedilmiş konuşma şu anda gösterilemiyor.";
  }

  if (error.kind === "network") {
    return "Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.";
  }

  if (error.kind === "timeout") {
    return "Konuşmanın yüklenmesi beklenenden uzun sürdü.";
  }

  if (error.serverCode === "LESSON_NOT_FOUND") {
    return "Bu ders bulunamadı.";
  }

  return "Kaydedilmiş konuşma şu anda gösterilemiyor.";
}

function getSendErrorMessage(error: unknown): string {
  if (!(error instanceof ApiClientError)) {
    return "Hoca şu anda yanıt veremedi. Sorun korunuyor; tekrar deneyebilirsin.";
  }

  if (error.serverCode === "USAGE_LIMIT_REACHED") {
    return "Bugünkü 30 soru sınırına ulaştın. Yarın tekrar sorabilirsin.";
  }

  if (error.serverCode === "INVALID_TEACHER_MESSAGE") {
    return "Sorunu 1–1200 karakter arasında yazmalısın.";
  }

  if (error.kind === "timeout") {
    return "Hoca yanıt verirken süre doldu. Sorun korunuyor; otomatik olarak yeniden gönderilmedi.";
  }

  if (error.kind === "network") {
    return "Sunucuya ulaşılamadı. Sorun korunuyor; bağlantını kontrol edip tekrar dene.";
  }

  return "Hoca şu anda yanıt veremedi. Sorun korunuyor; tekrar deneyebilirsin.";
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  fill: { flex: 1 },
  centered: {
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.xl,
  },
  teacherIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  messagesContent: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  lessonHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  teacherIconSmall: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  headerCopy: { flex: 1, gap: spacing.xs },
  aiNotice: {
    alignItems: "flex-start",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  aiNoticeCopy: { flex: 1 },
  introCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
  },
  readableText: { lineHeight: 24 },
  messageGroup: { alignItems: "flex-start", gap: spacing.sm },
  userMessageGroup: { alignItems: "flex-end" },
  bubble: {
    borderRadius: radius.lg,
    maxWidth: "88%",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  userBubble: { backgroundColor: colors.primary },
  teacherBubble: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  metadataGroup: { gap: spacing.sm, maxWidth: "94%" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  sectionChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  followUps: { gap: spacing.sm },
  followUpChip: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  followUpChipPressed: { backgroundColor: colors.primarySoft },
  thinkingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  composer: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    maxHeight: 140,
    minHeight: 72,
    padding: spacing.md,
  },
  composerFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sendButton: { minWidth: 104 },
});

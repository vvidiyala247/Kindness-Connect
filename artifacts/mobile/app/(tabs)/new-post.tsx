import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { useCreatePost, getListPostsQueryKey } from "@workspace/api-client-react";
import type { CreatePostBody } from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";

type PostType = CreatePostBody["type"];

const POST_TYPES: { value: PostType; label: string; desc: string; icon: "heart" | "sun" }[] = [
  {
    value: "support",
    label: "Need Support",
    desc: "Share something you're going through and receive encouragement",
    icon: "heart",
  },
  {
    value: "kindness_act",
    label: "Kindness Act",
    desc: "Share something kind you witnessed or experienced",
    icon: "sun",
  },
];

const MAX_CHARS = 500;

export default function NewPostScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [postType, setPostType] = useState<PostType>("kindness_act");
  const [content, setContent] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const createPostMutation = useCreatePost({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
        setContent("");
        setErrorMsg("");
        router.replace("/(tabs)");
      },
      onError: (err) => {
        setErrorMsg(
          (err as { data?: { error?: string } })?.data?.error ?? "Failed to post. Please try again."
        );
      },
    },
  });

  const handlePost = () => {
    setErrorMsg("");
    const trimmed = content.trim();
    if (!trimmed) {
      setErrorMsg("Please write something before posting.");
      return;
    }
    createPostMutation.mutate({ data: { type: postType, content: trimmed } });
  };

  const selectedType = POST_TYPES.find((t) => t.value === postType)!;
  const typeColor = postType === "support" ? colors.support : colors.accent;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 8,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Post</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          What type of post?
        </Text>

        <View style={styles.typeRow}>
          {POST_TYPES.map((t) => {
            const active = postType === t.value;
            const c = t.value === "support" ? colors.support : colors.accent;
            return (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.typeCard,
                  {
                    borderColor: active ? c : colors.border,
                    backgroundColor: active ? c + "14" : colors.card,
                    flex: 1,
                  },
                ]}
                onPress={() => setPostType(t.value)}
              >
                <Feather name={t.icon} size={20} color={active ? c : colors.mutedForeground} />
                <Text
                  style={[
                    styles.typeCardLabel,
                    { color: active ? c : colors.foreground },
                  ]}
                >
                  {t.label}
                </Text>
                <Text style={[styles.typeCardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {t.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.textareaSection}>
          <View style={styles.textareaHeader}>
            <View style={[styles.typePill, { backgroundColor: typeColor + "22" }]}>
              <Feather name={selectedType.icon} size={12} color={typeColor} />
              <Text style={[styles.typePillText, { color: typeColor }]}>
                {selectedType.label}
              </Text>
            </View>
            <Text style={[styles.charCount, { color: content.length > MAX_CHARS * 0.9 ? colors.destructive : colors.mutedForeground }]}>
              {content.length}/{MAX_CHARS}
            </Text>
          </View>

          <TextInput
            style={[
              styles.textarea,
              {
                borderColor: colors.border,
                backgroundColor: colors.card,
                color: colors.foreground,
              },
            ]}
            placeholder={
              postType === "support"
                ? "Share what you're going through — no judgment here..."
                : "Share a moment of kindness you witnessed or experienced..."
            }
            placeholderTextColor={colors.mutedForeground}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={MAX_CHARS}
            textAlignVertical="top"
          />
        </View>

        {errorMsg ? (
          <View style={[styles.errorBox, { backgroundColor: colors.destructive + "18" }]}>
            <Feather name="alert-circle" size={14} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{errorMsg}</Text>
          </View>
        ) : null}

        <View style={[styles.privacyNote, { backgroundColor: colors.muted }]}>
          <Feather name="shield" size={14} color={colors.accent} />
          <Text style={[styles.privacyText, { color: colors.mutedForeground }]}>
            Posted anonymously as your animal nickname. No real names shared.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: typeColor, opacity: createPostMutation.isPending ? 0.7 : 1 },
          ]}
          onPress={handlePost}
          disabled={createPostMutation.isPending}
        >
          {createPostMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="send" size={18} color="#fff" />
              <Text style={styles.submitText}>Post Anonymously</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  typeRow: {
    flexDirection: "row",
    gap: 10,
  },
  typeCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    gap: 6,
  },
  typeCardLabel: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  typeCardDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 15,
  },
  divider: {
    height: 1,
  },
  textareaSection: {
    gap: 10,
  },
  textareaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  typePillText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  charCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  textarea: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    minHeight: 140,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  privacyText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 17,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  submitText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});

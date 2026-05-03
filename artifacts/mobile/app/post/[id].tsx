import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import {
  useGetPost,
  useListComments,
  useCreateComment,
  getListCommentsQueryKey,
} from "@workspace/api-client-react";
import type { Comment } from "@workspace/api-client-react";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { CommentItem } from "@/components/CommentItem";
import { ReportModal } from "@/components/ReportModal";
import { EmptyState } from "@/components/EmptyState";

const MAX_COMMENT = 300;

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [commentText, setCommentText] = useState("");
  const [reportTarget, setReportTarget] = useState<{ type: "post" | "comment"; id: string } | null>(null);

  const { data: post, isLoading: postLoading } = useGetPost(id ?? "");
  const { data: comments = [], isLoading: commentsLoading } = useListComments(id ?? "");

  const createCommentMutation = useCreateComment({
    mutation: {
      onSuccess: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCommentText("");
        queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(id ?? "") });
      },
    },
  });

  const handleSendComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed || !id) return;
    createCommentMutation.mutate({ id, data: { content: trimmed } });
  };

  const handleReportComment = (comment: Comment) => {
    setReportTarget({ type: "comment", id: comment.id });
  };

  const isSupport = post?.type === "support";
  const typeColor = isSupport ? colors.support : colors.accent;

  const header = post ? (
    <View style={[styles.postContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.postHeader}>
        <View style={[styles.typeBadge, { backgroundColor: typeColor + "22" }]}>
          <Feather name={isSupport ? "heart" : "sun"} size={12} color={typeColor} />
          <Text style={[styles.typeText, { color: typeColor }]}>
            {isSupport ? "Need Support" : "Kindness Act"}
          </Text>
        </View>
        {post.authorId !== user?.id && (
          <TouchableOpacity onPress={() => setReportTarget({ type: "post", id: post.id })}>
            <Feather name="flag" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.postContent, { color: colors.foreground }]}>{post.content}</Text>
      <View style={styles.postFooter}>
        <Text style={[styles.authorNickname, { color: colors.mutedForeground }]}>
          {post.authorNickname}
        </Text>
        <View style={styles.postStats}>
          <Feather name="heart" size={13} color={colors.mutedForeground} />
          <Text style={[styles.statText, { color: colors.mutedForeground }]}>{post.likeCount}</Text>
          <Feather name="message-circle" size={13} color={colors.mutedForeground} />
          <Text style={[styles.statText, { color: colors.mutedForeground }]}>{comments.length}</Text>
        </View>
      </View>
      <View style={[styles.commentsLabel, { borderTopColor: colors.border }]}>
        <Text style={[styles.commentsLabelText, { color: colors.mutedForeground }]}>
          {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
        </Text>
      </View>
    </View>
  ) : null;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <View
        style={[
          styles.topBar,
          {
            paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 8,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.foreground }]}>Post</Text>
        <View style={{ width: 38 }} />
      </View>

      {postLoading || commentsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={header}
          renderItem={({ item }) => (
            <CommentItem
              comment={item}
              currentUserId={user?.id}
              onReport={handleReportComment}
            />
          )}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 80,
          }}
          scrollEnabled={!!comments.length || !!post}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            post ? (
              <EmptyState
                icon="message-circle"
                title="No comments yet"
                subtitle="Be the first to offer support or encouragement"
              />
            ) : null
          }
        />
      )}

      <View
        style={[
          styles.inputBar,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 8),
          },
        ]}
      >
        <TextInput
          style={[
            styles.commentInput,
            { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground },
          ]}
          placeholder="Add a kind comment..."
          placeholderTextColor={colors.mutedForeground}
          value={commentText}
          onChangeText={setCommentText}
          maxLength={MAX_COMMENT}
          multiline
          returnKeyType="send"
          testID="comment-input"
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            {
              backgroundColor: commentText.trim() ? typeColor : colors.muted,
              opacity: createCommentMutation.isPending ? 0.7 : 1,
            },
          ]}
          onPress={handleSendComment}
          disabled={!commentText.trim() || createCommentMutation.isPending}
          accessibilityLabel="Send comment"
        >
          {createCommentMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name="send" size={16} color={commentText.trim() ? "#fff" : colors.mutedForeground} />
          )}
        </TouchableOpacity>
      </View>

      {reportTarget && (
        <ReportModal
          visible={!!reportTarget}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          onClose={() => setReportTarget(null)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  postContainer: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  typeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  postContent: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
  },
  postFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  authorNickname: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  postStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginRight: 4,
  },
  commentsLabel: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  commentsLabelText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
});

import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type { Post } from "@workspace/api-client-react";
import { useLikePost } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListPostsQueryKey } from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onReport?: (post: Post) => void;
}

const TYPE_LABELS: Record<string, string> = {
  support: "Need Support",
  kindness_act: "Kindness Act",
};

export function PostCard({ post, currentUserId, onReport }: PostCardProps) {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(post.likeCount);

  const likeMutation = useLikePost({
    mutation: {
      onSuccess: (updated) => {
        setLocalLikes(updated.likeCount);
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
      },
      onError: () => {
        setLiked((prev) => !prev);
        setLocalLikes((prev) => (liked ? prev - 1 : prev + 1));
      },
    },
  });

  const handleLike = () => {
    if (likeMutation.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLiked((prev) => !prev);
    setLocalLikes((prev) => (liked ? prev - 1 : prev + 1));
    likeMutation.mutate({ id: post.id });
  };

  const isSupport = post.type === "support";
  const typeColor = isSupport ? colors.support : colors.accent;
  const timeAgo = formatTimeAgo(post.createdAt);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/post/${post.id}`)}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={[styles.typeBadge, { backgroundColor: typeColor + "22" }]}>
          <Feather
            name={isSupport ? "heart" : "sun"}
            size={12}
            color={typeColor}
          />
          <Text style={[styles.typeLabel, { color: typeColor }]}>
            {TYPE_LABELS[post.type] ?? post.type}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.nickname, { color: colors.mutedForeground }]}>
            {post.authorNickname}
          </Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {timeAgo}
          </Text>
        </View>
      </View>

      <Text style={[styles.content, { color: colors.foreground }]} numberOfLines={4}>
        {post.content}
      </Text>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.likeBtn} onPress={handleLike}>
          {likeMutation.isPending ? (
            <ActivityIndicator size="small" color={typeColor} />
          ) : (
            <Feather
              name={liked ? "heart" : "heart"}
              size={16}
              color={liked ? colors.support : colors.mutedForeground}
            />
          )}
          <Text
            style={[
              styles.likeCount,
              { color: liked ? colors.support : colors.mutedForeground },
            ]}
          >
            {localLikes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.commentBtn} onPress={() => router.push(`/post/${post.id}`)}>
          <Feather name="message-circle" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>

        {post.authorId !== currentUserId && onReport && (
          <TouchableOpacity style={styles.reportBtn} onPress={() => onReport(post)}>
            <Feather name="flag" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

function formatTimeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "flex-end",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  typeLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  nickname: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  time: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  content: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  likeCount: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  commentBtn: {
    padding: 2,
  },
  reportBtn: {
    marginLeft: "auto",
    padding: 2,
  },
});

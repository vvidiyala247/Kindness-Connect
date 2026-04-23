import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Comment } from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onReport?: (comment: Comment) => void;
}

export function CommentItem({ comment, currentUserId, onReport }: CommentItemProps) {
  const colors = useColors();
  const timeAgo = formatTimeAgo(comment.createdAt);

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.accent + "33" }]}>
          <Text style={[styles.avatarText, { color: colors.accent }]}>
            {comment.authorNickname.slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={styles.meta}>
          <Text style={[styles.nickname, { color: colors.foreground }]}>
            {comment.authorNickname}
          </Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>{timeAgo}</Text>
        </View>
        {comment.authorId !== currentUserId && onReport && (
          <TouchableOpacity onPress={() => onReport(comment)} style={styles.reportBtn}>
            <Feather name="flag" size={13} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.content, { color: colors.foreground }]}>{comment.content}</Text>
    </View>
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
  container: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  meta: {
    flex: 1,
    gap: 1,
  },
  nickname: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  time: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  reportBtn: {
    padding: 4,
  },
  content: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    paddingLeft: 42,
  },
});

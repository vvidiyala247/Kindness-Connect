import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

import { useListPosts, getListPostsQueryKey } from "@workspace/api-client-react";
import type { Post, ListPostsParams } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/EmptyState";
import { ReportModal } from "@/components/ReportModal";

type FilterType = "all" | "support" | "kindness_act";

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "support", label: "Support" },
  { key: "kindness_act", label: "Kindness" },
];

export default function FeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<FilterType>("all");
  const [reportTarget, setReportTarget] = useState<{ type: "post" | "comment"; id: string } | null>(null);

  const params: ListPostsParams = {
    page: 1,
    limit: 30,
    ...(filter !== "all" ? { type: filter } : {}),
  };

  const { data, isLoading, isError, refetch, isRefetching } = useListPosts(params);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleReportPost = (post: Post) => {
    setReportTarget({ type: "post", id: post.id });
  };

  const posts = data?.posts ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Feed</Text>
        <TouchableOpacity
          style={[styles.notifBtn, { backgroundColor: colors.card }]}
          onPress={() => queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() })}
        >
          <Feather name="refresh-cw" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <View
        style={[styles.filterRow, { borderBottomColor: colors.border }]}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === f.key ? colors.primary : colors.muted,
              },
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.filterLabel,
                { color: filter === f.key ? colors.primaryForeground : colors.mutedForeground },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <EmptyState
            icon="alert-circle"
            title="Couldn't load posts"
            subtitle="Pull down to refresh"
          />
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={[styles.retryText, { color: colors.primaryForeground }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              currentUserId={user?.id}
              onReport={handleReportPost}
            />
          )}
          contentContainerStyle={[
            styles.list,
            {
              paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90),
            },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={!!isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          scrollEnabled={!!posts.length}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="feather"
              title="No posts yet"
              subtitle="Be the first to share a kindness act or ask for support"
            />
          }
        />
      )}

      {reportTarget && (
        <ReportModal
          visible={!!reportTarget}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          onClose={() => setReportTarget(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
  },
  filterLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  list: {
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});

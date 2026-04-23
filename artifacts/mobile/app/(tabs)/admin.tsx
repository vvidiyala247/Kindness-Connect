import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  useListAdminReports,
  useUpdateAdminReport,
  getListAdminReportsQueryKey,
} from "@workspace/api-client-react";
import type { Report } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { useColors } from "@/hooks/useColors";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";

type StatusFilter = "pending" | "reviewed" | "actioned";

const STATUS_FILTERS: StatusFilter[] = ["pending", "reviewed", "actioned"];

const REASON_LABELS: Record<string, string> = {
  bullying: "Bullying",
  harmful: "Harmful",
  inappropriate: "Inappropriate",
  spam: "Spam",
  other: "Other",
};

function ReportCard({
  report,
  onAction,
}: {
  report: Report;
  onAction: (id: string, hideContent: boolean, suspendUser: boolean) => void;
}) {
  const colors = useColors();
  const isPending = report.status === "pending";

  return (
    <View
      style={[
        styles.reportCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.reportHeader}>
        <View
          style={[
            styles.reasonBadge,
            { backgroundColor: colors.destructive + "18" },
          ]}
        >
          <Text style={[styles.reasonText, { color: colors.destructive }]}>
            {REASON_LABELS[report.reason] ?? report.reason}
          </Text>
        </View>
        <Text style={[styles.targetType, { color: colors.mutedForeground }]}>
          {report.targetType === "post" ? "Post" : "Comment"}
        </Text>
      </View>

      <View style={styles.reportMeta}>
        <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>
          Target ID:
        </Text>
        <Text style={[styles.metaValue, { color: colors.foreground }]} numberOfLines={1}>
          {report.targetId}
        </Text>
      </View>

      <View style={styles.reportMeta}>
        <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Status:</Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                report.status === "pending"
                  ? colors.warning + "33"
                  : report.status === "actioned"
                    ? colors.destructive + "22"
                    : colors.accent + "33",
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  report.status === "pending"
                    ? colors.kindnessForeground
                    : report.status === "actioned"
                      ? colors.destructive
                      : colors.accent,
              },
            ]}
          >
            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
          </Text>
        </View>
      </View>

      {isPending && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.accent + "22", borderColor: colors.accent }]}
            onPress={() => onAction(report.id, false, false)}
          >
            <Feather name="check" size={14} color={colors.accent} />
            <Text style={[styles.actionText, { color: colors.accent }]}>Dismiss</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.warning + "22", borderColor: colors.kindnessForeground }]}
            onPress={() => onAction(report.id, true, false)}
          >
            <Feather name="eye-off" size={14} color={colors.kindnessForeground} />
            <Text style={[styles.actionText, { color: colors.kindnessForeground }]}>Hide</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive }]}
            onPress={() => onAction(report.id, true, true)}
          >
            <Feather name="slash" size={14} color={colors.destructive} />
            <Text style={[styles.actionText, { color: colors.destructive }]}>Suspend</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: reports = [], isLoading, isRefetching, refetch } = useListAdminReports(
    { status: statusFilter }
  );

  const updateMutation = useUpdateAdminReport({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: getListAdminReportsQueryKey() });
      },
    },
  });

  const handleAction = (id: string, hideContent: boolean, suspendUser: boolean) => {
    updateMutation.mutate({
      id,
      data: {
        status: hideContent ? "actioned" : "reviewed",
        hideContent,
        suspendUser,
      },
    });
  };

  if (user?.role !== "admin") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <EmptyState
            icon="lock"
            title="Access restricted"
            subtitle="This area is for school admins only"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Moderation</Text>
        <View style={[styles.adminBadge, { backgroundColor: colors.primary + "22" }]}>
          <Feather name="shield" size={12} color={colors.primary} />
          <Text style={[styles.adminBadgeText, { color: colors.primary }]}>Admin</Text>
        </View>
      </View>

      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        {STATUS_FILTERS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.filterChip,
              { backgroundColor: statusFilter === s ? colors.primary : colors.muted },
            ]}
            onPress={() => setStatusFilter(s)}
          >
            <Text
              style={[
                styles.filterLabel,
                { color: statusFilter === s ? colors.primaryForeground : colors.mutedForeground },
              ]}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReportCard report={item} onAction={handleAction} />
          )}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90) },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={!!isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          scrollEnabled={!!reports.length}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="check-circle"
              title={statusFilter === "pending" ? "No pending reports" : `No ${statusFilter} reports`}
              subtitle={statusFilter === "pending" ? "The community is looking great!" : undefined}
            />
          }
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
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  adminBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
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
    padding: 16,
    gap: 12,
  },
  reportCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reasonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  reasonText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  targetType: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  reportMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    width: 64,
  },
  metaValue: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  useListAdminReports,
  useUpdateAdminReport,
  getListAdminReportsQueryKey,
  useCreateSchool,
  useListSchools,
  getListSchoolsQueryKey,
} from "@workspace/api-client-react";
import type { Report, School } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { useColors } from "@/hooks/useColors";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";

type StatusFilter = "pending" | "reviewed" | "actioned";
type Section = "reports" | "schools";

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
        <View style={[styles.reasonBadge, { backgroundColor: colors.destructive + "18" }]}>
          <Text style={[styles.reasonText, { color: colors.destructive }]}>
            {REASON_LABELS[report.reason] ?? report.reason}
          </Text>
        </View>
        <Text style={[styles.targetType, { color: colors.mutedForeground }]}>
          {report.targetType}
        </Text>
      </View>

      <View style={styles.reportMeta}>
        <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Target ID</Text>
        <Text style={[styles.metaValue, { color: colors.foreground }]} numberOfLines={1}>
          {report.targetId}
        </Text>
      </View>

      <View style={styles.reportMeta}>
        <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Status</Text>
        <View style={[styles.statusBadge, { backgroundColor: isPending ? colors.kindness : colors.muted }]}>
          <Text style={[styles.statusText, { color: isPending ? colors.kindnessForeground : colors.mutedForeground }]}>
            {report.status}
          </Text>
        </View>
      </View>

      {isPending && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.border }]}
            onPress={() => onAction(report.id, false, false)}
          >
            <Feather name="check" size={14} color={colors.foreground} />
            <Text style={[styles.actionText, { color: colors.foreground }]}>Mark Reviewed</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.destructive + "40", backgroundColor: colors.destructive + "10" }]}
            onPress={() => onAction(report.id, true, false)}
          >
            <Feather name="eye-off" size={14} color={colors.destructive} />
            <Text style={[styles.actionText, { color: colors.destructive }]}>Hide Content</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.destructive + "40", backgroundColor: colors.destructive + "10" }]}
            onPress={() => onAction(report.id, true, true)}
          >
            <Feather name="user-x" size={14} color={colors.destructive} />
            <Text style={[styles.actionText, { color: colors.destructive }]}>Suspend User</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function SchoolCard({ school }: { school: School }) {
  const colors = useColors();
  const [codeVisible, setCodeVisible] = useState(false);

  return (
    <View style={[styles.schoolCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.schoolCardIcon, { backgroundColor: colors.primary + "14" }]}>
        <Feather name="home" size={18} color={colors.primary} />
      </View>
      <View style={styles.schoolCardText}>
        <Text style={[styles.schoolCardName, { color: colors.foreground }]}>{school.name}</Text>
        <TouchableOpacity
          style={styles.codeRow}
          onPress={() => {
            Haptics.selectionAsync();
            setCodeVisible((v) => !v);
          }}
        >
          <Feather name={codeVisible ? "eye-off" : "eye"} size={12} color={colors.mutedForeground} />
          <Text style={[styles.schoolCardCode, { color: colors.mutedForeground }]}>
            {codeVisible ? `Join code: ${school.joinCode}` : "Tap to reveal join code"}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.activeBadge, { backgroundColor: school.isActive ? colors.kindness : colors.muted }]}>
        <Text style={[styles.activeBadgeText, { color: school.isActive ? colors.kindnessForeground : colors.mutedForeground }]}>
          {school.isActive ? "Active" : "Inactive"}
        </Text>
      </View>
    </View>
  );
}

function CreateSchoolModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [created, setCreated] = useState<School | null>(null);
  const [codeVisible, setCodeVisible] = useState(false);

  const mutation = useCreateSchool({
    mutation: {
      onSuccess: (school) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: getListSchoolsQueryKey() });
        setCreated(school);
      },
    },
  });

  const handleClose = () => {
    setName("");
    setCreated(null);
    setCodeVisible(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View
        style={[styles.modalContainer, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}
      >
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            {created ? "School Created!" : "Create School"}
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.modalClose}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
          {created ? (
            <View style={styles.createdView}>
              <View style={[styles.createdIcon, { backgroundColor: colors.kindness }]}>
                <Feather name="check-circle" size={36} color={colors.kindnessForeground} />
              </View>
              <Text style={[styles.createdName, { color: colors.foreground }]}>{created.name}</Text>
              <Text style={[styles.createdLabel, { color: colors.mutedForeground }]}>
                Share this join code with students:
              </Text>
              <TouchableOpacity
                style={[styles.codeBox, { backgroundColor: colors.primary + "12", borderColor: colors.primary }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setCodeVisible((v) => !v);
                }}
              >
                <Text style={[styles.codeBoxValue, { color: colors.primary }]}>
                  {codeVisible ? created.joinCode : "••••••"}
                </Text>
                <Feather name={codeVisible ? "eye-off" : "eye"} size={16} color={colors.primary} />
              </TouchableOpacity>
              <Text style={[styles.codeHint, { color: colors.mutedForeground }]}>
                Tap to reveal • Students enter this at registration
              </Text>
              <TouchableOpacity
                style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                onPress={handleClose}
              >
                <Text style={[styles.doneBtnText, { color: colors.primaryForeground }]}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formView}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>School Name</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card },
                ]}
                placeholder="e.g. Springfield Middle School"
                placeholderTextColor={colors.mutedForeground}
                value={name}
                onChangeText={setName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (name.trim()) mutation.mutate({ data: { name: name.trim() } });
                }}
              />
              <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>
                A unique 6-character join code will be automatically generated.
              </Text>
              {mutation.isError && (
                <View style={[styles.errorBox, { backgroundColor: colors.destructive + "18" }]}>
                  <Feather name="alert-circle" size={14} color={colors.destructive} />
                  <Text style={[styles.errorText, { color: colors.destructive }]}>
                    Failed to create school. Try again.
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: colors.primary, opacity: mutation.isPending || !name.trim() ? 0.6 : 1 },
                ]}
                onPress={() => {
                  if (name.trim()) mutation.mutate({ data: { name: name.trim() } });
                }}
                disabled={mutation.isPending || !name.trim()}
              >
                {mutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Feather name="plus" size={16} color={colors.primaryForeground} />
                    <Text style={[styles.submitBtnText, { color: colors.primaryForeground }]}>Create School</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [section, setSection] = useState<Section>("reports");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [createSchoolOpen, setCreateSchoolOpen] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: reports = [], isLoading: reportsLoading, isRefetching: reportsRefetching, refetch: refetchReports } =
    useListAdminReports({ status: statusFilter });

  const { data: schools = [], isLoading: schoolsLoading, isRefetching: schoolsRefetching, refetch: refetchSchools } =
    useListSchools();

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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Admin</Text>
        <View style={[styles.adminBadge, { backgroundColor: colors.primary + "22" }]}>
          <Feather name="shield" size={12} color={colors.primary} />
          <Text style={[styles.adminBadgeText, { color: colors.primary }]}>Admin</Text>
        </View>
      </View>

      <View style={[styles.segmentRow, { borderBottomColor: colors.border }]}>
        {(["reports", "schools"] as Section[]).map((s) => (
          <Pressable
            key={s}
            style={[
              styles.segment,
              {
                borderBottomColor: section === s ? colors.primary : "transparent",
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => setSection(s)}
          >
            <Feather
              name={s === "reports" ? "flag" : "home"}
              size={14}
              color={section === s ? colors.primary : colors.mutedForeground}
            />
            <Text
              style={[
                styles.segmentLabel,
                { color: section === s ? colors.primary : colors.mutedForeground },
              ]}
            >
              {s === "reports" ? "Reports" : "Schools"}
            </Text>
          </Pressable>
        ))}
      </View>

      {section === "reports" ? (
        <>
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

          {reportsLoading ? (
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
                  refreshing={!!reportsRefetching}
                  onRefresh={refetchReports}
                  tintColor={colors.primary}
                />
              }
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
        </>
      ) : (
        <>
          <View style={[styles.schoolsToolbar, { borderBottomColor: colors.border }]}>
            <Text style={[styles.schoolsCount, { color: colors.mutedForeground }]}>
              {schoolsLoading ? "Loading…" : `${schools.length} school${schools.length !== 1 ? "s" : ""}`}
            </Text>
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: colors.primary }]}
              onPress={() => setCreateSchoolOpen(true)}
            >
              <Feather name="plus" size={15} color={colors.primaryForeground} />
              <Text style={[styles.createBtnText, { color: colors.primaryForeground }]}>New School</Text>
            </TouchableOpacity>
          </View>

          {schoolsLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={schools}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <SchoolCard school={item} />}
              contentContainerStyle={[
                styles.list,
                { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90) },
              ]}
              refreshControl={
                <RefreshControl
                  refreshing={!!schoolsRefetching}
                  onRefresh={refetchSchools}
                  tintColor={colors.primary}
                />
              }
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <EmptyState
                  icon="home"
                  title="No schools yet"
                  subtitle="Tap 'New School' to create the first one"
                />
              }
            />
          )}
        </>
      )}

      <CreateSchoolModal
        visible={createSchoolOpen}
        onClose={() => setCreateSchoolOpen(false)}
      />
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
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  adminBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  segmentRow: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  segmentLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999 },
  filterLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  list: { padding: 16, gap: 12 },
  reportCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10, marginBottom: 12 },
  reportHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reasonBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  reasonText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  targetType: { fontSize: 12, fontFamily: "Inter_500Medium" },
  reportMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaLabel: { fontSize: 12, fontFamily: "Inter_500Medium", width: 64 },
  metaValue: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 4 },
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
  actionText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  schoolsToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  schoolsCount: { fontSize: 13, fontFamily: "Inter_400Regular" },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  createBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  schoolCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  schoolCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  schoolCardText: { flex: 1 },
  schoolCardName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  codeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  schoolCardCode: { fontSize: 12, fontFamily: "Inter_400Regular" },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  activeBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalClose: { padding: 4 },
  modalBody: { padding: 24, gap: 16 },
  createdView: { alignItems: "center", gap: 14, paddingTop: 16 },
  createdIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  createdName: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  createdLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 4,
  },
  codeBoxValue: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: 4 },
  codeHint: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  doneBtn: {
    alignSelf: "stretch",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  doneBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  formView: { gap: 12, paddingTop: 8 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  textInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  fieldHint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10 },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  submitBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});

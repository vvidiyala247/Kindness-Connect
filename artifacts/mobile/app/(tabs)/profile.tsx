import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import {
  useGetMe,
  useListPosts,
  useUpdateMe,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import type { Post } from "@workspace/api-client-react";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { KindnessScore } from "@/components/KindnessScore";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/EmptyState";

const SCORE_MILESTONES = [
  { points: 0, label: "Seedling", icon: "feather" as const },
  { points: 10, label: "Helper", icon: "heart" as const },
  { points: 25, label: "Friend", icon: "users" as const },
  { points: 50, label: "Beacon", icon: "sun" as const },
  { points: 100, label: "Champion", icon: "award" as const },
];

function getMilestone(score: number) {
  for (let i = SCORE_MILESTONES.length - 1; i >= 0; i--) {
    if (score >= SCORE_MILESTONES[i].points) return SCORE_MILESTONES[i];
  }
  return SCORE_MILESTONES[0];
}

const AVATARS = [
  "🦊", "🐼", "🦁", "🐨", "🐸", "🦋",
  "🐬", "🦜", "🐢", "🦔", "🐙", "🦩",
  "🦦", "🦥", "🦘", "🐳", "🦭", "🐝",
  "🦚", "🦉", "🐧", "🐠", "🦄", "🐉",
  "🌸", "🌻", "🌈", "⭐", "🍀", "🎈",
  "🎵", "🌙", "☀️", "🌺", "🌊", "🎀",
];

function AvatarPickerModal({
  visible,
  currentAvatar,
  onSelect,
  onClose,
}: {
  visible: boolean;
  currentAvatar: string | null | undefined;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.pickerContainer,
          { backgroundColor: colors.background, paddingTop: insets.top + 16 },
        ]}
      >
        <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.pickerTitle, { color: colors.foreground }]}>
            Choose Your Avatar
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.pickerClose} accessibilityLabel="Close avatar picker">
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.pickerSubtitle, { color: colors.mutedForeground }]}>
          Pick an emoji that represents you
        </Text>

        <ScrollView
          contentContainerStyle={[
            styles.pickerGrid,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {AVATARS.map((emoji) => {
            const isSelected = currentAvatar === emoji;
            return (
              <Pressable
                key={emoji}
                style={[
                  styles.avatarOption,
                  {
                    backgroundColor: isSelected
                      ? colors.primary + "22"
                      : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelect(emoji);
                }}
              >
                <Text style={styles.avatarEmoji}>{emoji}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

function AvatarDisplay({
  avatar,
  size,
  primaryColor,
  backgroundColor,
  onPress,
}: {
  avatar: string | null | undefined;
  size: number;
  primaryColor: string;
  backgroundColor: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.avatarCircle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
      ]}
    >
      {avatar ? (
        <Text style={{ fontSize: size * 0.5 }}>{avatar}</Text>
      ) : (
        <Feather name="user" size={size * 0.45} color={primaryColor} />
      )}
      {onPress && (
        <View
          style={[
            styles.avatarEditBadge,
            { backgroundColor: primaryColor },
          ]}
        >
          <Feather name="edit-2" size={9} color="#fff" />
        </View>
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user: authUser, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: profile } = useGetMe();
  const displayUser = profile ?? authUser;

  const { data: postsPage } = useListPosts({ page: 1, limit: 50 });
  const myPosts: Post[] = (postsPage?.posts ?? []).filter(
    (p) => p.authorId === displayUser?.id
  );

  const milestone = getMilestone(displayUser?.kindnessScore ?? 0);

  const updateMeMutation = useUpdateMe({
    mutation: {
      onSuccess: (updatedUser) => {
        setPickerOpen(false);
        queryClient.setQueryData(getGetMeQueryKey(), updatedUser);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        refreshUser().catch(() => {});
      },
    },
  });

  const handleAvatarSelect = (emoji: string) => {
    updateMeMutation.mutate({ data: { avatar: emoji } });
  };

  const { logout } = useAuth();

  const handleLogoutConfirmed = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
        },
      },
    ]);
  };

  const profileHeader = (
    <View style={styles.headerContent}>
      <View
        style={[
          styles.profileCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <AvatarDisplay
          avatar={displayUser?.avatar}
          size={88}
          primaryColor={colors.primary}
          backgroundColor={colors.primary + "22"}
          onPress={() => setPickerOpen(true)}
        />

        {updateMeMutation.isPending && (
          <Text style={[styles.savingText, { color: colors.mutedForeground }]}>
            Saving…
          </Text>
        )}

        <Text style={[styles.nickname, { color: colors.foreground }]}>
          {displayUser?.nickname ?? "…"}
        </Text>
        <Text style={[styles.roleBadge, { color: colors.mutedForeground }]}>
          {displayUser?.role === "admin" ? "School Admin" : "Student"}
        </Text>
        {displayUser && <KindnessScore score={displayUser.kindnessScore} size="lg" />}

        <TouchableOpacity
          style={[
            styles.changeAvatarBtn,
            { borderColor: colors.border, backgroundColor: colors.muted },
          ]}
          onPress={() => setPickerOpen(true)}
        >
          <Text style={[styles.changeAvatarText, { color: colors.foreground }]}>
            {displayUser?.avatar ? "Change Avatar" : "Choose Avatar"}
          </Text>
          <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.milestoneCard,
          { backgroundColor: colors.kindness + "33", borderColor: colors.kindness },
        ]}
      >
        <Feather name={milestone.icon} size={22} color={colors.kindnessForeground} />
        <View style={styles.milestoneText}>
          <Text style={[styles.milestoneTitle, { color: colors.kindnessForeground }]}>
            {milestone.label}
          </Text>
          <Text style={[styles.milestoneSub, { color: colors.kindnessForeground + "aa" }]}>
            Your current kindness rank
          </Text>
        </View>
      </View>

      <View style={[styles.section, { borderTopColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          How kindness points work
        </Text>
        <View style={styles.pointsGrid}>
          {[
            { icon: "edit-3", label: "Post", pts: "+5" },
            { icon: "heart", label: "Like received", pts: "+1" },
            { icon: "message-circle", label: "Comment", pts: "+2" },
          ].map((item) => (
            <View
              key={item.label}
              style={[
                styles.pointItem,
                { backgroundColor: colors.muted, borderRadius: colors.radius },
              ]}
            >
              <Feather name={item.icon as "edit-3"} size={16} color={colors.primary} />
              <Text style={[styles.pointLabel, { color: colors.foreground }]}>
                {item.label}
              </Text>
              <Text style={[styles.pointValue, { color: colors.accent }]}>{item.pts}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.section, { borderTopColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          My Posts ({myPosts.length})
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topBar,
          {
            paddingTop: topPad + 8,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
        <TouchableOpacity onPress={handleLogoutConfirmed}>
          <Feather name="log-out" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={myPosts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={profileHeader}
        renderItem={({ item }) => (
          <View style={styles.postWrap}>
            <PostCard post={item} currentUserId={displayUser?.id} />
          </View>
        )}
        contentContainerStyle={{
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90),
        }}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        ListEmptyComponent={
          <View style={styles.postWrap}>
            <EmptyState
              icon="edit-3"
              title="No posts yet"
              subtitle="Share your first kindness act or ask for support"
            />
          </View>
        }
        ListFooterComponent={
          <View style={styles.postWrap}>
            <TouchableOpacity
              style={[styles.logoutBtn, { borderColor: colors.border }]}
              onPress={handleLogoutConfirmed}
            >
              <Feather name="log-out" size={16} color={colors.destructive} />
              <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <AvatarPickerModal
        visible={pickerOpen}
        currentAvatar={displayUser?.avatar}
        onSelect={handleAvatarSelect}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
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
  headerContent: {
    gap: 16,
    padding: 20,
  },
  profileCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  avatarCircle: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  savingText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: -4,
  },
  nickname: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  roleBadge: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  changeAvatarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 4,
  },
  changeAvatarText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  milestoneCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  milestoneText: {
    gap: 2,
  },
  milestoneTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  milestoneSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  pointsGrid: {
    gap: 8,
  },
  pointItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
  },
  pointLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  pointValue: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  postWrap: {
    paddingHorizontal: 16,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 4,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  pickerContainer: { flex: 1 },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  pickerClose: { padding: 4 },
  pickerSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
  },
  pickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  avatarOption: {
    width: 68,
    height: 68,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 34,
  },
});

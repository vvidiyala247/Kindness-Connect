import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGetMe } from "@workspace/api-client-react";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { KindnessScore } from "@/components/KindnessScore";

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

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user: authUser, logout } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: profile } = useGetMe();
  const displayUser = profile ?? authUser;

  const milestone = getMilestone(displayUser?.kindnessScore ?? 0);

  const handleLogout = () => {
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90),
      }}
      showsVerticalScrollIndicator={false}
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Feather name="log-out" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary + "22" }]}>
            <Feather name="user" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.nickname, { color: colors.foreground }]}>
            {displayUser?.nickname ?? "…"}
          </Text>
          <Text style={[styles.roleBadge, { color: colors.mutedForeground }]}>
            {displayUser?.role === "admin" ? "School Admin" : "Student"}
          </Text>
          {displayUser && <KindnessScore score={displayUser.kindnessScore} size="lg" />}
        </View>

        <View style={[styles.milestoneCard, { backgroundColor: colors.kindness + "33", borderColor: colors.kindness }]}>
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

        <View style={[styles.section, { borderColor: colors.border }]}>
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
                style={[styles.pointItem, { backgroundColor: colors.muted, borderRadius: colors.radius }]}
              >
                <Feather name={item.icon as "edit-3"} size={16} color={colors.primary} />
                <Text style={[styles.pointLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.pointValue, { color: colors.accent }]}>{item.pts}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            Community guidelines
          </Text>
          {[
            "Be kind and supportive to everyone",
            "No bullying, harassment, or hate speech",
            "Keep content school-appropriate",
            "No personal information — stay anonymous",
            "Report harmful content immediately",
          ].map((rule, i) => (
            <View key={i} style={styles.ruleRow}>
              <View style={[styles.ruleDot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.ruleText, { color: colors.foreground }]}>{rule}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: colors.border }]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={16} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  content: {
    padding: 20,
    gap: 16,
  },
  profileCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
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
  ruleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  ruleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  ruleText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    flex: 1,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});

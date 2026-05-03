import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

type AlertLevel = "clear" | "warning1" | "warning2" | "suspended";

function getAlertLevel(warningCount: number, isSuspended: boolean): AlertLevel {
  if (isSuspended) return "suspended";
  if (warningCount >= 2) return "warning2";
  if (warningCount >= 1) return "warning1";
  return "clear";
}

export function BehaviorAlert() {
  const { user } = useAuth();
  const colors = useColors();
  const [dismissed, setDismissed] = useState(false);

  if (!user || user.role === "admin") return null;

  const level = getAlertLevel(user.warningCount ?? 0, user.isSuspended);

  if (level === "clear") return null;

  if (level === "suspended") {
    return (
      <View style={[styles.suspendedOverlay, { backgroundColor: colors.background }]}>
        <View style={[styles.suspendedCard, { backgroundColor: colors.card, borderColor: colors.destructive + "40" }]}>
          <View style={[styles.suspendedIconWrap, { backgroundColor: colors.destructive + "18" }]}>
            <Feather name="user-x" size={40} color={colors.destructive} />
          </View>
          <Text style={[styles.suspendedTitle, { color: colors.foreground }]}>
            Account Suspended
          </Text>
          <Text style={[styles.suspendedBody, { color: colors.mutedForeground }]}>
            Your account has been suspended due to repeated unkind behaviour. You
            cannot post or comment until your school admin reinstates your account.
          </Text>
          <View style={[styles.suspendedHint, { backgroundColor: colors.muted, borderRadius: 10 }]}>
            <Feather name="info" size={14} color={colors.mutedForeground} />
            <Text style={[styles.suspendedHintText, { color: colors.mutedForeground }]}>
              Speak with your teacher or school admin for help.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (dismissed) return null;

  const isSecond = level === "warning2";

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: isSecond ? colors.destructive + "14" : "#F59E0B18",
          borderColor: isSecond ? colors.destructive + "50" : "#F59E0B60",
        },
      ]}
    >
      <View style={styles.bannerContent}>
        <View
          style={[
            styles.bannerIconWrap,
            { backgroundColor: isSecond ? colors.destructive + "22" : "#F59E0B22" },
          ]}
        >
          <Feather
            name={isSecond ? "alert-octagon" : "alert-triangle"}
            size={18}
            color={isSecond ? colors.destructive : "#D97706"}
          />
        </View>
        <View style={styles.bannerText}>
          <Text
            style={[
              styles.bannerTitle,
              { color: isSecond ? colors.destructive : "#92400E" },
            ]}
          >
            {isSecond ? "Second Warning" : "First Warning"}
          </Text>
          <Text
            style={[
              styles.bannerBody,
              { color: isSecond ? colors.destructive + "CC" : "#78350F" },
            ]}
          >
            {isSecond
              ? "One more violation and your account will be automatically blocked."
              : "Please be kind and respectful. Unkind behaviour can lead to your account being blocked."}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={() => setDismissed(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="x" size={16} color={isSecond ? colors.destructive : "#92400E"} />
        </TouchableOpacity>
      </View>
      <Pressable
        style={[
          styles.bannerAction,
          { backgroundColor: isSecond ? colors.destructive : "#D97706" },
        ]}
        onPress={() => setDismissed(true)}
      >
        <Text style={[styles.bannerActionText, { color: "#fff" }]}>
          I understand, I'll be kind
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  suspendedOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  suspendedCard: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 14,
  },
  suspendedIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  suspendedTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  suspendedBody: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  suspendedHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
  },
  suspendedHintText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  banner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    gap: 10,
  },
  bannerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bannerText: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  bannerBody: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  dismissBtn: {
    flexShrink: 0,
    padding: 2,
  },
  bannerAction: {
    alignItems: "center",
    paddingVertical: 10,
  },
  bannerActionText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});

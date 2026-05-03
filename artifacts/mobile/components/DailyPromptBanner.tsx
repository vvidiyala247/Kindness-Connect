import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { getTodayPrompt, getTodayDismissKey } from "@/data/kindnessPrompts";

function readDismissed(): boolean {
  if (Platform.OS !== "web" || typeof localStorage === "undefined") return false;
  return localStorage.getItem(getTodayDismissKey()) === "1";
}

function writeDismissed() {
  if (Platform.OS !== "web" || typeof localStorage === "undefined") return;
  localStorage.setItem(getTodayDismissKey(), "1");
}

export function DailyPromptBanner() {
  const colors = useColors();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-12)).current;

  const prompt = getTodayPrompt();

  useEffect(() => {
    if (!readDismissed()) {
      setVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }),
      ]).start();
    }
  }, []);

  const dismiss = () => {
    writeDismissed();
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: colors.accent + "18", borderColor: colors.accent + "44" },
        ]}
      >
        <View style={styles.topRow}>
          <Text style={styles.emoji}>{prompt.emoji}</Text>

          <Pressable
            onPress={dismiss}
            style={styles.closeBtn}
            accessibilityLabel="Dismiss prompt"
          >
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <Text style={[styles.headline, { color: colors.foreground }]}>
          {prompt.headline}
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          {prompt.body}
        </Text>

        <TouchableOpacity
          style={[styles.cta, { backgroundColor: colors.accent }]}
          onPress={() => {
            dismiss();
            router.push("/(tabs)/new-post");
          }}
          activeOpacity={0.85}
        >
          <Feather name="edit-3" size={14} color="#fff" />
          <Text style={styles.ctaText}>Share now</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  emoji: {
    fontSize: 32,
    lineHeight: 38,
  },
  closeBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  headline: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 4,
  },
  ctaText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});

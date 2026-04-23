import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface KindnessScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function KindnessScore({ score, size = "md" }: KindnessScoreProps) {
  const colors = useColors();

  const iconSize = size === "sm" ? 12 : size === "lg" ? 20 : 16;
  const fontSize = size === "sm" ? 12 : size === "lg" ? 20 : 15;
  const padV = size === "sm" ? 4 : size === "lg" ? 8 : 6;
  const padH = size === "sm" ? 8 : size === "lg" ? 14 : 10;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.kindness,
          borderRadius: 999,
          paddingVertical: padV,
          paddingHorizontal: padH,
        },
      ]}
    >
      <Feather name="star" size={iconSize} color={colors.kindnessForeground} />
      <Text
        style={[styles.text, { fontSize, color: colors.kindnessForeground }]}
      >
        {score}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  text: {
    fontFamily: "Inter_700Bold",
  },
});

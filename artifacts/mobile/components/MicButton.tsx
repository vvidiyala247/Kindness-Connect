import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  isListening: boolean;
  isSupported: boolean;
  interimTranscript: string;
  onPress: () => void;
  /** "inline" — small, fits inside a comment bar.
   *  "block"  — larger, standalone beneath a textarea. */
  variant?: "inline" | "block";
};

export function MicButton({
  isListening,
  isSupported,
  interimTranscript,
  onPress,
  variant = "inline",
}: Props) {
  const colors = useColors();
  const pulse = useRef(new Animated.Value(1)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.15,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(ring, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(ring, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      ring.stopAnimation();
      pulse.setValue(1);
      ring.setValue(0);
    }
  }, [isListening, pulse, ring]);

  if (!isSupported) return null;

  const isBlock = variant === "block";
  const btnSize = isBlock ? 52 : 40;
  const iconSize = isBlock ? 22 : 18;
  const activeColor = "#EF4444";
  const idleColor = colors.primary;

  const ringScale = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.7],
  });
  const ringOpacity = ring.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.5, 0.3, 0],
  });

  return (
    <View style={isBlock ? styles.blockWrapper : styles.inlineWrapper}>
      {isBlock && (
        <View style={styles.blockLabelRow}>
          <Feather
            name="mic"
            size={13}
            color={isListening ? activeColor : colors.mutedForeground}
          />
          <Text
            style={[
              styles.blockLabel,
              { color: isListening ? activeColor : colors.mutedForeground },
            ]}
          >
            {isListening ? "Listening… tap to stop" : "Tap to speak your message"}
          </Text>
        </View>
      )}

      {interimTranscript ? (
        <View
          style={[
            styles.bubble,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text
            style={[styles.bubbleText, { color: colors.foreground }]}
            numberOfLines={4}
          >
            {interimTranscript}
            <Text style={{ color: activeColor }}>|</Text>
          </Text>
        </View>
      ) : null}

      <View style={isBlock ? styles.blockBtnRow : null}>
        <View style={{ width: btnSize, height: btnSize }}>
          {/* Expanding ring behind the button */}
          <Animated.View
            style={[
              styles.ring,
              {
                width: btnSize,
                height: btnSize,
                borderRadius: btnSize / 2,
                borderColor: activeColor,
                transform: [{ scale: ringScale }],
                opacity: ringOpacity,
              },
            ]}
          />

          <Animated.View
            style={{
              transform: [{ scale: pulse }],
            }}
          >
            <Pressable
              onPress={onPress}
              style={[
                styles.btn,
                {
                  width: btnSize,
                  height: btnSize,
                  borderRadius: btnSize / 2,
                  backgroundColor: isListening ? activeColor : idleColor,
                },
              ]}
              accessibilityLabel={
                isListening ? "Stop voice input" : "Start voice input"
              }
              accessibilityRole="button"
            >
              <Feather
                name="mic"
                size={iconSize}
                color="#fff"
              />
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inlineWrapper: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  blockWrapper: {
    gap: 10,
  },
  blockLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  blockLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  bubble: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  bubbleText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    fontStyle: "italic",
  },
  blockBtnRow: {
    alignItems: "center",
  },
  ring: {
    position: "absolute",
    borderWidth: 2,
  },
  btn: {
    alignItems: "center",
    justifyContent: "center",
  },
});

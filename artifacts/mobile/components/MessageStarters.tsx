import { Feather } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import {
  KINDNESS_ACT_STARTERS,
  SUPPORT_STARTERS,
} from "@/data/kindnessPrompts";

type Props = {
  postType: "kindness_act" | "support";
  onSelect: (text: string) => void;
};

export function MessageStarters({ postType, onSelect }: Props) {
  const colors = useColors();
  const scrollRef = useRef<ScrollView>(null);

  const starters =
    postType === "kindness_act" ? KINDNESS_ACT_STARTERS : SUPPORT_STARTERS;
  const accentColor =
    postType === "kindness_act" ? colors.accent : colors.support;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Feather name="zap" size={12} color={accentColor} />
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          Need a starting point? Tap one:
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        keyboardShouldPersistTaps="always"
      >
        {starters.map((starter, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.chip,
              {
                backgroundColor: accentColor + "14",
                borderColor: accentColor + "55",
              },
            ]}
            onPress={() => {
              onSelect(starter);
              scrollRef.current?.scrollTo({ x: 0, animated: true });
            }}
            activeOpacity={0.75}
          >
            <Text
              style={[styles.chipText, { color: accentColor }]}
              numberOfLines={2}
            >
              {starter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  chipsRow: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    maxWidth: 220,
  },
  chipText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
});

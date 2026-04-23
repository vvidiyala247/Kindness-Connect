import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCreateReport } from "@workspace/api-client-react";
import type { CreateReportBody } from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";

type ReportReason = CreateReportBody["reason"];
type TargetType = CreateReportBody["targetType"];

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "bullying", label: "Bullying" },
  { value: "harmful", label: "Harmful content" },
  { value: "inappropriate", label: "Inappropriate" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Other" },
];

interface ReportModalProps {
  visible: boolean;
  targetType: TargetType;
  targetId: string;
  onClose: () => void;
}

export function ReportModal({ visible, targetType, targetId, onClose }: ReportModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<ReportReason | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const reportMutation = useCreateReport({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setSelected(null);
          onClose();
        }, 1500);
      },
    },
  });

  const handleSubmit = () => {
    if (!selected) return;
    reportMutation.mutate({
      data: { targetType, targetId, reason: selected },
    });
  };

  const handleClose = () => {
    setSelected(null);
    setSubmitted(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.card,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        {submitted ? (
          <View style={styles.successContainer}>
            <Feather name="check-circle" size={40} color={colors.success} />
            <Text style={[styles.successText, { color: colors.foreground }]}>
              Report submitted
            </Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
              Thank you for keeping our community safe
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.title, { color: colors.foreground }]}>Report content</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Why are you reporting this?
            </Text>

            {REASONS.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[
                  styles.option,
                  {
                    borderColor: selected === r.value ? colors.primary : colors.border,
                    backgroundColor:
                      selected === r.value ? colors.primary + "11" : colors.background,
                  },
                ]}
                onPress={() => setSelected(r.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: selected === r.value ? colors.primary : colors.foreground },
                  ]}
                >
                  {r.label}
                </Text>
                {selected === r.value && (
                  <Feather name="check" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[
                styles.submitBtn,
                {
                  backgroundColor: selected ? colors.primary : colors.muted,
                  opacity: reportMutation.isPending ? 0.7 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={!selected || reportMutation.isPending}
            >
              {reportMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.submitText,
                    { color: selected ? colors.primaryForeground : colors.mutedForeground },
                  ]}
                >
                  Submit Report
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  submitBtn: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  successText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  successSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});

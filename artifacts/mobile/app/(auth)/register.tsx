import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { UserProfile } from "@workspace/api-client-react";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

type Step = "form" | "success";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register, login } = useAuth();

  const [step, setStep] = useState<Step>("form");
  const [assignedUser, setAssignedUser] = useState<UserProfile | null>(null);
  const [assignedToken, setAssignedToken] = useState<string | null>(null);

  const [joinCode, setJoinCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleRegister = async () => {
    setErrorMsg("");
    if (!joinCode.trim() || !password) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords don't match.");
      return;
    }
    setIsPending(true);
    try {
      const result = await register({ joinCode: joinCode.trim().toUpperCase(), password });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAssignedUser(result.user);
      setAssignedToken(result.token);
      setStep("success");
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } };
      setErrorMsg(e?.data?.error ?? "Registration failed.");
    } finally {
      setIsPending(false);
    }
  };

  const handleEnterApp = async () => {
    if (!assignedToken || !assignedUser) return;
    await login(assignedToken, assignedUser);
    router.replace("/(tabs)");
  };

  if (step === "success" && assignedUser) {
    return (
      <View
        style={[
          styles.successContainer,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 32,
            paddingBottom: insets.bottom + 32,
          },
        ]}
      >
        <View style={[styles.successIconWrap, { backgroundColor: colors.accent + "22" }]}>
          <Feather name="shield" size={40} color={colors.accent} />
        </View>

        <Text style={[styles.successTitle, { color: colors.foreground }]}>
          You're in!
        </Text>
        <Text style={[styles.successSubtitle, { color: colors.mutedForeground }]}>
          Your anonymous nickname is:
        </Text>

        <View style={[styles.nicknameBadge, { backgroundColor: colors.kindness, borderRadius: colors.radius }]}>
          <Text style={[styles.nicknameText, { color: colors.kindnessForeground }]}>
            {assignedUser.nickname}
          </Text>
        </View>

        <Text style={[styles.nicknameNote, { color: colors.mutedForeground }]}>
          This is your identity in the community. No real names are shared — ever.
          Write it down so you can log in next time!
        </Text>

        <View style={[styles.schoolInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.schoolLabel, { color: colors.mutedForeground }]}>Your School ID</Text>
          <Text style={[styles.schoolId, { color: colors.foreground }]} numberOfLines={1}>
            {assignedUser.schoolId}
          </Text>
          <Text style={[styles.schoolNote, { color: colors.mutedForeground }]}>
            Save this — you'll need it to log in
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.enterBtn, { backgroundColor: colors.primary }]}
          onPress={handleEnterApp}
        >
          <Text style={[styles.enterBtnText, { color: colors.primaryForeground }]}>
            Enter the Community
          </Text>
          <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Join your school</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            You'll get a unique anonymous nickname — no real names needed.
          </Text>
        </View>

        <View style={[styles.infoBox, { backgroundColor: colors.accent + "1a" }]}>
          <Feather name="shield" size={16} color={colors.accent} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Your identity stays private. You'll be known by a fun animal nickname only.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>School Join Code</Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card },
              ]}
              placeholder="ABC123"
              placeholderTextColor={colors.mutedForeground}
              value={joinCode}
              onChangeText={(t) => setJoinCode(t.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
            />
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              6-character code from your school admin
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Password</Text>
            <View
              style={[
                styles.passwordWrap,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <TextInput
                style={[styles.passwordInput, { color: colors.foreground }]}
                placeholder="Min 8 characters"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={18}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Confirm Password</Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card },
              ]}
              placeholder="Repeat your password"
              placeholderTextColor={colors.mutedForeground}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
          </View>

          {errorMsg ? (
            <View style={[styles.errorBox, { backgroundColor: colors.destructive + "18" }]}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{errorMsg}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              { backgroundColor: colors.primary, opacity: isPending ? 0.7 : 1 },
            ]}
            onPress={handleRegister}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                Create Account
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    paddingHorizontal: 24,
    gap: 24,
  },
  successContainer: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  successIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  successSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  nicknameBadge: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  nicknameText: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  nicknameNote: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 19,
  },
  schoolInfo: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 4,
    alignSelf: "stretch",
  },
  schoolLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  schoolId: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  schoolNote: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  enterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignSelf: "stretch",
    marginTop: 4,
  },
  enterBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  backBtn: {
    marginTop: 4,
    marginBottom: 8,
    width: 40,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  eyeBtn: { padding: 4 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});

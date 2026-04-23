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

import { useLogin } from "@workspace/api-client-react";
import type { ErrorType } from "@workspace/api-client-react";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [nickname, setNickname] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loginMutation = useLogin({
    mutation: {
      onSuccess: async (data) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await login(data.token, data.user);
        router.replace("/(tabs)");
      },
      onError: (err: ErrorType<unknown>) => {
        setErrorMsg(
          (err as { data?: { error?: string } })?.data?.error ?? "Login failed. Check your details."
        );
      },
    },
  });

  const handleLogin = () => {
    setErrorMsg("");
    if (!nickname.trim() || !schoolId.trim() || !password) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    loginMutation.mutate({ data: { nickname: nickname.trim(), schoolId: schoolId.trim(), password } });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={[styles.logoWrap, { backgroundColor: colors.primary + "22" }]}>
            <Feather name="heart" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.appName, { color: colors.primary }]}>KindnessConnect</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Your school's kindness community
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sign In</Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Nickname</Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card },
              ]}
              placeholder="BraveOtter"
              placeholderTextColor={colors.mutedForeground}
              value={nickname}
              onChangeText={setNickname}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>School ID</Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card },
              ]}
              placeholder="sch_abc123..."
              placeholderTextColor={colors.mutedForeground}
              value={schoolId}
              onChangeText={setSchoolId}
              autoCapitalize="none"
              autoCorrect={false}
            />
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
                placeholder="••••••••"
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

          {errorMsg ? (
            <View style={[styles.errorBox, { backgroundColor: colors.destructive + "18" }]}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{errorMsg}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              { backgroundColor: colors.primary, opacity: loginMutation.isPending ? 0.7 : 1 },
            ]}
            onPress={handleLogin}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            onPress={() => router.push("/(auth)/register")}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>
              Join with a school code
            </Text>
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
    gap: 32,
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  appName: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  form: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
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
  eyeBtn: {
    padding: 4,
  },
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
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  secondaryBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1.5,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});

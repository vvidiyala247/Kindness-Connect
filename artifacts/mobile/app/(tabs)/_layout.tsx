import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, Text, useColorScheme } from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import { useFeedBadge } from "@/contexts/FeedBadgeContext";
import { useColors } from "@/hooks/useColors";

function FeedBadgeDot() {
  const colors = useColors();
  const { newPostCount } = useFeedBadge();
  if (!newPostCount) return null;
  return (
    <View
      style={[
        feedDotStyles.dot,
        { backgroundColor: colors.primary },
      ]}
    >
      <Text style={[feedDotStyles.dotText, { color: colors.primaryForeground }]}>
        {newPostCount > 9 ? "9+" : String(newPostCount)}
      </Text>
    </View>
  );
}

const feedDotStyles = StyleSheet.create({
  dot: {
    position: "absolute",
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  dotText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    lineHeight: 12,
  },
});

function FeedIcon({ color, isNative = false }: { color?: string; isNative?: boolean }) {
  return (
    <View style={{ position: "relative" }}>
      {isNative ? (
        <Icon sf={{ default: "house", selected: "house.fill" }} />
      ) : Platform.OS === "ios" ? (
        <SymbolView name="house" tintColor={color} size={24} />
      ) : (
        <Feather name="home" size={22} color={color} />
      )}
      <FeedBadgeDot />
    </View>
  );
}

function NativeTabLayoutStudent() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <FeedIcon isNative />
        <Label>Feed</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="new-post">
        <Icon sf={{ default: "plus.circle", selected: "plus.circle.fill" }} />
        <Label>Post</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function NativeTabLayoutAdmin() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <FeedIcon isNative />
        <Label>Feed</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="new-post">
        <Icon sf={{ default: "plus.circle", selected: "plus.circle.fill" }} />
        <Label>Post</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="admin">
        <Icon sf={{ default: "shield", selected: "shield.fill" }} />
        <Label>Moderate</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout({ isAdmin }: { isAdmin: boolean }) {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const { newPostCount } = useFeedBadge();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  const feedBadge = newPostCount > 0 ? (newPostCount > 9 ? "9+" : String(newPostCount)) : undefined;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: isWeb ? 1 : StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Feed",
          tabBarBadge: feedBadge,
          tabBarBadgeStyle: {
            backgroundColor: colors.primary,
            color: colors.primaryForeground,
            fontSize: 10,
            fontFamily: "Inter_700Bold",
          },
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={24} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="new-post"
        options={{
          title: "Post",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="plus.circle" tintColor={color} size={24} />
            ) : (
              <Feather name="plus-circle" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person" tintColor={color} size={24} />
            ) : (
              <Feather name="user" size={22} color={color} />
            ),
        }}
      />
      {isAdmin && (
        <Tabs.Screen
          name="admin"
          options={{
            title: "Moderate",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="shield" tintColor={color} size={24} />
              ) : (
                <Feather name="shield" size={22} color={color} />
              ),
          }}
        />
      )}
      {!isAdmin && (
        <Tabs.Screen
          name="admin"
          options={{
            href: null,
          }}
        />
      )}
    </Tabs>
  );
}

export default function TabLayout() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  if (isLiquidGlassAvailable()) {
    return isAdmin ? <NativeTabLayoutAdmin /> : <NativeTabLayoutStudent />;
  }
  return <ClassicTabLayout isAdmin={isAdmin} />;
}

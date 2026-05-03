import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";

// Show notifications while the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowList: true,
  }),
});

const JWT_KEY = "kc_jwt";

/**
 * Registers for Expo push notifications and uploads the token to the server.
 * Must be called inside AuthProvider.
 * Safe to call on web/simulators — silently no-ops.
 */
export function usePushNotifications(): void {
  const { token: authToken } = useAuth();

  useEffect(() => {
    if (!authToken) return;

    void (async () => {
      try {
        await registerForPushNotificationsAsync(authToken);
      } catch {
        // Non-fatal
      }
    })();
  }, [authToken]);
}

async function registerForPushNotificationsAsync(authToken: string): Promise<void> {
  // Push notifications require a physical device
  if (!Device.isDevice) return;

  // Android: create a dedicated notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("kindness", {
      name: "Kindness Notifications",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#E07B54",
    });
  }

  // Request permission
  const { status: existing } = await Notifications.getPermissionsAsync();
  const { status: final } =
    existing === "granted"
      ? { status: existing }
      : await Notifications.requestPermissionsAsync();

  if (final !== "granted") return;

  // Obtain push token
  const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync();

  // Send token to server
  const jwtToken = await AsyncStorage.getItem(JWT_KEY);
  if (!jwtToken) return;

  const baseUrl =
    process.env["EXPO_PUBLIC_API_URL"] ??
    `https://${process.env["EXPO_PUBLIC_DOMAIN"]}`;

  await fetch(`${baseUrl}/api/users/push-token`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({ token: expoPushToken }),
  });
}

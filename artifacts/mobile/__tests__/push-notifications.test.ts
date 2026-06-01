import { renderHook } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "@/contexts/AuthContext";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { defaultAuthValue } from "./test-utils";

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: "ExponentPushToken[test-token]" })),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  AndroidImportance: { HIGH: "high" },
}));

jest.mock("expo-device", () => ({
  isDevice: false,
}));

const Notifications = require("expo-notifications");
const Device = require("expo-device");

type AuthContextValue = NonNullable<React.ContextType<typeof AuthContext>>;

function createWrapper(authValue: AuthContextValue = defaultAuthValue) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      AuthContext.Provider,
      { value: authValue },
      React.createElement(QueryClientProvider, { client: queryClient }, children)
    );
  };
}

describe("usePushNotifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Device.isDevice = false;
  });

  it("runs without throwing when called with no auth token", () => {
    const noTokenAuth: AuthContextValue = { ...defaultAuthValue, token: null };
    const wrapper = createWrapper(noTokenAuth);
    expect(() => renderHook(() => usePushNotifications(), { wrapper })).not.toThrow();
  });

  it("runs without throwing when called with an auth token", () => {
    const wrapper = createWrapper(defaultAuthValue);
    expect(() => renderHook(() => usePushNotifications(), { wrapper })).not.toThrow();
  });

  it("does not attempt to get push token when not on a physical device", async () => {
    Device.isDevice = false;
    const wrapper = createWrapper(defaultAuthValue);
    renderHook(() => usePushNotifications(), { wrapper });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it("does not request permissions when not on a physical device", async () => {
    Device.isDevice = false;
    const wrapper = createWrapper(defaultAuthValue);
    renderHook(() => usePushNotifications(), { wrapper });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
  });

  it("no-ops when auth token is absent", async () => {
    const noTokenAuth: AuthContextValue = { ...defaultAuthValue, token: null };
    const wrapper = createWrapper(noTokenAuth);
    renderHook(() => usePushNotifications(), { wrapper });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it("returns void (no meaningful return value)", () => {
    const wrapper = createWrapper(defaultAuthValue);
    const { result } = renderHook(() => usePushNotifications(), { wrapper });
    expect(result.current).toBeUndefined();
  });
});

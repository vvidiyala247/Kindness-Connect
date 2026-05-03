import "@testing-library/jest-dom";
import { apiMock, installFetchMock } from "./__tests__/mocks/api-mock";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

setBaseUrl("http://localhost");
setAuthTokenGetter(() => Promise.resolve("test-token-123"));

installFetchMock();

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(() => ({})),
  useSegments: jest.fn(() => []),
  Link: ({ children }) => children,
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
}));

jest.mock("@expo/vector-icons", () => ({
  Feather: () => null,
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }) => children,
}));

jest.mock("expo-blur", () => ({
  BlurView: ({ children }) => children,
}));

jest.mock("react-native-gesture-handler", () => {
  const rn = jest.requireActual("react-native");
  return {
    ...rn,
    GestureHandlerRootView: ({ children }) => children,
  };
});

jest.mock("react-native-keyboard-controller", () => ({
  KeyboardProvider: ({ children }) => children,
  KeyboardAvoidingView: ({ children }) => children,
}));

jest.mock("react-native-reanimated", () => {
  const rn = jest.requireActual("react-native");
  return {
    ...rn,
    default: rn,
    useSharedValue: jest.fn((val) => ({ value: val })),
    useAnimatedStyle: jest.fn(() => ({})),
    withTiming: jest.fn((val) => val),
    withSpring: jest.fn((val) => val),
    FlatList: rn.FlatList,
    View: rn.View,
    Text: rn.Text,
  };
});

afterEach(() => {
  apiMock.reset();
  jest.clearAllMocks();
  installFetchMock();
});

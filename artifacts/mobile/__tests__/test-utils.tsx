import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { AuthContext } from "@/contexts/AuthContext";
import type { UserProfile } from "@workspace/api-client-react";

export const mockUser: UserProfile = {
  id: "user-1",
  nickname: "BraveOtter",
  schoolId: "school-1",
  role: "student",
  kindnessScore: 10,
};

export const defaultAuthValue = {
  token: "test-token-123",
  user: mockUser,
  isLoading: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  refreshUser: jest.fn(),
};

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: React.ReactElement,
  { authValue = defaultAuthValue } = {}
) {
  const queryClient = createTestQueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthContext.Provider value={authValue}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </AuthContext.Provider>
  );
  return render(ui, { wrapper: Wrapper });
}

import React from "react";
import { Alert } from "react-native";
import { fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "expo-router";
import { renderWithProviders, defaultAuthValue, mockUser } from "./test-utils";
import { apiMock } from "./mocks/api-mock";
import ProfileScreen from "../app/(tabs)/profile";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue(mockRouter);
});

describe("ProfileScreen", () => {
  it("renders the Profile header", () => {
    const { getAllByText } = renderWithProviders(<ProfileScreen />);
    expect(getAllByText("Profile").length).toBeGreaterThan(0);
  });

  it("renders user nickname from auth context", async () => {
    const { getAllByText } = renderWithProviders(<ProfileScreen />);
    await waitFor(() => {
      expect(getAllByText("BraveOtter").length).toBeGreaterThan(0);
    });
  });

  it("renders the kindness score section", async () => {
    const { getAllByText } = renderWithProviders(<ProfileScreen />);
    await waitFor(() => {
      expect(getAllByText(/10/i).length).toBeGreaterThan(0);
    });
  });

  it("renders the milestone rank label", async () => {
    const { getAllByText } = renderWithProviders(<ProfileScreen />);
    await waitFor(() => {
      expect(getAllByText("Helper").length).toBeGreaterThan(0);
    });
  });

  it("renders 'Your current kindness rank' subtitle", async () => {
    const { getAllByText } = renderWithProviders(<ProfileScreen />);
    await waitFor(() => {
      expect(getAllByText("Your current kindness rank").length).toBeGreaterThan(0);
    });
  });

  it("renders how kindness points work section", async () => {
    const { getAllByText } = renderWithProviders(<ProfileScreen />);
    await waitFor(() => {
      expect(getAllByText(/how kindness points work/i).length).toBeGreaterThan(0);
    });
  });

  it("renders point values for Post, Like received, and Comment", async () => {
    const { getAllByText } = renderWithProviders(<ProfileScreen />);
    await waitFor(() => {
      expect(getAllByText("Post").length).toBeGreaterThan(0);
      expect(getAllByText("Like received").length).toBeGreaterThan(0);
      expect(getAllByText("Comment").length).toBeGreaterThan(0);
    });
  });

  it("renders +5 and +1 and +2 point values", async () => {
    const { getAllByText } = renderWithProviders(<ProfileScreen />);
    await waitFor(() => {
      expect(getAllByText("+5").length).toBeGreaterThan(0);
      expect(getAllByText("+1").length).toBeGreaterThan(0);
      expect(getAllByText("+2").length).toBeGreaterThan(0);
    });
  });

  it("renders the Student role badge for student user", async () => {
    const { getAllByText } = renderWithProviders(<ProfileScreen />);
    await waitFor(() => {
      expect(getAllByText("Student").length).toBeGreaterThan(0);
    });
  });

  it("renders the School Admin role badge for admin user", async () => {
    const adminAuth = {
      ...defaultAuthValue,
      user: { ...mockUser, role: "admin" as const },
    };
    const { getAllByText } = renderWithProviders(<ProfileScreen />, {
      authValue: adminAuth,
    });
    await waitFor(() => {
      expect(getAllByText("School Admin").length).toBeGreaterThan(0);
    });
  });

  it("renders Sign Out button in footer", async () => {
    const { getAllByText } = renderWithProviders(<ProfileScreen />);
    await waitFor(() => {
      expect(getAllByText("Sign Out").length).toBeGreaterThan(0);
    });
  });

  it("renders Choose Avatar button when user has no avatar", async () => {
    const { getAllByText } = renderWithProviders(<ProfileScreen />);
    await waitFor(() => {
      expect(getAllByText("Choose Avatar").length).toBeGreaterThan(0);
    });
  });

  it("renders Change Avatar button when user already has an avatar", async () => {
    const authWithAvatar = {
      ...defaultAuthValue,
      user: { ...mockUser, avatar: "🦊" },
    };
    apiMock.use("GET", "/api/auth/me", () => ({
      status: 200,
      data: { ...mockUser, avatar: "🦊" },
    }));
    const { getAllByText } = renderWithProviders(<ProfileScreen />, {
      authValue: authWithAvatar,
    });
    await waitFor(() => {
      expect(getAllByText("Change Avatar").length).toBeGreaterThan(0);
    });
  });

  it("renders empty state when user has no posts", async () => {
    apiMock.use("GET", "/api/posts", () => ({
      status: 200,
      data: { posts: [], nextCursor: null },
    }));
    const { getAllByText } = renderWithProviders(<ProfileScreen />);
    await waitFor(() => {
      expect(getAllByText("No posts yet").length).toBeGreaterThan(0);
    });
  });

  it("shows my posts from the feed filtered to the current user", async () => {
    apiMock.use("GET", "/api/posts", () => ({
      status: 200,
      data: {
        posts: [
          {
            id: "own-post-1",
            type: "kindness_act",
            content: "I helped a neighbor today.",
            authorNickname: "BraveOtter",
            authorId: "user-1",
            likeCount: 3,
            commentCount: 0,
            createdAt: new Date().toISOString(),
          },
          {
            id: "other-post-1",
            type: "support",
            content: "Someone else's post",
            authorNickname: "CalmFox",
            authorId: "user-2",
            likeCount: 1,
            commentCount: 0,
            createdAt: new Date().toISOString(),
          },
        ],
        nextCursor: null,
      },
    }));
    const { getAllByText, queryAllByText } = renderWithProviders(<ProfileScreen />);
    await waitFor(() => {
      expect(getAllByText("I helped a neighbor today.").length).toBeGreaterThan(0);
    });
    expect(queryAllByText("Someone else's post").length).toBe(0);
  });

  it("shows My Posts (N) section label", async () => {
    apiMock.use("GET", "/api/posts", () => ({
      status: 200,
      data: { posts: [], nextCursor: null },
    }));
    const { getAllByText } = renderWithProviders(<ProfileScreen />);
    await waitFor(() => {
      expect(getAllByText(/my posts/i).length).toBeGreaterThan(0);
    });
  });

  it("shows Seedling milestone when kindness score is 0", async () => {
    const zeroScoreAuth = {
      ...defaultAuthValue,
      user: { ...mockUser, kindnessScore: 0 },
    };
    const { getAllByText } = renderWithProviders(<ProfileScreen />, {
      authValue: zeroScoreAuth,
    });
    await waitFor(() => {
      expect(getAllByText("Seedling").length).toBeGreaterThan(0);
    });
  });

  it("shows Champion milestone when kindness score is 100+", async () => {
    const highScoreAuth = {
      ...defaultAuthValue,
      user: { ...mockUser, kindnessScore: 100 },
    };
    apiMock.use("GET", "/api/auth/me", () => ({
      status: 200,
      data: { ...mockUser, kindnessScore: 100 },
    }));
    const { getAllByText } = renderWithProviders(<ProfileScreen />, {
      authValue: highScoreAuth,
    });
    await waitFor(() => {
      expect(getAllByText("Champion").length).toBeGreaterThan(0);
    });
  });

  it("shows Beacon milestone when kindness score is 50", async () => {
    const beaconAuth = {
      ...defaultAuthValue,
      user: { ...mockUser, kindnessScore: 50 },
    };
    apiMock.use("GET", "/api/auth/me", () => ({
      status: 200,
      data: { ...mockUser, kindnessScore: 50 },
    }));
    const { getAllByText } = renderWithProviders(<ProfileScreen />, {
      authValue: beaconAuth,
    });
    await waitFor(() => {
      expect(getAllByText("Beacon").length).toBeGreaterThan(0);
    });
  });

  it("shows Friend milestone when kindness score is 25", async () => {
    const friendAuth = {
      ...defaultAuthValue,
      user: { ...mockUser, kindnessScore: 25 },
    };
    apiMock.use("GET", "/api/auth/me", () => ({
      status: 200,
      data: { ...mockUser, kindnessScore: 25 },
    }));
    const { getAllByText } = renderWithProviders(<ProfileScreen />, {
      authValue: friendAuth,
    });
    await waitFor(() => {
      expect(getAllByText("Friend").length).toBeGreaterThan(0);
    });
  });

  it("calls Alert.alert when Sign Out button in footer is pressed", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const { getAllByText } = renderWithProviders(<ProfileScreen />);
    await waitFor(() => getAllByText("Sign Out").length > 0);

    fireEvent.click(getAllByText("Sign Out").at(0)!);

    expect(alertSpy).toHaveBeenCalledWith(
      "Sign Out",
      "Are you sure you want to sign out?",
      expect.any(Array)
    );
    alertSpy.mockRestore();
  });

  it("calls logout when Sign Out is confirmed in the alert", async () => {
    const mockLogout = jest.fn().mockResolvedValue(undefined);
    const authWithLogout = { ...defaultAuthValue, logout: mockLogout };

    Alert.alert = jest.fn().mockImplementation((_title, _msg, buttons) => {
      const signOutBtn = buttons?.find((b: { text: string }) => b.text === "Sign Out");
      signOutBtn?.onPress?.();
    });

    const { getAllByText } = renderWithProviders(<ProfileScreen />, {
      authValue: authWithLogout,
    });
    await waitFor(() => getAllByText("Sign Out").length > 0);

    fireEvent.click(getAllByText("Sign Out").at(0)!);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  it("opens avatar picker modal when Choose Avatar button is clicked", async () => {
    const { getAllByText } = renderWithProviders(<ProfileScreen />);
    await waitFor(() => getAllByText("Choose Avatar").length > 0);

    fireEvent.click(getAllByText("Choose Avatar").at(-1)!);

    await waitFor(() => {
      expect(getAllByText("Choose Your Avatar").length).toBeGreaterThan(0);
    });
  });

  it("shows avatar grid in the picker modal", async () => {
    const { getAllByText } = renderWithProviders(<ProfileScreen />);
    await waitFor(() => getAllByText("Choose Avatar").length > 0);

    fireEvent.click(getAllByText("Choose Avatar").at(-1)!);

    await waitFor(() => {
      expect(getAllByText("Pick an emoji that represents you").length).toBeGreaterThan(0);
    });
  });

  it("close button is accessible and clickable in the avatar picker modal", async () => {
    const { getAllByText, getByLabelText } = renderWithProviders(<ProfileScreen />);
    await waitFor(() => getAllByText("Choose Avatar").length > 0);

    fireEvent.click(getAllByText("Choose Avatar").at(-1)!);
    await waitFor(() => getByLabelText("Close avatar picker"));

    expect(() => fireEvent.click(getByLabelText("Close avatar picker"))).not.toThrow();
  });
});

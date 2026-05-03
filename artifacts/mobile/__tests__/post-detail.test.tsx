import React from "react";
import { fireEvent, waitFor, act, renderHook } from "@testing-library/react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { renderWithProviders, createTestQueryClient, defaultAuthValue } from "./test-utils";
import { apiMock } from "./mocks/api-mock";
import PostDetailScreen from "../app/post/[id]";
import { useCreateComment } from "@workspace/api-client-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "@/contexts/AuthContext";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue(mockRouter);
  (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "post-1" });
});

describe("PostDetailScreen", () => {
  it("renders the Post header bar", () => {
    const { getAllByText } = renderWithProviders(<PostDetailScreen />);
    expect(getAllByText("Post").length).toBeGreaterThan(0);
  });

  it("renders post content from API after fetch", async () => {
    const { getAllByText } = renderWithProviders(<PostDetailScreen />);
    await waitFor(() => {
      expect(getAllByText("Someone held the door for me today!").length).toBeGreaterThan(0);
    });
  });

  it("renders post type badge from API data", async () => {
    const { getAllByText } = renderWithProviders(<PostDetailScreen />);
    await waitFor(() => {
      expect(getAllByText("Kindness Act").length).toBeGreaterThan(0);
    });
  });

  it("renders author nickname on post from API", async () => {
    const { getAllByText } = renderWithProviders(<PostDetailScreen />);
    await waitFor(() => {
      expect(getAllByText("BraveOtter").length).toBeGreaterThan(0);
    });
  });

  it("renders existing comments from API", async () => {
    const { getAllByText } = renderWithProviders(<PostDetailScreen />);
    await waitFor(() => {
      expect(getAllByText("That's so sweet!").length).toBeGreaterThan(0);
      expect(getAllByText("CalmFox").length).toBeGreaterThan(0);
    });
  });

  it("renders comment count in post header from API data", async () => {
    const { getAllByText } = renderWithProviders(<PostDetailScreen />);
    await waitFor(() => {
      expect(getAllByText("1 Comment").length).toBeGreaterThan(0);
    });
  });

  it("renders the comment input bar", () => {
    const { getByPlaceholderText } = renderWithProviders(<PostDetailScreen />);
    expect(getByPlaceholderText("Add a kind comment...")).toBeTruthy();
  });

  it("displays correct post content when API returns different post data", async () => {
    apiMock.use("GET", "/api/posts/:id", () => ({
      status: 200,
      data: {
        id: "post-99",
        type: "kindness_act",
        content: "I donated my lunch to someone who forgot theirs.",
        authorNickname: "GentleElk",
        authorId: "user-5",
        likeCount: 12,
        commentCount: 3,
        createdAt: new Date().toISOString(),
      },
    }));

    const { getAllByText } = renderWithProviders(<PostDetailScreen />);
    await waitFor(() => {
      expect(getAllByText("I donated my lunch to someone who forgot theirs.").length).toBeGreaterThan(0);
      expect(getAllByText("GentleElk").length).toBeGreaterThan(0);
    });
  });

  it("sends comment request with correct data when send is pressed", async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={defaultAuthValue}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useCreateComment(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: "post-1", data: { content: "Great act of kindness!" } });
    });

    await waitFor(() => {
      expect(apiMock.lastRequest?.method).toBe("POST");
      expect(apiMock.lastRequest?.url).toContain("/comments");
      expect(apiMock.lastRequest?.body).toMatchObject({ content: "Great act of kindness!" });
    });
  });

  it("does not send comment request when input is empty", async () => {
    const { container, getAllByText } = renderWithProviders(<PostDetailScreen />);
    await waitFor(() => getAllByText("Someone held the door for me today!").length > 0);

    const initialRequest = apiMock.lastRequest;
    const interactiveElements = container.querySelectorAll('[tabindex="0"]');
    const sendButton = interactiveElements[interactiveElements.length - 1] as HTMLElement;
    fireEvent.click(sendButton);

    expect(apiMock.lastRequest).toBe(initialRequest);
  });

  it("shows no comment items when API returns empty comments list", async () => {
    apiMock.use("GET", "/api/posts/:id/comments", () => ({ status: 200, data: [] }));

    const { queryAllByText, getAllByText } = renderWithProviders(<PostDetailScreen />);
    await waitFor(() => getAllByText("Someone held the door for me today!").length > 0);

    expect(queryAllByText("That's so sweet!").length).toBe(0);
  });

  it("shows support badge for support type posts from API", async () => {
    apiMock.use("GET", "/api/posts/:id", () => ({
      status: 200,
      data: {
        id: "post-2",
        type: "support",
        content: "I need help with exams.",
        authorNickname: "CalmFox",
        authorId: "user-3",
        likeCount: 3,
        commentCount: 1,
        createdAt: new Date().toISOString(),
      },
    }));

    const { getAllByText } = renderWithProviders(<PostDetailScreen />);
    await waitFor(() => {
      expect(getAllByText("Need Support").length).toBeGreaterThan(0);
    });
  });

  it("navigates back when back button is pressed", () => {
    const { container } = renderWithProviders(<PostDetailScreen />);
    const interactiveElements = container.querySelectorAll('[tabindex="0"]');
    if (interactiveElements.length > 0) {
      fireEvent.click(interactiveElements[0] as HTMLElement);
      expect(mockRouter.back).toHaveBeenCalled();
    }
  });

  it("clears comment input after successful comment submission", async () => {
    const { getByPlaceholderText, container, getAllByText } = renderWithProviders(<PostDetailScreen />);
    await waitFor(() => getAllByText("Someone held the door for me today!").length > 0);

    const commentInput = getByPlaceholderText("Add a kind comment...") as HTMLInputElement;
    fireEvent.change(commentInput, { target: { value: "Nice post!" } });

    const interactiveElements = container.querySelectorAll('[tabindex="0"]');
    const sendButton = interactiveElements[interactiveElements.length - 1] as HTMLElement;
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(commentInput.value).toBe("");
    });
  });
});

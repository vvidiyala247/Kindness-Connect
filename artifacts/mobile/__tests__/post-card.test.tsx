import React from "react";
import { fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "expo-router";
import { renderWithProviders } from "./test-utils";
import { apiMock } from "./mocks/api-mock";
import { PostCard } from "../components/PostCard";
import type { Post } from "@workspace/api-client-react";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };

const basePost: Post = {
  id: "post-1",
  type: "kindness_act",
  content: "Someone helped me carry groceries today!",
  authorNickname: "BraveOtter",
  authorId: "user-2",
  likeCount: 5,
  commentCount: 2,
  createdAt: new Date().toISOString(),
};

const supportPost: Post = {
  id: "post-2",
  type: "support",
  content: "I am feeling a bit overwhelmed right now.",
  authorNickname: "CalmFox",
  authorId: "user-3",
  likeCount: 2,
  commentCount: 0,
  createdAt: new Date().toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue(mockRouter);
});

describe("PostCard", () => {
  it("renders post content", () => {
    const { getByText } = renderWithProviders(
      <PostCard post={basePost} currentUserId="user-1" />
    );
    expect(getByText("Someone helped me carry groceries today!")).toBeTruthy();
  });

  it("renders author nickname", () => {
    const { getByText } = renderWithProviders(
      <PostCard post={basePost} currentUserId="user-1" />
    );
    expect(getByText("BraveOtter")).toBeTruthy();
  });

  it("renders Kindness Act type badge for kindness_act posts", () => {
    const { getByText } = renderWithProviders(
      <PostCard post={basePost} currentUserId="user-1" />
    );
    expect(getByText("Kindness Act")).toBeTruthy();
  });

  it("renders Need Support type badge for support posts", () => {
    const { getByText } = renderWithProviders(
      <PostCard post={supportPost} currentUserId="user-1" />
    );
    expect(getByText("Need Support")).toBeTruthy();
  });

  it("renders like count", () => {
    const { getByText } = renderWithProviders(
      <PostCard post={basePost} currentUserId="user-1" />
    );
    expect(getByText("5")).toBeTruthy();
  });

  it("renders comment count when provided", () => {
    const { getByText } = renderWithProviders(
      <PostCard post={basePost} currentUserId="user-1" commentCount={3} />
    );
    expect(getByText("3")).toBeTruthy();
  });

  it("does not render comment count when not provided", () => {
    const { queryByText } = renderWithProviders(
      <PostCard post={basePost} currentUserId="user-1" />
    );
    expect(queryByText("2")).toBeNull();
  });

  it("shows gift button for posts not authored by current user", () => {
    const { getByLabelText } = renderWithProviders(
      <PostCard post={basePost} currentUserId="user-1" />
    );
    expect(getByLabelText("Send kindness gift")).toBeTruthy();
  });

  it("does not show gift button for own posts", () => {
    const ownPost: Post = { ...basePost, authorId: "user-1" };
    const { queryByLabelText } = renderWithProviders(
      <PostCard post={ownPost} currentUserId="user-1" />
    );
    expect(queryByLabelText("Send kindness gift")).toBeNull();
  });

  it("shows report button when onReport handler is provided", () => {
    const onReport = jest.fn();
    const { getByLabelText } = renderWithProviders(
      <PostCard post={basePost} currentUserId="user-1" onReport={onReport} />
    );
    expect(getByLabelText("Report post")).toBeTruthy();
  });

  it("does not show report button for own posts even when onReport is provided", () => {
    const ownPost: Post = { ...basePost, authorId: "user-1" };
    const onReport = jest.fn();
    const { queryByLabelText } = renderWithProviders(
      <PostCard post={ownPost} currentUserId="user-1" onReport={onReport} />
    );
    expect(queryByLabelText("Report post")).toBeNull();
  });

  it("calls onReport with the post when report button is pressed", () => {
    const onReport = jest.fn();
    const { getByLabelText } = renderWithProviders(
      <PostCard post={basePost} currentUserId="user-1" onReport={onReport} />
    );

    fireEvent.click(getByLabelText("Report post"));

    expect(onReport).toHaveBeenCalledWith(basePost);
  });

  it("calls the like API when the like button is pressed", async () => {
    const { getByLabelText } = renderWithProviders(
      <PostCard post={basePost} currentUserId="user-1" />
    );

    fireEvent.click(getByLabelText("Like post"));

    await waitFor(() => {
      expect(apiMock.lastRequest?.method).toBe("POST");
      expect(apiMock.lastRequest?.url).toMatch(/\/api\/posts\/.+\/like/);
    });
  });

  it("calls the gift API when the gift button is pressed", async () => {
    const { getByLabelText } = renderWithProviders(
      <PostCard post={basePost} currentUserId="user-1" />
    );

    fireEvent.click(getByLabelText("Send kindness gift"));

    await waitFor(() => {
      expect(apiMock.lastRequest?.method).toBe("POST");
      expect(apiMock.lastRequest?.url).toMatch(/\/api\/posts\/.+\/gift/);
    });
  });

  it("shows Sent! text after gift is successfully submitted", async () => {
    const { getByLabelText, getAllByText } = renderWithProviders(
      <PostCard post={basePost} currentUserId="user-1" />
    );

    fireEvent.click(getByLabelText("Send kindness gift"));

    await waitFor(() => {
      expect(getAllByText("Sent!").length).toBeGreaterThan(0);
    });
  });

  it("navigates to post detail when card is pressed", async () => {
    const { container } = renderWithProviders(
      <PostCard post={basePost} currentUserId="user-1" />
    );

    const card = container.firstChild as HTMLElement;
    fireEvent.click(card);

    expect(mockRouter.push).toHaveBeenCalledWith("/post/post-1");
  });

  it("increments local like count optimistically when like is pressed", async () => {
    const { getByLabelText, queryAllByText } = renderWithProviders(
      <PostCard post={basePost} currentUserId="user-1" />
    );

    expect(queryAllByText("5").length).toBeGreaterThan(0);

    fireEvent.click(getByLabelText("Like post"));

    await waitFor(() => {
      expect(queryAllByText("6").length).toBeGreaterThan(0);
    });
  });

  it("renders 'just now' for very recent posts", () => {
    const recentPost: Post = {
      ...basePost,
      createdAt: new Date().toISOString(),
    };
    const { getByText } = renderWithProviders(
      <PostCard post={recentPost} currentUserId="user-1" />
    );
    expect(getByText("just now")).toBeTruthy();
  });

  it("renders hours-ago time for posts a few hours old", () => {
    const hoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const oldPost: Post = { ...basePost, createdAt: hoursAgo };
    const { getByText } = renderWithProviders(
      <PostCard post={oldPost} currentUserId="user-1" />
    );
    expect(getByText("3h")).toBeTruthy();
  });

  it("renders days-ago time for posts older than 24 hours", () => {
    const daysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const oldPost: Post = { ...basePost, createdAt: daysAgo };
    const { getByText } = renderWithProviders(
      <PostCard post={oldPost} currentUserId="user-1" />
    );
    expect(getByText("2d")).toBeTruthy();
  });

  it("renders minutes-ago time for posts a few minutes old", () => {
    const minsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const oldPost: Post = { ...basePost, createdAt: minsAgo };
    const { getByText } = renderWithProviders(
      <PostCard post={oldPost} currentUserId="user-1" />
    );
    expect(getByText("15m")).toBeTruthy();
  });

  it("reverts like count optimistically when like API returns error", async () => {
    apiMock.use("POST", "/api/posts/:id/like", () => ({
      status: 500,
      data: { error: "Server error" },
    }));

    const { getByLabelText, queryAllByText } = renderWithProviders(
      <PostCard post={basePost} currentUserId="user-1" />
    );

    expect(queryAllByText("5").length).toBeGreaterThan(0);

    fireEvent.click(getByLabelText("Like post"));

    await waitFor(() => {
      expect(queryAllByText("5").length).toBeGreaterThan(0);
    });
  });
});

import React from "react";
import { fireEvent, waitFor, act } from "@testing-library/react";
import { useRouter } from "expo-router";
import { renderWithProviders } from "./test-utils";
import { apiMock } from "./mocks/api-mock";
import FeedScreen from "../app/(tabs)/index";
import { FeedBadgeContext } from "../contexts/FeedBadgeContext";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue(mockRouter);
});

describe("FeedScreen", () => {
  it("renders the Feed header", () => {
    const { getAllByText } = renderWithProviders(<FeedScreen />);
    expect(getAllByText("Feed").length).toBeGreaterThan(0);
  });

  it("renders filter chips: All, Support, Kindness", () => {
    const { getAllByText } = renderWithProviders(<FeedScreen />);
    expect(getAllByText("All").length).toBeGreaterThan(0);
    expect(getAllByText("Support").length).toBeGreaterThan(0);
    expect(getAllByText("Kindness").length).toBeGreaterThan(0);
  });

  it("renders post cards from API data after fetch", async () => {
    const { getAllByText } = renderWithProviders(<FeedScreen />);
    await waitFor(() => {
      expect(getAllByText("Someone held the door for me today!").length).toBeGreaterThan(0);
      expect(getAllByText("I'm feeling overwhelmed with exams.").length).toBeGreaterThan(0);
    });
  });

  it("renders author nicknames on posts after fetch", async () => {
    const { getAllByText } = renderWithProviders(<FeedScreen />);
    await waitFor(() => {
      expect(getAllByText("BraveOtter").length).toBeGreaterThan(0);
      expect(getAllByText("CalmFox").length).toBeGreaterThan(0);
    });
  });

  it("renders all posts returned by the API", async () => {
    apiMock.use("GET", "/api/posts", () => ({
      status: 200,
      data: {
        posts: [
          { id: "p1", type: "kindness_act", content: "Alpha post content", authorNickname: "Alpha", authorId: "u1", likeCount: 2, commentCount: 0, createdAt: new Date().toISOString() },
          { id: "p2", type: "support", content: "Beta post content", authorNickname: "Beta", authorId: "u2", likeCount: 1, commentCount: 0, createdAt: new Date().toISOString() },
        ],
        nextCursor: null,
      },
    }));

    const { getAllByText } = renderWithProviders(<FeedScreen />);
    await waitFor(() => {
      expect(getAllByText("Alpha post content").length).toBeGreaterThan(0);
      expect(getAllByText("Beta post content").length).toBeGreaterThan(0);
    });
  });

  it("shows error state when posts API fails", async () => {
    apiMock.use("GET", "/api/posts", () => ({ status: 500, data: { error: "Server error" } }));

    const { getAllByText } = renderWithProviders(<FeedScreen />);
    await waitFor(() => {
      expect(getAllByText("Couldn't load posts").length).toBeGreaterThan(0);
      expect(getAllByText("Try Again").length).toBeGreaterThan(0);
    });
  });

  it("shows empty state when API returns no posts", async () => {
    apiMock.use("GET", "/api/posts", () => ({ status: 200, data: { posts: [], nextCursor: null } }));

    const { getAllByText } = renderWithProviders(<FeedScreen />);
    await waitFor(() => {
      expect(getAllByText("No posts yet").length).toBeGreaterThan(0);
    });
  });

  it("retries the fetch when Try Again is pressed", async () => {
    let callCount = 0;
    apiMock.use("GET", "/api/posts", () => {
      callCount++;
      if (callCount === 1) return { status: 500, data: { error: "Server error" } };
      return { status: 200, data: { posts: [], nextCursor: null } };
    });

    const { getAllByText } = renderWithProviders(<FeedScreen />);
    await waitFor(() => getAllByText("Try Again").length > 0);

    fireEvent.click(getAllByText("Try Again").at(-1)!);

    await waitFor(() => {
      expect(callCount).toBeGreaterThanOrEqual(2);
    });
  });

  it("includes type parameter in request when filter chip is pressed", async () => {
    const { getAllByText } = renderWithProviders(<FeedScreen />);
    await waitFor(() => expect(apiMock.lastRequest?.url).toContain("/api/posts"));

    fireEvent.click(getAllByText("Support").at(-1)!);

    await waitFor(() => {
      expect(apiMock.lastRequest?.url).toContain("type=support");
    });
  });

  it("sends request without type when All filter is re-selected", async () => {
    const { getAllByText } = renderWithProviders(<FeedScreen />);
    await waitFor(() => expect(apiMock.lastRequest?.url).toContain("/api/posts"));

    fireEvent.click(getAllByText("Support").at(-1)!);
    await waitFor(() => expect(apiMock.lastRequest?.url).toContain("type=support"));

    fireEvent.click(getAllByText("All").at(-1)!);
    await waitFor(() => {
      expect(apiMock.lastRequest?.url).not.toContain("type=");
    });
  });

  it("shows gift button on posts not authored by the current user", async () => {
    const { getAllByLabelText } = renderWithProviders(<FeedScreen />);
    await waitFor(() => {
      expect(getAllByLabelText("Send kindness gift").length).toBeGreaterThan(0);
    });
  });

  it("does not show gift button on posts authored by the current user", async () => {
    apiMock.use("GET", "/api/posts", () => ({
      status: 200,
      data: {
        posts: [
          {
            id: "own-post-1",
            type: "kindness_act",
            content: "My own post",
            authorNickname: "BraveOtter",
            authorId: "user-1",
            likeCount: 0,
            commentCount: 0,
            createdAt: new Date().toISOString(),
          },
        ],
        nextCursor: null,
      },
    }));

    const { queryAllByLabelText, getAllByText } = renderWithProviders(<FeedScreen />);
    await waitFor(() => getAllByText("My own post").length > 0);
    expect(queryAllByLabelText("Send kindness gift").length).toBe(0);
  });

  it("calls the gift API when the gift button is pressed", async () => {
    const { getAllByLabelText } = renderWithProviders(<FeedScreen />);
    await waitFor(() => getAllByLabelText("Send kindness gift").length > 0);

    fireEvent.click(getAllByLabelText("Send kindness gift").at(0)!);

    await waitFor(() => {
      expect(apiMock.lastRequest?.method).toBe("POST");
      expect(apiMock.lastRequest?.url).toMatch(/\/api\/posts\/.+\/gift/);
    });
  });

  it("shows Sent! feedback after gift is successfully submitted", async () => {
    const { getAllByLabelText, getAllByText } = renderWithProviders(<FeedScreen />);
    await waitFor(() => getAllByLabelText("Send kindness gift").length > 0);

    fireEvent.click(getAllByLabelText("Send kindness gift").at(0)!);

    await waitFor(() => {
      expect(getAllByText("Sent!").length).toBeGreaterThan(0);
    });
  });

});

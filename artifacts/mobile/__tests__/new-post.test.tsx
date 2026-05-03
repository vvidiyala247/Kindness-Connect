import React from "react";
import { fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "expo-router";
import { renderWithProviders } from "./test-utils";
import { apiMock } from "./mocks/api-mock";
import NewPostScreen from "../app/(tabs)/new-post";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue(mockRouter);
});

describe("NewPostScreen", () => {
  it("renders New Post header", () => {
    const { getAllByText } = renderWithProviders(<NewPostScreen />);
    expect(getAllByText("New Post").length).toBeGreaterThan(0);
  });

  it("renders post type options", () => {
    const { getAllByText } = renderWithProviders(<NewPostScreen />);
    expect(getAllByText("Need Support").length).toBeGreaterThan(0);
    expect(getAllByText("Kindness Act").length).toBeGreaterThan(0);
  });

  it("renders textarea with placeholder for default kindness_act type", () => {
    const { getByPlaceholderText } = renderWithProviders(<NewPostScreen />);
    expect(getByPlaceholderText(/Share a moment of kindness/i)).toBeTruthy();
  });

  it("changes placeholder when Support type is selected", () => {
    const { getAllByText, getByPlaceholderText } = renderWithProviders(<NewPostScreen />);

    const supportBtns = getAllByText("Need Support");
    fireEvent.click(supportBtns[supportBtns.length - 1]);

    expect(getByPlaceholderText(/Share what you're going through/i)).toBeTruthy();
  });

  it("shows privacy note about anonymous posting", () => {
    const { getAllByText } = renderWithProviders(<NewPostScreen />);
    expect(getAllByText(/Posted anonymously/i).length).toBeGreaterThan(0);
  });

  it("shows error when content is empty on submit", () => {
    const { getAllByText, getByText } = renderWithProviders(<NewPostScreen />);

    const postBtns = getAllByText("Post Anonymously");
    fireEvent.click(postBtns[postBtns.length - 1]);

    expect(getByText("Please write something before posting.")).toBeTruthy();
  });

  it("does not send API request when content is empty", () => {
    const { getAllByText } = renderWithProviders(<NewPostScreen />);
    const postBtns = getAllByText("Post Anonymously");
    fireEvent.click(postBtns[postBtns.length - 1]);

    expect(apiMock.lastRequest).toBeNull();
  });

  it("sends kindness_act post with correct data to the API", async () => {
    const { getByPlaceholderText, getAllByText } = renderWithProviders(<NewPostScreen />);

    fireEvent.change(
      getByPlaceholderText(/Share a moment of kindness/i),
      { target: { value: "I helped a classmate with their homework today!" } }
    );
    fireEvent.click(getAllByText("Post Anonymously").at(-1)!);

    await waitFor(() => {
      expect(apiMock.lastRequest?.url).toBe("http://localhost/api/posts");
      expect(apiMock.lastRequest?.method).toBe("POST");
      expect(apiMock.lastRequest?.body).toMatchObject({
        type: "kindness_act",
        content: "I helped a classmate with their homework today!",
      });
    });
  });

  it("sends support type post when Need Support type is selected", async () => {
    const { getAllByText, getByPlaceholderText } = renderWithProviders(<NewPostScreen />);

    fireEvent.click(getAllByText("Need Support").at(-1)!);

    fireEvent.change(
      getByPlaceholderText(/Share what you're going through/i),
      { target: { value: "I need help dealing with stress." } }
    );

    fireEvent.click(getAllByText("Post Anonymously").at(-1)!);

    await waitFor(() => {
      expect(apiMock.lastRequest?.body).toMatchObject({
        type: "support",
        content: "I need help dealing with stress.",
      });
    });
  });

  it("trims whitespace from content before sending to API", async () => {
    const { getByPlaceholderText, getAllByText } = renderWithProviders(<NewPostScreen />);

    fireEvent.change(
      getByPlaceholderText(/Share a moment of kindness/i),
      { target: { value: "  Kindness with extra spaces   " } }
    );
    fireEvent.click(getAllByText("Post Anonymously").at(-1)!);

    await waitFor(() => {
      expect((apiMock.lastRequest?.body as { content?: string })?.content).toBe(
        "Kindness with extra spaces"
      );
    });
  });

  it("shows character count for the textarea", () => {
    const { getAllByText } = renderWithProviders(<NewPostScreen />);
    expect(getAllByText("0/500").length).toBeGreaterThan(0);
  });

  it("updates character count as user types", () => {
    const { getByPlaceholderText, getAllByText } = renderWithProviders(<NewPostScreen />);

    fireEvent.change(
      getByPlaceholderText(/Share a moment of kindness/i),
      { target: { value: "Hello world" } }
    );

    expect(getAllByText("11/500").length).toBeGreaterThan(0);
  });

  it("navigates to feed on successful post creation", async () => {
    const { getByPlaceholderText, getAllByText } = renderWithProviders(<NewPostScreen />);

    fireEvent.change(
      getByPlaceholderText(/Share a moment of kindness/i),
      { target: { value: "A great act of kindness!" } }
    );
    fireEvent.click(getAllByText("Post Anonymously").at(-1)!);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith("/(tabs)");
    });
  });

  it("shows API error message on post failure", async () => {
    apiMock.use("POST", "/api/posts", () => ({
      status: 400,
      data: { error: "Content policy violation" },
    }));

    const { getByPlaceholderText, getAllByText, getByText } = renderWithProviders(<NewPostScreen />);

    fireEvent.change(
      getByPlaceholderText(/Share a moment of kindness/i),
      { target: { value: "Some post content" } }
    );
    fireEvent.click(getAllByText("Post Anonymously").at(-1)!);

    await waitFor(() => {
      expect(getByText("Content policy violation")).toBeTruthy();
    });
  });
});

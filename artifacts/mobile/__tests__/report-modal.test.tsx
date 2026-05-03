import React from "react";
import { fireEvent, waitFor, act } from "@testing-library/react";
import { renderWithProviders } from "./test-utils";
import { apiMock } from "./mocks/api-mock";
import { ReportModal } from "../components/ReportModal";

const defaultProps = {
  visible: true,
  targetType: "post" as const,
  targetId: "post-1",
  onClose: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ReportModal", () => {
  it("renders when visible is true", () => {
    const { getAllByText, getByText } = renderWithProviders(<ReportModal {...defaultProps} />);
    expect(getAllByText("Report content").length).toBeGreaterThan(0);
    expect(getByText("Why are you reporting this?")).toBeTruthy();
  });

  it("does not render content when visible is false", () => {
    const { queryByText } = renderWithProviders(
      <ReportModal {...defaultProps} visible={false} />
    );
    expect(queryByText("Report content")).toBeNull();
  });

  it("renders all report reason options", () => {
    const { getAllByText } = renderWithProviders(<ReportModal {...defaultProps} />);
    expect(getAllByText("Bullying").length).toBeGreaterThan(0);
    expect(getAllByText("Harmful content").length).toBeGreaterThan(0);
    expect(getAllByText("Inappropriate").length).toBeGreaterThan(0);
    expect(getAllByText("Spam").length).toBeGreaterThan(0);
    expect(getAllByText("Other").length).toBeGreaterThan(0);
  });

  it("renders the Submit Report button", () => {
    const { getAllByText } = renderWithProviders(<ReportModal {...defaultProps} />);
    expect(getAllByText("Submit Report").length).toBeGreaterThan(0);
  });

  it("submit button does not send API request when no reason is selected", () => {
    const { getAllByText } = renderWithProviders(<ReportModal {...defaultProps} />);
    const submitBtns = getAllByText("Submit Report");
    fireEvent.click(submitBtns[submitBtns.length - 1]);

    expect(apiMock.lastRequest).toBeNull();
  });

  it("allows selecting a reason", () => {
    const { getAllByText } = renderWithProviders(<ReportModal {...defaultProps} />);
    const bullyingBtns = getAllByText("Bullying");
    fireEvent.click(bullyingBtns[bullyingBtns.length - 1]);
    expect(getAllByText("Bullying").length).toBeGreaterThan(0);
  });

  it("sends report request to API with correct post target data", async () => {
    const { getAllByText } = renderWithProviders(<ReportModal {...defaultProps} />);

    fireEvent.click(getAllByText("Bullying").at(-1)!);
    fireEvent.click(getAllByText("Submit Report").at(-1)!);

    await waitFor(() => {
      expect(apiMock.lastRequest?.url).toBe("http://localhost/api/reports");
      expect(apiMock.lastRequest?.method).toBe("POST");
      expect(apiMock.lastRequest?.body).toMatchObject({
        targetType: "post",
        targetId: "post-1",
        reason: "bullying",
      });
    });
  });

  it("sends report request with comment target type to API", async () => {
    const { getAllByText } = renderWithProviders(
      <ReportModal
        visible={true}
        targetType="comment"
        targetId="comment-1"
        onClose={jest.fn()}
      />
    );

    fireEvent.click(getAllByText("Spam").at(-1)!);
    fireEvent.click(getAllByText("Submit Report").at(-1)!);

    await waitFor(() => {
      expect(apiMock.lastRequest?.body).toMatchObject({
        targetType: "comment",
        targetId: "comment-1",
        reason: "spam",
      });
    });
  });

  it("shows success state after real API report submission", async () => {
    const { getAllByText, getByText } = renderWithProviders(<ReportModal {...defaultProps} />);

    fireEvent.click(getAllByText("Inappropriate").at(-1)!);
    fireEvent.click(getAllByText("Submit Report").at(-1)!);

    await waitFor(() => {
      expect(getByText("Report submitted")).toBeTruthy();
      expect(getByText("Thank you for keeping our community safe")).toBeTruthy();
    });
  });

  it("calls onClose after success state timeout", async () => {
    jest.useFakeTimers({ doNotFake: ["nextTick", "queueMicrotask"] });
    const mockOnClose = jest.fn();

    const { getAllByText, getByText } = renderWithProviders(
      <ReportModal {...defaultProps} onClose={mockOnClose} />
    );

    fireEvent.click(getAllByText("Other").at(-1)!);
    fireEvent.click(getAllByText("Submit Report").at(-1)!);

    await waitFor(() => getByText("Report submitted"));

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });

    jest.useRealTimers();
  });

  it("uses the last selected reason when changed before submission", async () => {
    const { getAllByText } = renderWithProviders(<ReportModal {...defaultProps} />);

    fireEvent.click(getAllByText("Bullying").at(-1)!);
    fireEvent.click(getAllByText("Harmful content").at(-1)!);
    fireEvent.click(getAllByText("Submit Report").at(-1)!);

    await waitFor(() => {
      expect(apiMock.lastRequest?.body).toMatchObject({
        reason: "harmful",
      });
    });
  });
});

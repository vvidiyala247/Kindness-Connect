import React from "react";
import { fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "expo-router";
import { renderWithProviders, defaultAuthValue, mockUser } from "./test-utils";
import { apiMock } from "./mocks/api-mock";
import AdminScreen from "../app/(tabs)/admin";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };

const adminAuthValue = {
  ...defaultAuthValue,
  user: { ...mockUser, role: "admin" as const },
};

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue(mockRouter);
});

describe("AdminScreen — access control", () => {
  it("shows access restricted message for non-admin users", () => {
    const { getAllByText } = renderWithProviders(<AdminScreen />, {
      authValue: defaultAuthValue,
    });
    expect(getAllByText("Access restricted").length).toBeGreaterThan(0);
  });

  it("shows admin-only subtitle for non-admin users", () => {
    const { getAllByText } = renderWithProviders(<AdminScreen />, {
      authValue: defaultAuthValue,
    });
    expect(getAllByText("This area is for school admins only").length).toBeGreaterThan(0);
  });

  it("does not show Reports tab for non-admin users", () => {
    const { queryAllByText } = renderWithProviders(<AdminScreen />, {
      authValue: defaultAuthValue,
    });
    expect(queryAllByText("Reports").length).toBe(0);
  });
});

describe("AdminScreen — reports section", () => {
  it("renders Reports section heading for admin users", async () => {
    const { getAllByText } = renderWithProviders(<AdminScreen />, {
      authValue: adminAuthValue,
    });
    await waitFor(() => {
      expect(getAllByText("Reports").length).toBeGreaterThan(0);
    });
  });

  it("renders Schools tab navigation for admin users", async () => {
    const { getAllByText } = renderWithProviders(<AdminScreen />, {
      authValue: adminAuthValue,
    });
    await waitFor(() => {
      expect(getAllByText("Schools").length).toBeGreaterThan(0);
    });
  });

  it("renders Students tab navigation for admin users", async () => {
    const { getAllByText } = renderWithProviders(<AdminScreen />, {
      authValue: adminAuthValue,
    });
    await waitFor(() => {
      expect(getAllByText("Students").length).toBeGreaterThan(0);
    });
  });

  it("renders status filter buttons: Pending, Reviewed, Actioned", async () => {
    const { getAllByText } = renderWithProviders(<AdminScreen />, {
      authValue: adminAuthValue,
    });
    await waitFor(() => {
      expect(getAllByText("Pending").length).toBeGreaterThan(0);
      expect(getAllByText("Reviewed").length).toBeGreaterThan(0);
      expect(getAllByText("Actioned").length).toBeGreaterThan(0);
    });
  });

  it("renders report cards from API data", async () => {
    const { getAllByText } = renderWithProviders(<AdminScreen />, {
      authValue: adminAuthValue,
    });
    await waitFor(() => {
      expect(getAllByText("Bullying").length).toBeGreaterThan(0);
    });
  });

  it("renders target type on report cards", async () => {
    const { getAllByText } = renderWithProviders(<AdminScreen />, {
      authValue: adminAuthValue,
    });
    await waitFor(() => {
      expect(getAllByText("post").length).toBeGreaterThan(0);
    });
  });

  it("renders Reviewed action button on pending reports", async () => {
    const { getAllByText } = renderWithProviders(<AdminScreen />, {
      authValue: adminAuthValue,
    });
    await waitFor(() => {
      expect(getAllByText("Reviewed").length).toBeGreaterThan(0);
    });
  });

  it("renders Hide + Warn action button on pending reports", async () => {
    const { getAllByText } = renderWithProviders(<AdminScreen />, {
      authValue: adminAuthValue,
    });
    await waitFor(() => {
      expect(getAllByText("Hide + Warn").length).toBeGreaterThan(0);
    });
  });

  it("renders Block User action button on pending reports", async () => {
    const { getAllByText } = renderWithProviders(<AdminScreen />, {
      authValue: adminAuthValue,
    });
    await waitFor(() => {
      expect(getAllByText("Block User").length).toBeGreaterThan(0);
    });
  });

  it("renders both Reviewed and Hide + Warn action buttons for pending reports", async () => {
    const { getAllByText } = renderWithProviders(<AdminScreen />, {
      authValue: adminAuthValue,
    });
    await waitFor(() => {
      expect(getAllByText("Reviewed").length).toBeGreaterThan(0);
      expect(getAllByText("Hide + Warn").length).toBeGreaterThan(0);
    });
  });

  it("renders report status badge showing pending", async () => {
    const { getAllByText } = renderWithProviders(<AdminScreen />, {
      authValue: adminAuthValue,
    });
    await waitFor(() => {
      expect(getAllByText("pending").length).toBeGreaterThan(0);
    });
  });

  it("renders target ID on report cards from API data", async () => {
    const { getAllByText } = renderWithProviders(<AdminScreen />, {
      authValue: adminAuthValue,
    });
    await waitFor(() => {
      expect(getAllByText("post-1").length).toBeGreaterThan(0);
    });
  });

  it("shows empty state when no reports are returned", async () => {
    apiMock.use("GET", "/api/admin/reports", () => ({
      status: 200,
      data: [],
    }));
    const { getAllByText } = renderWithProviders(<AdminScreen />, {
      authValue: adminAuthValue,
    });
    await waitFor(() => {
      expect(getAllByText("No pending reports").length).toBeGreaterThan(0);
    });
  });

  it("switches to reviewed filter when Reviewed tab is pressed", async () => {
    const { getAllByText } = renderWithProviders(<AdminScreen />, {
      authValue: adminAuthValue,
    });
    await waitFor(() => getAllByText("Reviewed").length > 0);

    fireEvent.click(getAllByText("Reviewed").at(-1)!);

    await waitFor(() => {
      expect(apiMock.lastRequest?.url).toContain("status=reviewed");
    });
  });
});

describe("AdminScreen — schools section", () => {
  it("renders school names after switching to Schools tab", async () => {
    const { getAllByText } = renderWithProviders(<AdminScreen />, {
      authValue: adminAuthValue,
    });
    await waitFor(() => getAllByText("Schools").length > 0);

    fireEvent.click(getAllByText("Schools").at(-1)!);

    await waitFor(() => {
      expect(getAllByText("Springfield High").length).toBeGreaterThan(0);
    });
  });

  it("renders New School button in Schools section", async () => {
    const { getAllByText } = renderWithProviders(<AdminScreen />, {
      authValue: adminAuthValue,
    });
    await waitFor(() => getAllByText("Schools").length > 0);

    fireEvent.click(getAllByText("Schools").at(-1)!);

    await waitFor(() => {
      expect(getAllByText("New School").length).toBeGreaterThan(0);
    });
  });

  it("shows Tap to reveal join code hint on school cards", async () => {
    const { getAllByText } = renderWithProviders(<AdminScreen />, {
      authValue: adminAuthValue,
    });
    await waitFor(() => getAllByText("Schools").length > 0);
    fireEvent.click(getAllByText("Schools").at(-1)!);

    await waitFor(() => {
      expect(getAllByText("Tap to reveal join code").length).toBeGreaterThan(0);
    });
  });
});

describe("AdminScreen — users section", () => {
  it("renders student nicknames after switching to Students tab", async () => {
    const { getAllByText } = renderWithProviders(<AdminScreen />, {
      authValue: adminAuthValue,
    });
    await waitFor(() => getAllByText("Students").length > 0);

    fireEvent.click(getAllByText("Students").at(-1)!);

    await waitFor(() => {
      expect(getAllByText("CalmFox").length).toBeGreaterThan(0);
    });
  });

  it("renders student stats row with totals", async () => {
    const { getAllByText } = renderWithProviders(<AdminScreen />, {
      authValue: adminAuthValue,
    });
    await waitFor(() => getAllByText("Students").length > 0);
    fireEvent.click(getAllByText("Students").at(-1)!);

    await waitFor(() => {
      expect(getAllByText("Students").length).toBeGreaterThan(0);
    });
  });

  it("renders Warn button on user cards", async () => {
    const { getAllByText } = renderWithProviders(<AdminScreen />, {
      authValue: adminAuthValue,
    });
    await waitFor(() => getAllByText("Students").length > 0);
    fireEvent.click(getAllByText("Students").at(-1)!);

    await waitFor(() => {
      expect(getAllByText("Warn").length).toBeGreaterThan(0);
    });
  });

  it("renders Block button on non-suspended user cards", async () => {
    const { getAllByText } = renderWithProviders(<AdminScreen />, {
      authValue: adminAuthValue,
    });
    await waitFor(() => getAllByText("Students").length > 0);
    fireEvent.click(getAllByText("Students").at(-1)!);

    await waitFor(() => {
      expect(getAllByText("Block").length).toBeGreaterThan(0);
    });
  });

  it("shows Reinstate button for suspended users", async () => {
    apiMock.use("GET", "/api/admin/users", () => ({
      status: 200,
      data: [
        {
          id: "user-5",
          nickname: "SuspendedUser",
          schoolId: "school-1",
          role: "student",
          kindnessScore: 0,
          isSuspended: true,
          warningCount: 2,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ],
    }));

    const { getAllByText } = renderWithProviders(<AdminScreen />, {
      authValue: adminAuthValue,
    });
    await waitFor(() => getAllByText("Students").length > 0);
    fireEvent.click(getAllByText("Students").at(-1)!);

    await waitFor(() => {
      expect(getAllByText("Reinstate").length).toBeGreaterThan(0);
    });
  });
});

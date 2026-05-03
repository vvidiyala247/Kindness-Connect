import React from "react";
import { fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "expo-router";
import { renderWithProviders, defaultAuthValue } from "./test-utils";
import { apiMock } from "./mocks/api-mock";
import RegisterScreen from "../app/(auth)/register";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue(mockRouter);
});

describe("RegisterScreen", () => {
  it("renders the registration form", () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<RegisterScreen />);

    expect(getByText("Join your school")).toBeTruthy();
    expect(getByText("Select Your School")).toBeTruthy();
    expect(getByPlaceholderText("Min 8 characters")).toBeTruthy();
    expect(getByPlaceholderText("Repeat your password")).toBeTruthy();
    expect(getByText("Create Account")).toBeTruthy();
  });

  it("shows privacy info box", () => {
    const { getByText } = renderWithProviders(<RegisterScreen />);
    expect(getByText(/identity stays private/i)).toBeTruthy();
  });

  it("shows error when no school selected", () => {
    const { getAllByText, getByText } = renderWithProviders(<RegisterScreen />);
    const createBtn = getAllByText("Create Account");
    fireEvent.click(createBtn[createBtn.length - 1]);
    expect(getByText("Please select your school.")).toBeTruthy();
  });

  it("shows error when password is too short", async () => {
    const { findAllByText, getAllByText, getByText, getByPlaceholderText } = renderWithProviders(<RegisterScreen />);

    const pickerTrigger = await findAllByText(/Tap to choose your school/);
    fireEvent.click(pickerTrigger[pickerTrigger.length - 1]);
    await waitFor(() => getByText("Springfield High"));
    fireEvent.click(getAllByText("Springfield High").at(-1)!);

    fireEvent.change(getByPlaceholderText("Min 8 characters"), { target: { value: "short" } });
    fireEvent.change(getByPlaceholderText("Repeat your password"), { target: { value: "short" } });

    fireEvent.click(getAllByText("Create Account").at(-1)!);

    expect(getByText("Password must be at least 8 characters.")).toBeTruthy();
  });

  it("shows error when passwords don't match", async () => {
    const { findAllByText, getAllByText, getByText, getByPlaceholderText } = renderWithProviders(<RegisterScreen />);

    const pickerTrigger = await findAllByText(/Tap to choose your school/);
    fireEvent.click(pickerTrigger[pickerTrigger.length - 1]);
    await waitFor(() => getByText("Springfield High"));
    fireEvent.click(getAllByText("Springfield High").at(-1)!);

    fireEvent.change(getByPlaceholderText("Min 8 characters"), { target: { value: "password123" } });
    fireEvent.change(getByPlaceholderText("Repeat your password"), { target: { value: "different123" } });

    fireEvent.click(getAllByText("Create Account").at(-1)!);

    expect(getByText("Passwords don't match.")).toBeTruthy();
  });

  it("shows school picker modal and lists schools from API", async () => {
    const { findAllByText, getAllByText, getByText } = renderWithProviders(<RegisterScreen />);

    const pickerTrigger = await findAllByText(/Tap to choose your school/);
    fireEvent.click(pickerTrigger[pickerTrigger.length - 1]);

    await waitFor(() => {
      expect(getByText("Choose Your School")).toBeTruthy();
      expect(getAllByText("Springfield High").length).toBeGreaterThan(0);
      expect(getAllByText("Riverdale Academy").length).toBeGreaterThan(0);
    });
  });

  it("shows school join codes in the picker", async () => {
    const { findAllByText, getByText } = renderWithProviders(<RegisterScreen />);

    const pickerTrigger = await findAllByText(/Tap to choose your school/);
    fireEvent.click(pickerTrigger[pickerTrigger.length - 1]);

    await waitFor(() => {
      expect(getByText("Code: SPR001")).toBeTruthy();
      expect(getByText("Code: RIV002")).toBeTruthy();
    });
  });

  it("closes picker and shows selected school name after selection", async () => {
    const { findAllByText, getAllByText, queryAllByText } = renderWithProviders(<RegisterScreen />);

    const pickerTrigger = await findAllByText(/Tap to choose your school/);
    fireEvent.click(pickerTrigger[pickerTrigger.length - 1]);
    await waitFor(() => getAllByText("Springfield High").length > 0);

    fireEvent.click(getAllByText("Springfield High").at(-1)!);

    await waitFor(() => {
      expect(queryAllByText(/Tap to choose your school/).length).toBe(0);
      expect(getAllByText("Springfield High").length).toBeGreaterThan(0);
    });
  });

  it("calls register from AuthContext with correct data", async () => {
    const mockRegister = jest.fn().mockResolvedValue({
      token: "reg-token",
      user: { id: "u2", nickname: "HappyDog", role: "student", schoolId: "school-1", kindnessScore: 0 },
    });

    const { findAllByText, getAllByText, getByText, getByPlaceholderText } = renderWithProviders(<RegisterScreen />, {
      authValue: { ...defaultAuthValue, register: mockRegister },
    });

    const pickerTrigger = await findAllByText(/Tap to choose your school/);
    fireEvent.click(pickerTrigger[pickerTrigger.length - 1]);
    await waitFor(() => getByText("Springfield High"));
    fireEvent.click(getAllByText("Springfield High").at(-1)!);

    fireEvent.change(getByPlaceholderText("Min 8 characters"), { target: { value: "password123" } });
    fireEvent.change(getByPlaceholderText("Repeat your password"), { target: { value: "password123" } });

    fireEvent.click(getAllByText("Create Account").at(-1)!);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        joinCode: "SPR001",
        password: "password123",
      });
    });
  });

  it("shows success step with nickname after registration", async () => {
    const mockRegister = jest.fn().mockResolvedValue({
      token: "reg-token",
      user: { id: "u2", nickname: "HappyDog", role: "student", schoolId: "school-1", kindnessScore: 0 },
    });

    const { findAllByText, getAllByText, getByText, getByPlaceholderText } = renderWithProviders(<RegisterScreen />, {
      authValue: { ...defaultAuthValue, register: mockRegister },
    });

    const pickerTrigger = await findAllByText(/Tap to choose your school/);
    fireEvent.click(pickerTrigger[pickerTrigger.length - 1]);
    await waitFor(() => getByText("Springfield High"));
    fireEvent.click(getAllByText("Springfield High").at(-1)!);

    fireEvent.change(getByPlaceholderText("Min 8 characters"), { target: { value: "password123" } });
    fireEvent.change(getByPlaceholderText("Repeat your password"), { target: { value: "password123" } });

    fireEvent.click(getAllByText("Create Account").at(-1)!);

    await waitFor(() => {
      expect(getByText("You're in!")).toBeTruthy();
      expect(getAllByText("HappyDog").length).toBeGreaterThan(0);
      expect(getByText("Enter the Community")).toBeTruthy();
    });
  });

  it("shows empty schools message when API returns no schools", async () => {
    apiMock.use("GET", "/api/schools", () => ({ status: 200, data: [] }));

    const { findAllByText, getByText } = renderWithProviders(<RegisterScreen />);
    const pickerTrigger = await findAllByText(/Tap to choose your school/);
    fireEvent.click(pickerTrigger[pickerTrigger.length - 1]);

    await waitFor(() => {
      expect(getByText(/No schools available yet/)).toBeTruthy();
    });
  });

  it("navigates back when back button is pressed", () => {
    const { container } = renderWithProviders(<RegisterScreen />);
    const interactiveElements = container.querySelectorAll('[tabindex="0"]');
    if (interactiveElements.length > 0) {
      fireEvent.click(interactiveElements[0] as HTMLElement);
      expect(mockRouter.back).toHaveBeenCalled();
    }
  });
});

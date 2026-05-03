import React from "react";
import { fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "expo-router";
import { renderWithProviders, defaultAuthValue } from "./test-utils";
import { apiMock } from "./mocks/api-mock";
import LoginScreen from "../app/(auth)/login";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue(mockRouter);
});

describe("LoginScreen", () => {
  it("renders all form elements", () => {
    const { getByPlaceholderText, getAllByText } = renderWithProviders(<LoginScreen />);

    expect(getByPlaceholderText("BraveOtter")).toBeTruthy();
    expect(getByPlaceholderText("ABC123")).toBeTruthy();
    expect(getByPlaceholderText("••••••••")).toBeTruthy();
    expect(getAllByText("Sign In").length).toBeGreaterThan(0);
    expect(getAllByText("Join with a school code").length).toBeGreaterThan(0);
  });

  it("shows KindnessConnect branding", () => {
    const { getByText } = renderWithProviders(<LoginScreen />);
    expect(getByText("KindnessConnect")).toBeTruthy();
    expect(getByText("Your school's kindness community")).toBeTruthy();
  });

  it("shows validation error when fields are empty", () => {
    const { getAllByText, getByText } = renderWithProviders(<LoginScreen />);

    const signInElements = getAllByText("Sign In");
    fireEvent.click(signInElements[signInElements.length - 1]);

    expect(getByText("Please fill in all fields.")).toBeTruthy();
  });

  it("sends login request with correct data", async () => {
    const { getByPlaceholderText, getAllByText } = renderWithProviders(<LoginScreen />);

    fireEvent.change(getByPlaceholderText("BraveOtter"), { target: { value: "CoolCat" } });
    fireEvent.change(getByPlaceholderText("ABC123"), { target: { value: "TST001" } });
    fireEvent.change(getByPlaceholderText("••••••••"), { target: { value: "password123" } });

    fireEvent.click(getAllByText("Sign In").at(-1)!);

    await waitFor(() => {
      expect(apiMock.lastRequest?.url).toBe("http://localhost/api/auth/login");
      expect(apiMock.lastRequest?.method).toBe("POST");
      expect(apiMock.lastRequest?.body).toMatchObject({
        nickname: "CoolCat",
        joinCode: "TST001",
        password: "password123",
      });
    });
  });

  it("uppercases the school code as user types", () => {
    const { getByPlaceholderText } = renderWithProviders(<LoginScreen />);

    const codeInput = getByPlaceholderText("ABC123") as HTMLInputElement;
    fireEvent.change(codeInput, { target: { value: "abc123" } });
    expect(codeInput.value).toBe("ABC123");
  });

  it("shows API error message on failed login", async () => {
    apiMock.use("POST", "/api/auth/login", () => ({
      status: 401,
      data: { error: "Invalid credentials" },
    }));

    const { getByPlaceholderText, getAllByText, getByText } = renderWithProviders(<LoginScreen />);

    fireEvent.change(getByPlaceholderText("BraveOtter"), { target: { value: "CoolCat" } });
    fireEvent.change(getByPlaceholderText("ABC123"), { target: { value: "TST001" } });
    fireEvent.change(getByPlaceholderText("••••••••"), { target: { value: "wrongpass" } });

    fireEvent.click(getAllByText("Sign In").at(-1)!);

    await waitFor(() => {
      expect(getByText("Invalid credentials")).toBeTruthy();
    });
  });

  it("navigates to register screen when 'Join with a school code' pressed", () => {
    const { getAllByText } = renderWithProviders(<LoginScreen />);

    const joinElements = getAllByText("Join with a school code");
    fireEvent.click(joinElements[joinElements.length - 1]);
    expect(mockRouter.push).toHaveBeenCalledWith("/(auth)/register");
  });

  it("calls auth.login and navigates to feed on successful login", async () => {
    const mockLogin = jest.fn();
    const { getByPlaceholderText, getAllByText } = renderWithProviders(<LoginScreen />, {
      authValue: { ...defaultAuthValue, login: mockLogin },
    });

    fireEvent.change(getByPlaceholderText("BraveOtter"), { target: { value: "CoolCat" } });
    fireEvent.change(getByPlaceholderText("ABC123"), { target: { value: "TST001" } });
    fireEvent.change(getByPlaceholderText("••••••••"), { target: { value: "password123" } });

    fireEvent.click(getAllByText("Sign In").at(-1)!);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        "test-token-123",
        expect.objectContaining({ nickname: "BraveOtter" })
      );
      expect(mockRouter.replace).toHaveBeenCalledWith("/(tabs)");
    });
  });

  it("shows Sign In button initially (not in loading state)", () => {
    const { getAllByText } = renderWithProviders(<LoginScreen />);
    expect(getAllByText("Sign In").length).toBeGreaterThan(1);
  });
});

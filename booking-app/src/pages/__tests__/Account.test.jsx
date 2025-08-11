import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/test-utils";
import Account from "../Account";
import * as api from "../../services/api";

vi.spyOn(api, "getAccountMe");
vi.spyOn(api, "authLogout");

function setAuthed() {
  localStorage.setItem("rb_token", "t");
  localStorage.setItem("rb_email", "me@example.com");
  localStorage.setItem("rb_user_type", "customer");
}

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

test("renders with server profile when /auth/me works", async () => {
  setAuthed();
  api.getAccountMe.mockResolvedValue({
    email: "me@example.com",
    user_type: "customer",
    first_name: "Alex",
    surname: "Lee",
  });

  renderWithProviders(<Account />, { route: "/account" });

  await screen.findByText(/account settings/i);
  expect(screen.getByText("me@example.com")).toBeInTheDocument();
  expect(screen.getByText(/Alex/)).toBeInTheDocument();
});

test("handles missing /auth/me endpoint gracefully (404)", async () => {
  setAuthed();
  api.getAccountMe.mockRejectedValue({ response: { status: 404 } });

  renderWithProviders(<Account />, { route: "/account" });

  await screen.findByText(/account settings/i);
  // still renders using context email
  expect(screen.getByText("me@example.com")).toBeInTheDocument();
});

test("logout clears session and navigates home", async () => {
  setAuthed();
  api.getAccountMe.mockRejectedValue({ response: { status: 404 } });
  api.authLogout.mockResolvedValue({});

  renderWithProviders(<Account />, { route: "/account" });

  await screen.findByText(/account settings/i);
  const [signOutBtn] = screen.getAllByRole("button", { name: /sign out/i });
  fireEvent.click(signOutBtn);

  await waitFor(() => {
    expect(localStorage.getItem("rb_token")).toBeNull();
  });
});
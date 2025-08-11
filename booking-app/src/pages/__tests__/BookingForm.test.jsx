import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { vi } from "vitest";
import * as api from "../../services/api";
import AuthProvider from "../../context/AuthContext";
import BookingForm from "../BookingForm";
import AuthPage from "../Auth";

vi.spyOn(api, "searchAvailability").mockResolvedValue([
  { time: "12:30:00", available: true, max_party_size: 8 }
]);

function renderWithRoutes(initialEntry = "/booking/new?date=2025-08-10&time=12:30:00") {
  localStorage.clear();
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/booking/new" element={<BookingForm />} />
          <Route path="/auth" element={<div>Auth Page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

test("redirects to /auth if unauthenticated on confirm", async () => {
  renderWithRoutes();

  // Fill minimal details so the review step is available (adapt selectors to your form)
  fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "John" } });
  fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Doe" } });
  fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "john@example.com" } });
  fireEvent.change(screen.getByLabelText(/mobile/i), { target: { value: "123" } });

  // Advance to review (if your UI requires it)
  fireEvent.click(screen.getByRole("button", { name: /review booking/i }));

  // Click confirm (should redirect)
  fireEvent.click(screen.getByRole("button", { name: /confirm booking/i }));

  // Assert we landed on the auth page
  await waitFor(() => {
    expect(screen.getByText(/auth page/i)).toBeInTheDocument();
  });
});
import { renderWithProviders } from "../../test/test-utils";
import BookingForm from "../BookingForm";
import * as api from "../../services/api";
import { screen, waitFor, fireEvent } from "@testing-library/react";

vi.spyOn(api, "searchAvailability");
vi.spyOn(api, "createBooking");

function setAuthed() {
  localStorage.setItem("rb_token", "abc");
  localStorage.setItem("rb_user_type", "customer");
  localStorage.setItem("rb_email", "john@example.com");
}

test("redirect hint if unauthenticated on confirm", async () => {
  api.searchAvailability.mockResolvedValue([{ time: "12:30:00", available: true, max_party_size: 8 }]);
  renderWithProviders(<BookingForm />, { route: "/booking/new?date=2025-08-10&time=12:30:00" });

  // Fill minimal info
  fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "John" } });
  fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Doe" } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "john@example.com" } });
  fireEvent.change(screen.getByLabelText(/mobile/i), { target: { value: "123" } });

  fireEvent.click(screen.getByRole("button", { name: /review booking/i }));
  fireEvent.click(screen.getByRole("button", { name: /confirm booking/i }));

  await waitFor(() => {
    expect(screen.getByText(/You need to be logged in/i)).toBeInTheDocument();
  });
});

test("creates booking when authed and slot available", async () => {
  setAuthed();
  api.searchAvailability.mockResolvedValue([{ time: "12:30:00", available: true, max_party_size: 8 }]);
  api.createBooking.mockResolvedValue({ data: { booking_reference: "ABC1234", visit_date: "2025-08-10", visit_time: "12:30:00", party_size: 2 } });

  renderWithProviders(<BookingForm />, { route: "/booking/new?date=2025-08-10&time=12:30:00" });

  fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "John" } });
  fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Doe" } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "john@example.com" } });
  fireEvent.change(screen.getByLabelText(/mobile/i), { target: { value: "123" } });

  fireEvent.click(screen.getByRole("button", { name: /review booking/i }));
  fireEvent.click(screen.getByRole("button", { name: /confirm booking/i }));

  await waitFor(() => {
    expect(screen.getByText(/Booking confirmed/i)).toBeInTheDocument();
    expect(screen.getByText(/ABC1234/i)).toBeInTheDocument();
  });
});
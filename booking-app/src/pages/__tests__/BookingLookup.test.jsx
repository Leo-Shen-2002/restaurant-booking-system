import { renderWithProviders } from "../../test/test-utils";
import BookingLookup from "../BookingLookup";
import * as api from "../../services/api";
import { screen, waitFor, fireEvent, within } from "@testing-library/react";

vi.spyOn(api, "getBookingByReference");
vi.spyOn(api, "cancelBooking");

const booking = {
  booking_reference: "ABC1234",
  restaurant: "TheHungryUnicorn",
  visit_date: "2025-08-10",
  visit_time: "12:00:00",
  party_size: 2,
  status: "confirmed",
  customer: { first_name: "John", surname: "Smith", email: "john@example.com" },
};

afterEach(() => vi.clearAllMocks());

test("shows booking details after search", async () => {
  api.getBookingByReference.mockResolvedValue(booking);

  renderWithProviders(<BookingLookup />, { route: "/booking/lookup?ref=ABC1234" });
 
  await screen.findByRole("heading", { name: /booking details/i });
 
  expect(screen.getAllByText(/ABC1234/).length).toBeGreaterThan(0);
 
  expect(screen.getByText("12:00")).toBeInTheDocument();
});

test("shows login prompt on 401", async () => {
  api.getBookingByReference.mockRejectedValue({ response: { status: 401 } });

  renderWithProviders(<BookingLookup />, { route: "/booking/lookup?ref=ABC1234" });

  await screen.findByText(/you need to log in/i);
  const links = screen.getAllByRole("link", { name: /login \/ register/i });
  const inlineLink = links.find(a => a.getAttribute("href")?.includes("returnTo="));
  expect(inlineLink).toBeTruthy();
});

test("cancel flow opens modal and calls API", async () => {
  api.getBookingByReference.mockResolvedValue(booking);
  api.cancelBooking.mockResolvedValue({ status: "cancelled" });

  renderWithProviders(<BookingLookup />, { route: "/booking/lookup?ref=ABC1234" });

  await waitFor(() => expect(api.getBookingByReference).toHaveBeenCalled());
  fireEvent.click(screen.getByRole("button", { name: /cancel booking/i }));

  // modal shows
  expect(screen.getByRole("heading", { name: /cancel booking/i })).toBeInTheDocument();
  // confirm
  fireEvent.click(screen.getByRole("button", { name: /confirm cancel/i }));

  await waitFor(() => expect(api.cancelBooking).toHaveBeenCalled());
  expect(screen.getByText(/cancelled/i)).toBeInTheDocument();
});
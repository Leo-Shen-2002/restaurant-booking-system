import { renderWithProviders } from "../../test/test-utils";
import Availability from "../Availability";
import * as api from "../../services/api";
import { screen, waitFor } from "@testing-library/react";

vi.spyOn(api, "searchAvailability");

test("shows slot list", async () => {
  api.searchAvailability.mockResolvedValue([
    { time: "12:00:00", available: true,  max_party_size: 8, current_bookings: 0 },
    { time: "12:30:00", available: false, max_party_size: 8, current_bookings: 3 },
  ]);

  renderWithProviders(<Availability />, {
    route: "/availability?date=2025-08-12&partySize=2",
  });

  await waitFor(() => expect(api.searchAvailability).toHaveBeenCalledTimes(1));

  // New: heading exists
  expect(screen.getByRole("heading", { name: /available time slots/i })).toBeInTheDocument();

  // Time buttons
  expect(screen.getByText("12:00")).toBeInTheDocument();
  expect(screen.getByText("12:30")).toBeInTheDocument();

  // Legend text
  expect(screen.getByText(/Max party per slot:\s*8/i)).toBeInTheDocument();
});
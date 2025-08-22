import { renderWithProviders } from "../../test/test-utils";
import Availability from "../Availability";
import * as api from "../../services/api";
import { screen, waitFor } from "@testing-library/react";

vi.spyOn(api, "searchAvailability");

function fmt(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

test("shows slot list", async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = fmt(tomorrow);

  api.searchAvailability.mockResolvedValue([
    { time: "12:00:00", available: true, max_party_size: 8, current_bookings: 0 },
    { time: "12:30:00", available: false, max_party_size: 8, current_bookings: 3 },
  ]);

  renderWithProviders(<Availability />, {
    route: `/availability?date=${dateStr}&partySize=2`,
  });

  await waitFor(() => expect(api.searchAvailability).toHaveBeenCalledTimes(1));
  expect(screen.getByText(/Available time slots/i)).toBeInTheDocument();
  expect(screen.getByText("12:00")).toBeInTheDocument();
  expect(screen.getByText(/Max party per slot:\s*8/i)).toBeInTheDocument();
});
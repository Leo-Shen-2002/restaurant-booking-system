import { screen, fireEvent } from "@testing-library/react";
import Home from "../Home";
import { renderWithProviders } from "../../test/test-utils";

// mock useNavigate to capture where the component navigates
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (orig) => {
  const actual = await orig();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function fmt(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

test("search navigates to availability with query params", async () => {
  renderWithProviders(<Home />);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = fmt(tomorrow);
  const dateInput = screen.getByLabelText(/date/i) || screen.getByDisplayValue("");
  const partyInput = screen.getByDisplayValue("2");


  fireEvent.change(dateInput, { target: { value: dateStr } });
  fireEvent.change(partyInput, { target: { value: "4" } });

  fireEvent.click(screen.getByRole("button", { name: /search availability/i }));

  expect(mockNavigate).toHaveBeenCalledWith(`/availability?date=${dateStr}&partySize=4`);
});
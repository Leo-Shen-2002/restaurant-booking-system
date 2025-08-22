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

test("search navigates to availability with query params", async () => {
  renderWithProviders(<Home />);
  const dateInput = screen.getByLabelText(/date/i) || screen.getByDisplayValue("");
  const partyInput = screen.getByDisplayValue("2");

  fireEvent.change(dateInput, { target: { value: "2025-08-30" } });
  fireEvent.change(partyInput, { target: { value: "4" } });

  fireEvent.click(screen.getByRole("button", { name: /search availability/i }));

  expect(mockNavigate).toHaveBeenCalledWith("/availability?date=2025-08-30&partySize=4");
});
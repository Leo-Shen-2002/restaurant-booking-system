import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AuthProvider from "../context/AuthContext";

export function renderWithProviders(ui, { route = "/", auth = {} } = {}) {
  window.history.pushState({}, "", route);
  const Wrapper = ({ children }) => (
    <AuthProvider {...auth}>
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    </AuthProvider>
  );
  return render(ui, { wrapper: Wrapper });
}

import RequireAuth from "../../components/RequireAuth";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render } from "@testing-library/react";
import AuthProvider from "../../context/AuthContext";

function App({ isAuthed = false, userType = "customer" }) {
  if (isAuthed) {
    localStorage.setItem("rb_token", "t"); localStorage.setItem("rb_user_type", userType);
  } else {
    localStorage.clear();
  }
  return (
    <AuthProvider>
      <MemoryRouter initialEntries={["/secure"]}>
        <Routes>
          <Route element={<RequireAuth allow={["customer"]} />}>
            <Route path="/secure" element={<div>Secure</div>} />
          </Route>
          <Route path="/auth" element={<div>Auth</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

test("redirects to /auth when not authed", () => {
  const { getByText } = render(<App isAuthed={false} />);
  expect(getByText(/Auth/i)).toBeInTheDocument();
});

test("renders when authed and role allowed", () => {
  const { getByText } = render(<App isAuthed={true} userType="customer" />);
  expect(getByText(/Secure/i)).toBeInTheDocument();
});
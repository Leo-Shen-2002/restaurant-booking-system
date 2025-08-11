// src/components/RequireAuth.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * Protect routes by auth + optional role(s).
 *
 * Props:
 * - allow: array of allowed roles (e.g. ["customer"] or ["restaurant"])
 * - redirectTo: path to send unauthenticated users (default: "/auth")
 *
 * Usage:
 * <Route element={<RequireAuth allow={["customer"]} />}>
 *   <Route path="/booking/lookup" element={<BookingLookup />} />
 * </Route>
 *
 * or as a wrapper:
 * <RequireAuth allow={["restaurant"]}><Dashboard/></RequireAuth>
 */
export default function RequireAuth({
  allow = ["customer", "restaurant"],
  redirectTo = "/auth",
  children,
}) {
  const { isAuthed, userType } = useAuth();
  const loc = useLocation();
  const returnTo = encodeURIComponent(loc.pathname + loc.search);

  // Not logged in → send to /auth with returnTo
  if (!isAuthed) {
    return <Navigate to={`${redirectTo}?returnTo=${returnTo}`} replace />;
  }

  // Logged in but wrong role → bounce home (or a dedicated "unauthorized" page if you add one)
  if (userType && !allow.includes(userType)) {
    return <Navigate to={`/?unauthorized=1`} replace />;
  }

  // Support both wrapper and outlet usage
  if (children) return children;
  return <Outlet />;
}
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
export default function RequireAuth({ allow = ["customer", "restaurant"] }) {
  const { isAuthed, userType } = useAuth();
  if (!isAuthed) return <Navigate to="/auth" replace />;
  if (!allow.includes(userType)) return <Navigate to="/auth" replace />;
  return <Outlet />;
}
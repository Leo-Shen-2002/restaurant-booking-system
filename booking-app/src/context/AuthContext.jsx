import { useEffect, useMemo, useState } from "react";
import AuthContext from "./auth-context";
import { login as apiLogin, register as apiRegister, authLogout } from "../services/api";

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("rb_token") || "");
  const [userType, setUserType] = useState(() => localStorage.getItem("rb_user_type") || "");
  const [email, setEmail] = useState(() => localStorage.getItem("rb_email") || "");

  useEffect(() => { token ? localStorage.setItem("rb_token", token) : localStorage.removeItem("rb_token"); }, [token]);
  useEffect(() => { userType ? localStorage.setItem("rb_user_type", userType) : localStorage.removeItem("rb_user_type"); }, [userType]);
  useEffect(() => { email ? localStorage.setItem("rb_email", email) : localStorage.removeItem("rb_email"); }, [email]);

  const login = async ({ email, password, user_type }) => {
    const data = await apiLogin({ email, password, user_type });
    setToken(data.access_token);
    setUserType(data.user_type);
    setEmail(email);
    return data;
  };

  const register = async (payload) => {
    const data = await apiRegister(payload);
    setToken(data.access_token);
    setUserType(data.user_type);
    setEmail(payload.email);
    return data;
  };

  const logout = async () => {
    try { await authLogout(); } catch { /* ignore */ }
    setToken(""); setUserType(""); setEmail("");
  };

  const value = useMemo(() => ({
    token, userType, email, login, register, logout, isAuthed: Boolean(token),
  }), [token, userType, email]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [userType, setUserType] = useState("customer"); // 'customer' | 'restaurant'
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    surname: "",
    name: "", // restaurant name
  });
  const [error, setError] = useState("");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (mode === "login") {
        await login({
          email: form.email,
          password: form.password,
          user_type: userType,
        });
      } else {
        // register
        await register({
          email: form.email,
          password: form.password,
          user_type: userType,
          first_name: userType === "customer" ? form.first_name : undefined,
          surname: userType === "customer" ? form.surname : undefined,
          name: userType === "restaurant" ? form.name : undefined,
        });
      }
      // Redirect based on user type
      navigate(userType === "customer" ? "/" : "/restaurant/dashboard");
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.detail || "Authentication failed";
      setError(Array.isArray(msg) ? msg.map(m => m.msg).join(", ") : msg);
    }
  };

  return (
    <div className="mx-auto max-w-md mt-10 p-6 rounded-2xl border shadow-sm">
      <h1 className="text-2xl font-bold mb-4">
        {mode === "login" ? "Sign in" : "Create an account"}
      </h1>

      <div className="flex gap-3 mb-4">
        <button
          className={`px-3 py-1 rounded ${mode === "login" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
          onClick={() => setMode("login")}
        >
          Login
        </button>
        <button
          className={`px-3 py-1 rounded ${mode === "register" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
          onClick={() => setMode("register")}
        >
          Register
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <label className={`px-3 py-1 rounded cursor-pointer ${userType === "customer" ? "bg-blue-50 border border-blue-200" : "bg-gray-50"}`}>
          <input
            type="radio"
            className="mr-2"
            name="userType"
            value="customer"
            checked={userType === "customer"}
            onChange={() => setUserType("customer")}
          />
          Customer
        </label>
        <label className={`px-3 py-1 rounded cursor-pointer ${userType === "restaurant" ? "bg-blue-50 border border-blue-200" : "bg-gray-50"}`}>
          <input
            type="radio"
            className="mr-2"
            name="userType"
            value="restaurant"
            checked={userType === "restaurant"}
            onChange={() => setUserType("restaurant")}
          />
          Restaurant
        </label>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        {/* Shared */}
        <input
          name="email"
          type="email"
          placeholder="Email"
          className="w-full border rounded p-2"
          value={form.email}
          onChange={onChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="w-full border rounded p-2"
          value={form.password}
          onChange={onChange}
          required
        />

        {/* Customer-only fields (register mode) */}
        {mode === "register" && userType === "customer" && (
          <>
            <input
              name="first_name"
              placeholder="First name"
              className="w-full border rounded p-2"
              value={form.first_name}
              onChange={onChange}
              required
            />
            <input
              name="surname"
              placeholder="Surname"
              className="w-full border rounded p-2"
              value={form.surname}
              onChange={onChange}
              required
            />
          </>
        )}

        {/* Restaurant-only fields (register mode) */}
        {mode === "register" && userType === "restaurant" && (
          <input
            name="name"
            placeholder="Restaurant name"
            className="w-full border rounded p-2"
            value={form.name}
            onChange={onChange}
            required
          />
        )}

        <button className="w-full bg-blue-600 text-white rounded p-2">
          {mode === "login" ? "Login" : "Register"}
        </button>
      </form>

      {error && <p className="text-red-600 mt-3">{error}</p>}
    </div>
  );
}
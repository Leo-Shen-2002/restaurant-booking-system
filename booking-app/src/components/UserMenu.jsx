import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

export default function UserMenu() {
  const { isAuthed, email, userType, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  if (!isAuthed) {
    return <Link to="/auth" className="text-blue-600 hover:underline text-sm">Login / Register</Link>;
  }

  const initials = email ? email[0].toUpperCase() : "U";

  const doLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border px-3 py-1.5 bg-white"
      >
        <span className="h-7 w-7 grid place-items-center rounded-full bg-blue-600 text-white text-sm">
          {initials}
        </span>
        <span className="hidden sm:block text-sm">{email}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border p-2 text-sm">
          <div className="px-2 py-1.5 text-slate-600">
            Signed in as <span className="font-medium">{email}</span>
            <div className="text-xs text-slate-500">Role: {userType || "-"}</div>
          </div>
          <hr className="my-2" />
          <Link to="/account" className="block px-2 py-1.5 rounded hover:bg-slate-50">Account settings</Link>
          <button onClick={doLogout} className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-50 text-rose-700">
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
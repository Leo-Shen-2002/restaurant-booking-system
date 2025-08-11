import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { getAccountMe, authLogout } from "../services/api";

export default function Account() {
  const { isAuthed, email, userType, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [serverProfile, setServerProfile] = useState(null);
  const [error, setError] = useState("");

useEffect(() => {
  if (!isAuthed) {
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    navigate(`/auth?returnTo=${returnTo}`, { replace: true });
    return;
  }

  let cancelled = false;
  (async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAccountMe();
      if (!cancelled) setServerProfile(data); 
    } catch (err) {
      const status = err?.response?.status;
      if (status && (status === 404 || status === 501)) {
        console.error(err);
        // endpoint not available
      } else if (!cancelled) {
        console.error("getAccountMe failed:", err?.response?.data || err?.message);
        setError("We couldn’t load your full profile right now.");
      }
    } finally {
      if (!cancelled) setLoading(false);
    }
  })();

  return () => { cancelled = true; };
}, [isAuthed, navigate]);

  const doSignOut = async () => {
    await logout();           // clears access + calls /auth/logout to clear cookie
    navigate("/", { replace: true });
  };

  if (!isAuthed) return null;
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="w-96 h-40 bg-slate-200 animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold hover:underline">← The Hungry Unicorn</Link>
          <Link to="/booking/lookup" className="text-blue-600 hover:underline text-sm">Your bookings</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 md:py-10">
        <h1 className="text-2xl font-bold">Account settings</h1>
        {error && <p className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded text-rose-700">{error}</p>}

        {/* Profile card */}
        <section className="mt-5 p-4 md:p-5 bg-white rounded-2xl border shadow-sm">
          <h2 className="font-semibold">Profile</h2>
          <div className="mt-3 grid sm:grid-cols-2 gap-4 text-sm">
            <Field label="Email" value={email} />
            <Field label="Role" value={userType || "-"} />
            {/* If you add /auth/me with names, show them here: */}
            {serverProfile?.first_name && <Field label="First name" value={serverProfile.first_name} />}
            {serverProfile?.surname && <Field label="Last name" value={serverProfile.surname} />}
          </div>
          <p className="text-xs text-slate-500 mt-3">
            To update your details (name, mobile), you can add a small profile endpoint later (e.g. <code>PATCH /profile</code>).
          </p>
        </section>

        {/* Security */}
        <section className="mt-5 p-4 md:p-5 bg-white rounded-2xl border shadow-sm">
          <h2 className="font-semibold">Security</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              onClick={doSignOut}
              className="rounded-lg bg-slate-900 text-white px-4 py-2 hover:bg-black"
            >
              Sign out
            </button>
            <button
              onClick={async () => {
                // “Sign out everywhere” needs server-side token invalidation/rotation list.
                // For now, best-effort: clear refresh cookie + local token.
                try { await authLogout(); } catch (err) {console.error(err);}
                await logout();
                navigate("/", { replace: true });
              }}
              className="rounded-lg border px-4 py-2"
              title="Requires server invalidation for full effect"
            >
              Sign out everywhere (beta)
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            For a true “sign out everywhere”, add server-side token revocation (e.g., refresh token rotation with a denylist).
          </p>
        </section>

        {/* Preferences (placeholder you can wire later) */}
        <section className="mt-5 p-4 md:p-5 bg-white rounded-2xl border shadow-sm">
          <h2 className="font-semibold">Preferences</h2>
          <p className="text-sm text-slate-600 mt-2">
            Email/SMS marketing preferences can live here. Your backend already has fields on <code>Customer</code>; expose them via a simple <code>GET/PUT /preferences</code> when ready.
          </p>
        </section>
      </main>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="rounded-xl border p-3 bg-white">
      <div className="text-slate-500">{label}</div>
      <div className="mt-1 font-medium text-slate-800 break-words">{value}</div>
    </div>
  );
}
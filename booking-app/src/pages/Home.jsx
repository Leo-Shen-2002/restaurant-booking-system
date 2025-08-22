import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import UserMenu from "../components/UserMenu";

const OPENING_HOURS = {
  Mon: "12:00–14:00, 19:00–21:00",
  Tue: "12:00–14:00, 19:00–21:00",
  Wed: "12:00–14:00, 19:00–21:00",
  Thu: "12:00–14:30, 19:00–21:30",
  Fri: "12:00–14:30, 19:00–22:00",
  Sat: "12:00–15:00, 19:00–22:00",
  Sun: "12:00–15:00, 19:00–21:00",
};

const MAX_PARTY_SIZE = 8;

export default function Home() {
  const navigate = useNavigate();
  const [date, setDate] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [showPolicy, setShowPolicy] = useState(false);
  const [errors, setErrors] = useState({});

  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);


const handleSearch = (e) => {
  e?.preventDefault();
  const errs = {};
  if (!date) errs.date = "Please choose a date";
  else if (date < todayStr) errs.date = "Date can’t be in the past.";
  if (partySize < 1) errs.party = "Party size must be at least 1";
  else if (partySize > MAX_PARTY_SIZE) errs.party = `Maximum party size is ${MAX_PARTY_SIZE}.`;
  setErrors(errs);
  if (Object.keys(errs).length) return;

  navigate(`/availability?date=${date}&partySize=${partySize}`);
};

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Top bar */}
      <header className="border-b bg-white/70 backdrop-blur">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 text-white grid place-items-center font-bold">HU</div>
            <span className="font-semibold">The Hungry Unicorn</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <UserMenu />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 py-10 md:py-16 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Book your table in seconds
          </h1>
          <p className="text-slate-600 mt-3">
            Seasonal plates, cozy vibes, and friendly faces. Reserve a spot for lunch or dinner.
            Same-day bookings welcome.
          </p>

          {/* Search card */}
          <form data-testid="search-form" onSubmit={handleSearch} className="mt-6 p-4 md:p-5 bg-white rounded-2xl shadow-sm border">
            <h2 className="font-semibold mb-3">Find a table</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label htmlFor="search-date" className="text-sm text-slate-600">Date</label>
                <input
                  id="search-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full mt-1 rounded-lg border p-2"
                />
                {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
              </div>

              <div>
                <label htmlFor="search-party" className="text-sm text-slate-600">Party size</label>
                <select
                  id="search-party"
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value))}
                  className="w-full mt-1 rounded-lg border p-2"
                >
                  {Array.from({ length: MAX_PARTY_SIZE }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                {errors.party && <p className="text-xs text-red-600 mt-1">{errors.party}</p>}
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-blue-600 text-white p-2.5 hover:bg-blue-700 transition"
                >
                  Search availability
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Need something special? You can add requests during booking.
            </p>
          </form>
        </div>

        {/* Info card */}
        <aside className="p-4 md:p-5 bg-white rounded-2xl shadow-sm border">
          <h3 className="font-semibold">Restaurant information</h3>

          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <p className="text-slate-600">
                We accept bookings up to parties of <strong>{MAX_PARTY_SIZE}</strong>.
                Walk-ins welcome when space allows.
              </p>
            </div>

            <div className="col-span-2">
              <h4 className="font-medium mb-1">Opening hours</h4>
              <ul className="text-slate-600 space-y-0.5">
                {Object.entries(OPENING_HOURS).map(([day, hours]) => (
                  <li key={day} className="flex justify-between">
                    <span className="w-16">{day}</span>
                    <span className="ml-2">{hours}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-2">
              <h4 className="font-medium mb-1">Capacity</h4>
              <p className="text-slate-600">
                Most tables seat 2–4 guests; larger groups may be split across adjacent tables.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setShowPolicy(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              View cancellation policy
            </button>
          </div>
        </aside>
      </section>

      {/* Policy modal */}
      {showPolicy && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
          <div className="w-[90%] max-w-lg bg-white rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Cancellation policy</h4>
              <button onClick={() => setShowPolicy(false)} aria-label="Close" className="text-slate-500">✕</button>
            </div>
            <div className="mt-3 text-sm text-slate-700 space-y-2">
              <p>• Free cancellation up to 2 hours before your booking.</p>
              <p>• Within 2 hours, please call us as availability is dependent.</p>
              <p>• No-shows may affect future booking priority.</p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowPolicy(false)}
                className="rounded-lg border px-3 py-1.5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-10 border-t">
        <div className="max-w-5xl mx-auto px-4 py-6 text-xs text-slate-500">
          © {new Date().getFullYear()} The Hungry Unicorn. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

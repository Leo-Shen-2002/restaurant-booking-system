import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { searchAvailability } from "../services/api";
import UserMenu from "../components/UserMenu";

const MAX_PARTY_SIZE = 8;

const sessions = [
  { key: "all", label: "All" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
];

// simple session classifier
function sessionOf(timeStr) {
  // expects HH:MM:SS
  const [hh, mm] = timeStr.split(":").map(Number);
  const minutes = hh * 60 + mm;
  if (minutes < 16 * 60) return "lunch";   // < 16:00
  return "dinner";
}

export default function Availability() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const qpDate = searchParams.get("date") || "";
  const qpParty = parseInt(searchParams.get("partySize") || "2", 10);

  const [date, setDate] = useState(qpDate);
  const [partySize, setPartySize] = useState(qpParty);
  const [filter, setFilter] = useState("all");

  const [slots, setSlots] = useState([]);
  const [_meta, setMeta] = useState(null); // TODO later
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [firstLoad, setFirstLoad] = useState(true);

  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const canSearch = useMemo(() => {
    if (!date) return false;
    if (date < todayStr) return false;
    if (!partySize || partySize < 1 || partySize > MAX_PARTY_SIZE) return false;
    return true;
  }, [date, partySize, todayStr]);

  useEffect(() => {
    // keep URL in sync when user tweaks inputs
    setSearchParams({ date, partySize: String(partySize) }, { replace: !firstLoad });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, partySize]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!canSearch) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const data = await searchAvailability("TheHungryUnicorn", date, partySize);
        // data is array of { time, available, max_party_size, current_bookings }
        setSlots(Array.isArray(data) ? data : []);
        setMeta(null);
      } catch (err) {
        console.error("Error fetching availability", err);
        const status = err?.response?.status;
        if (status === 401) {
          setError("You need to log in to view availability.");
        } else {
          setError("We couldn’t load availability. Please try again.");
        }
      } finally {
        setLoading(false);
        setFirstLoad(false);
      }
    };

    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, partySize]);

  const filtered = useMemo(() => {
    if (filter === "all") return slots;
    return slots.filter(s => sessionOf(s.time) === filter);
  }, [slots, filter]);

  const onSelectSlot = (time) => {
    navigate(`/booking/new?date=${date}&time=${time}&partySize=${partySize}`);
  };

  const onPrevDay = () => {
    if (!date) return;
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    const v = d.toISOString().slice(0, 10);
    setDate(v);
  };
  const onNextDay = () => {
    if (!date) return;
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    const v = d.toISOString().slice(0, 10);
    setDate(v);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold hover:underline">
            ← The Hungry Unicorn
          </Link>
          <h2 className="mt-6 font-semibold" aria-label="Available time slots">
            Available time slots
          </h2>
          <UserMenu />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-sm border p-4 md:p-5">
          <div className="flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
              <div>
                <label className="text-sm text-slate-600">Date</label>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={onPrevDay}
                    className="px-2 rounded-lg border"
                    aria-label="Previous day"
                  >
                    ‹
                  </button>
                  <input
                    type="date"
                    min={todayStr}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="rounded-lg border p-2 w-full"
                  />
                  <button
                    onClick={onNextDay}
                    className="px-2 rounded-lg border"
                    aria-label="Next day"
                  >
                    ›
                  </button>
                </div>
                {date && date < todayStr && (
                  <p className="text-xs text-red-600 mt-1">Date can’t be in the past.</p>
                )}
              </div>

              <div>
                <label className="text-sm text-slate-600">Party size</label>
                <select
                  className="w-full mt-1 rounded-lg border p-2"
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value))}
                >
                  {Array.from({ length: MAX_PARTY_SIZE }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                {(partySize < 1 || partySize > MAX_PARTY_SIZE) && (
                  <p className="text-xs text-red-600 mt-1">
                    Party size must be 1–{MAX_PARTY_SIZE}.
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm text-slate-600">Session</label>
                <div className="flex gap-2 mt-1">
                  {sessions.map(s => (
                    <button
                      key={s.key}
                      onClick={() => setFilter(s.key)}
                      className={`px-3 py-2 rounded-lg border text-sm ${
                        filter === s.key ? "bg-blue-600 text-white border-blue-600" : "bg-white"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-sm text-slate-600">
              {date ? (
                <span>
                  Showing <strong>{filter}</strong> slots for <strong>{date}</strong> ·{" "}
                  party of <strong>{partySize}</strong>
                </span>
              ) : (
                <span>Select a date to see availability</span>
              )}
            </div>
          </div>
        </div>

        {/* Error / login prompt */}
        {error && (
          <div className="mt-4 p-3 rounded-lg border bg-rose-50 text-rose-700">
            {error}{" "}
            {error.includes("log in") && (
              <Link to="/auth" className="underline">Go to login</Link>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        )}

        {/* Slots grid */}
        {!loading && !error && (
          <>
            {filtered.length === 0 ? (
              <div className="mt-6 p-4 rounded-xl border bg-white text-slate-600">
                No availability found for the selected options. Try another time or reduce party size.
              </div>
            ) : (
              <div className="mt-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filtered.map((slot, idx) => {
                    const isAvailable = Boolean(slot.available) && partySize <= (slot.max_party_size || MAX_PARTY_SIZE);
                    const timeLabel = slot.time?.slice(0, 5) || slot.time;
                    const badge =
                      isAvailable ? "Available" :
                      partySize > (slot.max_party_size || MAX_PARTY_SIZE) ? "Too large" :
                      "Unavailable";

                    return (
                      <button
                        key={`${slot.time}-${idx}`}
                        disabled={!isAvailable}
                        onClick={() => onSelectSlot(slot.time)}
                        className={`h-12 rounded-xl border px-3 text-sm flex items-center justify-between transition
                          ${isAvailable ? "bg-white hover:bg-blue-50 border-blue-200" : "bg-slate-100 text-slate-400 cursor-not-allowed"}
                        `}
                        title={
                          isAvailable
                            ? `Book ${timeLabel}`
                            : badge
                        }
                      >
                        <span className="font-medium">{timeLabel}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border
                            ${isAvailable ? "border-green-600 text-green-700" : "border-slate-300"}
                          `}
                        >
                          {badge}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* capacity hint */}
                <p className="text-xs text-slate-500 mt-3">
                  Max party per slot: {MAX_PARTY_SIZE}. Booked seats vary by time; numbers are updated in real time.
                </p>

                {/* legend */}
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full bg-white border border-blue-200" /> Available
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full bg-slate-100 border" /> Unavailable / Full
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Back / change search */}
        <div className="mt-8 flex items-center justify-between">
          <Link to="/" className="text-sm text-slate-600 hover:underline">← Change restaurant or start over</Link>
          <Link to="/booking/lookup" className="text-sm text-blue-600 hover:underline">View a booking</Link>
        </div>
      </main>
    </div>
  );
}
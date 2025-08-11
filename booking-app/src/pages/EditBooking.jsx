import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getBookingByReference, updateBooking, searchAvailability } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import UserMenu from "../components/UserMenu";

const MAX_PARTY_SIZE = 8;

export default function EditBooking() {
  const { ref } = useParams();
  const navigate = useNavigate();
  const { isAuthed } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [booking, setBooking] = useState(null);

  // editable fields
  const [date, setDate] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [special, setSpecial] = useState("");
  const [selectedTime, setSelectedTime] = useState(""); // HH:MM:SS

  // availability state
  const [checking, setChecking] = useState(false);
  const [slots, setSlots] = useState([]);
  const [filter, setFilter] = useState("all");
  const [updateStatus, setUpdateStatus] = useState(null); // success | auth | error | invalid

  // load existing booking
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const data = await getBookingByReference("TheHungryUnicorn", ref);
        setBooking(data);
        setDate(String(data.visit_date));
        setPartySize(Number(data.party_size));
        setSpecial(data.special_requests || "");
        setSelectedTime(String(data.visit_time)); // may be "12:30:00"
      } catch (err) {
        console.error("Failed to load booking", err?.response?.data || err?.message);
        if (err?.response?.status === 401) setLoadError("You need to log in to edit a booking.");
        else if (err?.response?.status === 404) setLoadError("Booking not found.");
        else setLoadError("We couldn’t load your booking. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [ref]);

  const timeLabel = (t) => (t ? String(t).slice(0, 5) : "");

  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const disabled = booking?.status === "cancelled";

  const validate = () => {
    if (!date || date < todayStr) return { ok: false, msg: "Date must be today or later." };
    if (!partySize || partySize < 1 || partySize > MAX_PARTY_SIZE) return { ok: false, msg: `Party size must be 1–${MAX_PARTY_SIZE}.` };
    if (!selectedTime) return { ok: false, msg: "Please pick a time (check availability first)." };
    return { ok: true };
  };

  const sessionOf = (timeStr) => {
    const [hh, mm] = timeStr.split(":").map(Number);
    const mins = hh * 60 + mm;
    return mins < 16 * 60 ? "lunch" : "dinner";
  };

  const filteredSlots = useMemo(() => {
    if (!slots?.length) return [];
    if (filter === "all") return slots;
    return slots.filter((s) => sessionOf(s.time) === filter);
  }, [slots, filter]);

  const checkAvailabilityNow = async () => {
    if (!date) return;
    setChecking(true);
    setSlots([]);
    try {
      const data = await searchAvailability("TheHungryUnicorn", date, partySize);
      setSlots(Array.isArray(data) ? data : []);
      // if the currently selected time no longer exists, clear it
      const stillThere = (data || []).some((s) => s.time === selectedTime && s.available && partySize <= (s.max_party_size ?? MAX_PARTY_SIZE));
      if (!stillThere) setSelectedTime("");
    } catch (err) {
      console.error("Availability error", err?.response?.data || err?.message);
      setSlots([]);
    } finally {
      setChecking(false);
    }
  };

  const onSubmit = async () => {
    setUpdateStatus(null);
    // must be logged in
    if (!isAuthed) {
      const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/auth?returnTo=${returnTo}`);
      return;
    }
    // validate
    const v = validate();
    if (!v.ok) {
      setUpdateStatus({ kind: "invalid", msg: v.msg });
      return;
    }
    // just-in-time verify selected time is still available
    try {
      const fresh = await searchAvailability("TheHungryUnicorn", date, partySize);
      const match = (fresh || []).find((s) => s.time === selectedTime);
      if (!match || !match.available || partySize > (match.max_party_size ?? MAX_PARTY_SIZE)) {
        setUpdateStatus({ kind: "invalid", msg: "That time is no longer available. Please pick another." });
        return;
      }
    } catch {
      // if availability check fails, let user try again
      setUpdateStatus({ kind: "error", msg: "We couldn’t validate availability. Please try again." });
      return;
    }

    try {
      const payload = {
        VisitDate: date,
        VisitTime: selectedTime,
        PartySize: partySize,
        SpecialRequests: special,
      };
      await updateBooking("TheHungryUnicorn", ref, payload);
      setUpdateStatus({ kind: "success", msg: "Booking updated!" });
      setTimeout(() => navigate(`/booking/lookup?ref=${ref}`), 1200);
    } catch (err) {
      console.error("Update failed", err?.response?.data || err?.message);
      if (err?.response?.status === 401) setUpdateStatus({ kind: "auth", msg: "Your session expired. Please log in." });
      else if (err?.response?.status === 422) setUpdateStatus({ kind: "invalid", msg: "Some details were invalid." });
      else setUpdateStatus({ kind: "error", msg: "Something went wrong. Please try again." });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="w-80 h-32 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <p className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
          {loadError}{" "}
          {loadError.includes("log in") && (
            <Link className="underline" to={`/auth?returnTo=${encodeURIComponent(window.location.pathname)}`}>Login / Register</Link>
          )}
        </p>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold hover:underline">← The Hungry Unicorn</Link>
          <UserMenu />
          <Link to={`/booking/lookup?ref=${ref}`} className="text-blue-600 hover:underline text-sm">Back to booking</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 md:py-10">
        <h1 className="text-2xl font-bold">Edit your booking</h1>
        {disabled && (
          <p className="mt-2 p-3 rounded-lg border bg-amber-50 text-amber-700 text-sm">
            This booking is cancelled. Changes aren’t allowed.
          </p>
        )}

        {/* Current details */}
        <section className="mt-4 p-4 md:p-5 bg-white border rounded-2xl shadow-sm text-sm">
          <h2 className="font-semibold">Current details</h2>
          <div className="mt-2 grid sm:grid-cols-2 gap-3">
            <Info label="Reference" value={<span className="font-mono">{booking.booking_reference}</span>} />
            <Info label="Status" value={cap(booking.status || "confirmed")} />
            <Info label="Date" value={booking.visit_date} />
            <Info label="Time" value={timeLabel(booking.visit_time)} />
            <Info label="Party" value={booking.party_size} />
            <Info label="Name" value={`${booking.customer?.first_name || ""} ${booking.customer?.surname || ""}`} />
          </div>
        </section>

        {/* Edit form */}
        <section className="mt-6 grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 p-4 md:p-5 bg-white border rounded-2xl shadow-sm">
            <h2 className="font-semibold mb-3">Change your booking</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-600">Date</label>
                <input
                  type="date"
                  min={todayStr}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border p-2"
                  disabled={disabled}
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">Party size</label>
                <select
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border p-2"
                  disabled={disabled}
                >
                  {Array.from({ length: MAX_PARTY_SIZE }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-slate-600">Special requests</label>
                <textarea
                  value={special}
                  onChange={(e) => setSpecial(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border p-2"
                  placeholder="Allergies, accessibility needs, occasion…"
                  disabled={disabled}
                />
              </div>
            </div>

            {/* Check availability */}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Available times</h3>
                <div className="flex gap-2">
                  {["all", "lunch", "dinner"].map((k) => (
                    <button
                      key={k}
                      onClick={() => setFilter(k)}
                      className={`px-3 py-1.5 rounded-lg border text-sm ${
                        filter === k ? "bg-blue-600 text-white border-blue-600" : "bg-white"
                      }`}
                      disabled={disabled}
                    >
                      {cap(k)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-2">
                <button
                  onClick={checkAvailabilityNow}
                  className="rounded-lg bg-blue-600 text-white px-3 py-2 hover:bg-blue-700 disabled:opacity-60"
                  disabled={disabled || !date}
                >
                  {checking ? "Checking…" : "Check availability"}
                </button>
              </div>

              {/* Slots grid */}
              {checking && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-10 rounded-xl bg-slate-200 animate-pulse" />
                  ))}
                </div>
              )}

              {!checking && slots?.length > 0 && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredSlots.map((s, i) => {
                    const isAvailable = s.available && partySize <= (s.max_party_size ?? MAX_PARTY_SIZE);
                    const isSelected = selectedTime === s.time;
                    const label = timeLabel(s.time);
                    return (
                      <button
                        key={`${s.time}-${i}`}
                        disabled={!isAvailable || disabled}
                        onClick={() => setSelectedTime(s.time)}
                        className={`h-10 rounded-xl border px-3 text-sm flex items-center justify-between transition
                          ${isAvailable ? "bg-white hover:bg-blue-50 border-blue-200" : "bg-slate-100 text-slate-400 cursor-not-allowed"}
                          ${isSelected ? "ring-2 ring-blue-500" : ""}
                        `}
                        title={isAvailable ? `Select ${label}` : "Unavailable"}
                      >
                        <span className="font-medium">{label}</span>
                        {isSelected && <span className="text-xs">Selected</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {!checking && slots && slots.length === 0 && (
                <p className="text-sm text-slate-500 mt-2">No times loaded yet. Choose a date and “Check availability”.</p>
              )}
            </div>

            {/* Submit */}
            <div className="mt-5 flex items-center justify-end">
              <button
                onClick={onSubmit}
                disabled={disabled}
                className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-60"
              >
                Save changes
              </button>
            </div>

            {/* Messages */}
            {updateStatus?.kind === "success" && (
              <p className="mt-3 text-emerald-700">Booking updated! Redirecting…</p>
            )}
            {updateStatus?.kind === "auth" && (
              <p className="mt-3 text-rose-600">
                Your session expired.{" "}
                <Link
                  className="underline"
                  to={`/auth?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                >
                  Login / Register
                </Link>
              </p>
            )}
            {updateStatus?.kind === "invalid" && (
              <p className="mt-3 text-rose-600">{updateStatus.msg || "Some details were invalid."}</p>
            )}
            {updateStatus?.kind === "error" && (
              <p className="mt-3 text-rose-600">{updateStatus.msg || "Something went wrong. Please try again."}</p>
            )}
          </div>

          {/* Side info */}
          <aside className="p-4 md:p-5 bg-white border rounded-2xl shadow-sm text-sm text-slate-700">
            <h3 className="font-semibold">Tips</h3>
            <ul className="mt-2 space-y-2 list-disc list-inside">
              <li>Check a different time or reduce party size if no slots appear.</li>
              <li>Free cancellation up to 2 hours before your booking.</li>
            </ul>
          </aside>
        </section>
      </main>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border p-3 bg-white">
      <div className="text-slate-500">{label}</div>
      <div className="mt-1 font-medium text-slate-800">{value}</div>
    </div>
  );
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

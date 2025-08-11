import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getBookingByReference, cancelBooking } from "../services/api";
import UserMenu from "../components/UserMenu";

const CANCELLATION_REASONS = [
  { id: 1, label: "Customer Request" },
  { id: 2, label: "Restaurant Closure" },
  { id: 3, label: "Weather" },
  { id: 4, label: "Emergency" },
  { id: 5, label: "No Show" },
];

export default function BookingLookup() {
  const [searchParams, setSearchParams] = useSearchParams();
  // const navigate = useNavigate();

  const initialRef = searchParams.get("ref") || "";
  const [ref, setRef] = useState(initialRef);
  const [booking, setBooking] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // cancel modal state
  const [showCancel, setShowCancel] = useState(false);
  const [reasonId, setReasonId] = useState(1);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // keep URL in sync with the last searched ref
  useEffect(() => {
    if (initialRef) {
      setRef(initialRef);
      // auto-search if ref is in URL
      handleSearch(initialRef);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visitTimeLabel = useMemo(() => {
    if (!booking?.visit_time) return "";
    const t = String(booking.visit_time);
    return t.length >= 5 ? t.slice(0, 5) : t;
  }, [booking]);

  const handleSearch = async (overrideRef) => {
    const value = (overrideRef ?? ref).trim().toUpperCase();
    setBooking(null);
    setError("");
    if (!value) {
      setError("Please enter your booking reference.");
      return;
    }

    setLoading(true);
    try {
      const data = await getBookingByReference("TheHungryUnicorn", value);
      setBooking(data);
      setSearchParams({ ref: value }, { replace: true });
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 401) {
        setError("You need to log in to view bookings.");
      } else if (err?.response?.status === 404) {
        setError("Booking not found. Please check your reference.");
      } else {
        setError("We couldn’t load that booking. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const openCancel = () => {
    setCancelError("");
    setReasonId(1);
    setShowCancel(true);
  };

  const doCancel = async () => {
    if (!booking) return;
    setCancelSubmitting(true);
    setCancelError("");
    try {
      await cancelBooking("TheHungryUnicorn", booking.booking_reference, reasonId);
      // reflect in UI
      setBooking((b) => ({ ...b, status: "cancelled" }));
      setShowCancel(false);
    } catch (err) {
      console.error("Cancel error:", err?.response?.data || err?.message);
      if (err?.response?.status === 401) {
        setCancelError("Your session expired. Please log in and try again.");
      } else {
        setCancelError("Failed to cancel booking. Please try again.");
      }
    } finally {
      setCancelSubmitting(false);
    }
  };

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(ref);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold hover:underline">← The Hungry Unicorn</Link>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 md:py-10">
        <h1 className="text-2xl font-bold">Find your booking</h1>
        <p className="text-slate-600 mt-1 text-sm">
          Enter your booking reference (e.g. <code className="font-mono">ABC1234</code>).
        </p>

        <div className="mt-4 bg-white rounded-2xl border shadow-sm p-4 md:p-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              className="rounded-lg border p-2 flex-1"
              placeholder="Booking reference"
              value={ref}
              onChange={(e) => setRef(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              onClick={() => handleSearch()}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
            >
              Search
            </button>
          </div>

          {loading && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-lg border bg-rose-50 text-rose-700 text-sm">
              {error}{" "}
              {error.includes("log in") && (
                <Link
                  className="underline"
                  to={`/auth?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                >
                  Login / Register
                </Link>
              )}
            </div>
          )}

          {booking && (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border p-4 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">Booking details</h2>
                    <p className="text-slate-600 text-sm">
                      Reference:{" "}
                      <span className="font-mono">{booking.booking_reference}</span>{" "}
                      <button
                        onClick={copyRef}
                        className="text-blue-600 underline text-xs ml-1"
                        title="Copy reference"
                      >
                        Copy
                      </button>
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>

                <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
                  <Info label="Name" value={`${booking.customer?.first_name || ""} ${booking.customer?.surname || ""}`} />
                  <Info label="Email" value={booking.customer?.email || "—"} />
                  <Info label="Date" value={booking.visit_date} />
                  <Info label="Time" value={visitTimeLabel} />
                  <Info label="Party size" value={booking.party_size} />
                  <Info label="Special requests" value={booking.special_requests || "—"} />
                  {booking.cancellation_reason && (
                    <Info
                      label="Cancellation reason"
                      value={`${booking.cancellation_reason.reason} — ${booking.cancellation_reason.description || ""}`}
                    />
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={`/booking/edit/${booking.booking_reference}`}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      booking.status === "cancelled" ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                    onClick={(e) => booking.status === "cancelled" && e.preventDefault()}
                    title={booking.status === "cancelled" ? "Cancelled bookings cannot be edited" : "Edit booking"}
                  >
                    Edit booking
                  </Link>

                  {booking.status !== "cancelled" && (
                    <button
                      className="rounded-lg bg-red-600 text-white px-3 py-2 text-sm hover:bg-red-700"
                      onClick={openCancel}
                    >
                      Cancel booking
                    </button>
                  )}
                </div>
              </div>

              {/* Helpful info */}
              <div className="rounded-2xl border p-4 text-sm bg-white">
                <h3 className="font-medium">Good to know</h3>
                <ul className="mt-2 space-y-2 list-disc list-inside text-slate-700">
                  <li>Free cancellation up to 2 hours before your booking.</li>
                  <li>For changes close to your time, please call the restaurant.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Cancel modal */}
      {showCancel && booking && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
          <div className="w-[90%] max-w-md bg-white rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Cancel booking</h4>
              <button onClick={() => setShowCancel(false)} aria-label="Close" className="text-slate-500">✕</button>
            </div>

            <p className="text-sm text-slate-700 mt-2">
              Booking <span className="font-mono">{booking.booking_reference}</span> on{" "}
              <strong>{booking.visit_date}</strong> at <strong>{String(booking.visit_time).slice(0,5)}</strong>.
            </p>

            <label className="text-sm text-slate-600 block mt-4">Reason</label>
            <select
              className="w-full mt-1 rounded-lg border p-2"
              value={reasonId}
              onChange={(e) => setReasonId(Number(e.target.value))}
            >
              {CANCELLATION_REASONS.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>

            {cancelError && <p className="text-rose-600 text-sm mt-2">{cancelError}</p>}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button className="rounded-lg border px-3 py-1.5" onClick={() => setShowCancel(false)}>
                Keep booking
              </button>
              <button
                className="rounded-lg bg-red-600 text-white px-3 py-1.5 hover:bg-red-700 disabled:opacity-60"
                onClick={doCancel}
                disabled={cancelSubmitting}
              >
                {cancelSubmitting ? "Cancelling…" : "Confirm cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
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

function StatusBadge({ status }) {
  const s = String(status || "confirmed").toLowerCase();
  const map = {
    confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-slate-100 text-slate-600 border-slate-300",
    completed: "bg-blue-50 text-blue-700 border-blue-200",
  };
  const text = s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <span className={`text-xs px-2 py-1 rounded-full border ${map[s] || "bg-slate-100 text-slate-600 border-slate-300"}`}>
      {text}
    </span>
  );
}

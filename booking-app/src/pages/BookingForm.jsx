import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createBooking, searchAvailability  } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import UserMenu from "../components/UserMenu";

const MAX_PARTY_SIZE = 8;

export default function BookingForm() {
  const navigate = useNavigate();
  const { isAuthed, _userType } = useAuth(); //TODO to implement user types
  const [searchParams] = useSearchParams();
  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "";
  const initialParty = parseInt(searchParams.get("partySize") || "2", 10);

  // steps: 1 = details, 2 = review, 3 = result
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    partySize: isNaN(initialParty) ? 2 : initialParty,
    specialRequest: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null); // booking response

  // basic guards
  useEffect(() => {
    if (!date || !time) {
      // If we landed here without a selected slot, bounce back to availability
      navigate(`/availability`);
    }
  }, [date, time, navigate]);

  const timeLabel = useMemo(() => (time?.slice(0, 5) || time), [time]);

  // validators
  const validateDetails = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Please enter your first name.";
    if (!form.lastName.trim()) e.lastName = "Please enter your last name.";
    if (!form.email.trim()) e.email = "Please enter your email.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Please enter a valid email.";
    if (!form.mobile.trim()) e.mobile = "Please enter your mobile number.";
    if (!form.partySize || form.partySize < 1) e.partySize = "Party size must be at least 1.";
    else if (form.partySize > MAX_PARTY_SIZE) e.partySize = `Maximum party size is ${MAX_PARTY_SIZE}.`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "partySize" ? Number(value) : value }));
  };

  const goReview = () => {
    if (!validateDetails()) return;
    setStep(2);
  };

  const goBackToDetails = () => setStep(1);

  const ensureSlotStillAvailable = async () => {
    const slots = await searchAvailability("TheHungryUnicorn", date, form.partySize);
    const match = Array.isArray(slots) && slots.find(s => s.time === time);
    if (!match) {
      throw new Error("SLOT_NOT_FOUND"); // date/time no longer returned by API
    }
    const max = match.max_party_size ?? MAX_PARTY_SIZE;
    if (!match.available || form.partySize > max) {
      throw new Error("SLOT_NOT_AVAILABLE");
    }
    return true;
  };

  const submitBooking = async () => {
    setSubmitting(true);
    setStatus(null);
    setErrors({});
    try {
      if (!isAuthed) {
        const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
        navigate(`/auth?returnTo=${returnTo}`);
        return;
      }

      await ensureSlotStillAvailable();

      const payload = {
        VisitDate: date,
        VisitTime: time,
        PartySize: form.partySize,
        SpecialRequests: form.specialRequest,
        FirstName: form.firstName,
        Surname: form.lastName,
        Email: form.email,
        Mobile: form.mobile,
      };
      const res = await createBooking("TheHungryUnicorn", payload);
      setResult(res.data);
      setStatus("success");
      setStep(3);
    } catch (err) {
      console.error("Booking error:", err?.response?.data || err?.message);
      if (err?.message === "SLOT_NOT_FOUND") {
        setStatus("slotMissing");
      } else if (err?.message === "SLOT_NOT_AVAILABLE") {
        setStatus("slotUnavailable");
      } else if (err?.response?.status === 401) {
        setStatus("auth");
      } else if (err?.response?.status === 422) {
        setStatus("invalid");
      } else {
        setStatus("error");
      }
    } finally {
      setSubmitting(false);
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
        <ol className="flex items-center gap-2 text-sm">
          <li className={`px-2.5 py-1 rounded-full border ${step >= 1 ? "bg-blue-600 text-white border-blue-600" : ""}`}>1. Details</li>
          <li className={`px-2.5 py-1 rounded-full border ${step >= 2 ? "bg-blue-600 text-white border-blue-600" : ""}`}>2. Review</li>
          <li className={`px-2.5 py-1 rounded-full border ${step >= 3 ? "bg-blue-600 text-white border-blue-600" : ""}`}>3. Confirmation</li>
        </ol>

        <div className="mt-4 p-4 rounded-2xl border bg-white">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
            <div><span className="text-slate-500">Date:</span> <strong>{date}</strong></div>
            <div><span className="text-slate-500">Time:</span> <strong>{timeLabel}</strong></div>
            <div><span className="text-slate-500">Party:</span> <strong>{form.partySize}</strong></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">You can adjust party size below if needed.</p>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <section className="mt-6 grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 p-4 md:p-5 bg-white rounded-2xl border shadow-sm">
              <h2 className="font-semibold mb-3">Your details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="First name" name="firstName" value={form.firstName} onChange={onChange} error={errors.firstName} />
                <Field label="Last name" name="lastName" value={form.lastName} onChange={onChange} error={errors.lastName} />
                <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} error={errors.email} />
                <Field label="Mobile" name="mobile" value={form.mobile} onChange={onChange} error={errors.mobile} />
                <div>
                  <label htmlFor="partySize" className="text-sm text-slate-600">Party size</label>
                  <select
                    id="partySize"
                    name="partySize"
                    value={form.partySize}
                    onChange={onChange}
                    className="mt-1 w-full rounded-lg border p-2"
                  >
                    {Array.from({ length: MAX_PARTY_SIZE }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  {errors.partySize && <p className="text-xs text-red-600 mt-1">{errors.partySize}</p>}
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="specialRequest" className="text-sm text-slate-600">Special requests</label>
                  <textarea
                    id="specialRequest"
                    name="specialRequest"
                    rows={3}
                    placeholder="Allergies, accessibility needs, occasion…"
                    value={form.specialRequest}
                    onChange={onChange}
                    className="mt-1 w-full rounded-lg border p-2"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-3">
                <Link to={`/availability?date=${date}&partySize=${form.partySize}`} className="text-sm text-slate-600 hover:underline">
                  Change time
                </Link>
                <button onClick={goReview} className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700">
                  Review booking
                </button>
              </div>
            </div>

            <aside className="p-4 md:p-5 bg-white rounded-2xl border shadow-sm text-sm text-slate-700">
              <h3 className="font-semibold">Good to know</h3>
              <ul className="mt-2 space-y-2 list-disc list-inside">
                <li>Free cancellation up to 2 hours before your booking.</li>
                <li>Tables seat up to {MAX_PARTY_SIZE} guests.</li>
                <li>Please arrive on time; we may hold your table for 15 minutes.</li>
              </ul>
            </aside>
          </section>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <section className="mt-6 grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 p-4 md:p-5 bg-white rounded-2xl border shadow-sm">
              <h2 className="font-semibold mb-3">Review your booking</h2>
              <div className="divide-y">
                <Row label="Date" value={date} />
                <Row label="Time" value={timeLabel} />
                <Row label="Party" value={`${form.partySize}`} />
                <Row label="Name" value={`${form.firstName} ${form.lastName}`} />
                <Row label="Email" value={form.email} />
                <Row label="Mobile" value={form.mobile} />
                <Row label="Special requests" value={form.specialRequest || "—"} />
              </div>

              {/* Friendly status messages */}
              {status === "auth" && (
                <p className="mt-3 text-rose-600">
                  You need to be logged in to confirm.{" "}
                  <button
                    className="underline"
                    onClick={() => {
                      const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
                      navigate(`/auth?returnTo=${returnTo}`);
                    }}
                  >
                    Login / Register
                  </button>
                </p>
              )}
              {status === "slotMissing" && (
                <p className="mt-3 text-rose-600">
                  That time is no longer offered today.{" "}
                  <Link className="underline" to={`/availability?date=${date}&partySize=${form.partySize}`}>
                    Pick another time
                  </Link>.
                </p>
              )}
              {status === "slotUnavailable" && (
                <p className="mt-3 text-rose-600">
                  Sorry, that slot just filled up.{" "}
                  <Link className="underline" to={`/availability?date=${date}&partySize=${form.partySize}`}>
                    See other times
                  </Link>.
                </p>
              )}
              {status === "invalid" && (
                <p className="mt-3 text-rose-600">Some details were invalid. Please check your inputs.</p>
              )}
              {status === "error" && (
                <p className="mt-3 text-rose-600">Something went wrong. Please try again.</p>
              )}

              <div className="mt-5 flex items-center justify-between">
                <button onClick={goBackToDetails} className="rounded-lg border px-4 py-2">
                  Back
                </button>
                <button
                  onClick={submitBooking}
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? "Confirming…" : "Confirm booking"}
                </button>
              </div>
            </div>

            <aside className="p-4 md:p-5 bg-white rounded-2xl border shadow-sm text-sm text-slate-700">
              <h3 className="font-semibold">Cancellation policy</h3>
              <p className="mt-2">
                Free cancellation up to 2 hours before your booking. Within 2 hours, please call us to check availability.
              </p>
            </aside>
          </section>
        )}

        {/* Step 3 unchanged */}
        {step === 3 && (
          <section className="mt-6 p-5 bg-white rounded-2xl border shadow-sm">
            <h2 className="text-xl font-semibold">Booking confirmed 🎉</h2>
            <p className="text-slate-700 mt-2">Thanks, we’ve saved your reservation.</p>

            {result && (
              <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
                <Info title="Reference" value={<span className="font-mono">{result.booking_reference}</span>} />
                <Info title="When" value={`${result.visit_date} at ${String(result.visit_time).slice(0,5)}`} />
                <Info title="Party" value={result.party_size} />
                <Info title="Name" value={`${result.customer?.first_name} ${result.customer?.surname}`} />
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/booking/lookup" className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700">
                View / manage booking
              </Link>
              <Link to="/" className="rounded-lg border px-4 py-2">Back to home</Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Field({ label, name, id, error, ...rest }) {
  const controlId = id || `bf_${name}`;
  return (
    <div>
      <label htmlFor={controlId} className="text-sm text-slate-600">
        {label}
      </label>
      <input
        id={controlId}
        name={name}
        {...rest}
        className="mt-1 w-full rounded-lg border p-2"
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800 text-right">{value}</span>
    </div>
  );
}

function Info({ title, value }) {
  return (
    <div className="rounded-xl border p-3">
      <h4 className="font-medium">{title}</h4>
      <p className="mt-1">{value}</p>
    </div>
  );
}
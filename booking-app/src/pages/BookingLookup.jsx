import { useState } from "react";
import { getBookingByReference } from "../services/api";
import { cancelBooking } from "../services/api";
import { Link } from "react-router-dom";

export default function BookingLookup() {
  const [ref, setRef] = useState("");
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const handleSearch = async () => {
    setBooking(null);
    setError(null);
    setLoading(true);

    try {
      const data = await getBookingByReference("TheHungryUnicorn", ref);
      setBooking(data);
    } catch (err) {
      console.error(err);
      setError("Booking not found or invalid reference.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    try {
        await cancelBooking("TheHungryUnicorn", ref);
        setCancelled(true);
        setBooking({ ...booking, status: "Cancelled" }); // Update local UI
    } catch (err) {
        console.error("Cancel error:", err.response?.data || err.message);
        alert("Failed to cancel booking. Please try again.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">Find Your Booking</h2>
      <input
        type="text"
        placeholder="Enter booking reference"
        value={ref}
        onChange={(e) => setRef(e.target.value)}
        className="w-full border rounded p-2 mb-3"
      />
      <button
        onClick={handleSearch}
        className="bg-blue-600 text-white px-4 py-2 w-full rounded"
      >
        Search
      </button>

      {loading && <p className="mt-4 text-gray-500">Loading...</p>}
      {error && <p className="text-red-500 mt-4">{error}</p>}

      {booking && (
        <div className="mt-6 border rounded p-4 bg-gray-100">
          <h3 className="text-lg font-semibold mb-2">Booking Details</h3>
          <p><strong>Name:</strong> {booking.customer?.first_name} {booking.customer?.surname}</p>
          <p><strong>Email:</strong> {booking.customer?.email}</p>
          <p><strong>Date:</strong> {booking.visit_date}</p>
          <p><strong>Time:</strong> {booking.visit_time}</p>
          <p><strong>Party Size:</strong> {booking.party_size}</p>
          <p><strong>Special Requests:</strong> {booking.special_requests || "None"}</p>
          <p><strong>Status:</strong> {booking.status || "Confirmed"}</p>
          <Link
            to={`/booking/edit/${ref}`}
            className="mt-4 inline-block text-blue-600 underline"
            >
            Edit this booking
          </Link>
        </div>
      )}

      {booking && !cancelled && booking.status !== "Cancelled" && (
        <button
            onClick={handleCancel}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
        >
            Cancel Booking
        </button>
        )}

        {cancelled && (
        <p className="mt-4 text-green-600">Booking successfully cancelled.</p>
      )}
    </div>
  );
}
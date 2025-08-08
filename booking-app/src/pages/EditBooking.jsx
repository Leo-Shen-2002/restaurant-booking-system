import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBookingByReference, updateBooking } from "../services/api";

export default function EditBooking() {
  const { ref } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const data = await getBookingByReference("TheHungryUnicorn", ref);
        setFormData({
          VisitDate: data.visit_date,
          VisitTime: data.visit_time,
          PartySize: data.party_size,
          SpecialRequests: data.special_requests || "",
        });
      } catch (err) {
        console.error("Failed to load booking", err);
        setStatus("error");
      }
    };

    fetchBooking();
  }, [ref]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await updateBooking("TheHungryUnicorn", ref, formData);
      setStatus("success");
      setTimeout(() => navigate(`/booking/lookup`), 1500);
    } catch (err) {
      console.error("Update failed", err.response?.data || err.message);
      setStatus("error");
    }
  };

  if (!formData) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">Edit Your Booking</h2>
      <input
        name="VisitDate"
        type="date"
        value={formData.VisitDate}
        onChange={handleChange}
        className="w-full mb-2 border rounded p-2"
      />
      <input
        name="VisitTime"
        type="time"
        value={formData.VisitTime?.slice(0, 5)}
        onChange={handleChange}
        className="w-full mb-2 border rounded p-2"
      />
      <input
        name="PartySize"
        type="number"
        value={formData.PartySize}
        onChange={handleChange}
        className="w-full mb-2 border rounded p-2"
      />
      <textarea
        name="SpecialRequests"
        value={formData.SpecialRequests}
        onChange={handleChange}
        placeholder="Special requests"
        className="w-full mb-2 border rounded p-2"
      />

      <button onClick={handleSubmit} className="bg-blue-600 text-white w-full p-2 rounded">
        Update Booking
      </button>

      {status === "success" && <p className="mt-4 text-green-600">Booking updated!</p>}
      {status === "error" && <p className="mt-4 text-red-600">Something went wrong.</p>}
    </div>
  );
}
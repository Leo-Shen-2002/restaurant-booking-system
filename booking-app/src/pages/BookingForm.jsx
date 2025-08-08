import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { createBooking } from "../services/api";

export default function BookingForm() {
  const [searchParams] = useSearchParams();
  const date = searchParams.get("date");
  const time = searchParams.get("time");

const [formData, setFormData] = useState({
  firstName: "",
  lastName: "",
  email: "",
  partySize: 2,
  specialRequest: "",
  mobile: ""
});
const [status, setStatus] = useState(null);

const handleChange = (e) => {
setFormData({ ...formData, [e.target.name]: e.target.value });
};

const handleSubmit = async () => {
  try {
    const bookingData = {
      VisitDate: date,
      VisitTime: time,
      PartySize: formData.partySize,
      SpecialRequests: formData.specialRequest,
      FirstName: formData.firstName,
      Surname: formData.lastName,
      Email: formData.email,
      Mobile: formData.mobile
    };

    console.log("Sending booking:", bookingData);
    await createBooking("TheHungryUnicorn", bookingData);
    setStatus("success");
  } catch (err) {
    console.error("Booking error:", err.response?.data || err.message);
    setStatus("error");
  }
};

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">Book a Table</h2>
      <p>
        Booking for <strong>{date}</strong> at <strong>{time?.slice(0, 5)}</strong>
      </p>

      <div className="mt-4 space-y-3">
        <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" className="w-full p-2 border rounded"/>
        <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" className="w-full p-2 border rounded"/> 
        <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="w-full p-2 border rounded"/>
        <input name="mobile" value={formData.mobile} onChange={handleChange} placeholder="Mobile" className="w-full p-2 border rounded"/>
        <input name="partySize" value={formData.partySize} onChange={handleChange} type="number" min={1} className="w-full p-2 border rounded"/>
        <textarea name="specialRequest" value={formData.specialRequest} onChange={handleChange} placeholder="Special Request" className="w-full p-2 border rounded"/>
        <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 w-full rounded">
          Confirm Booking
        </button>
      </div>

      {status === "success" && <p className="text-green-600 mt-4">Booking confirmed!</p>}
      {status === "error" && <p className="text-red-600 mt-4">Something went wrong. Try again.</p>}
    </div>
  );
}
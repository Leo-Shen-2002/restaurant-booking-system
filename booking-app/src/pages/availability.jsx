import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchAvailability } from "../services/api";

export default function Availability() {
  const [searchParams] = useSearchParams();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const date = searchParams.get("date");
  const partySize = parseInt(searchParams.get("partySize") || "2", 10);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const data = await searchAvailability("TheHungryUnicorn", date, partySize);
        setSlots(data);
      } catch (err) {
        console.error("Error fetching availability", err);
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [date, partySize]);

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-red-600 text-center mt-10">{error}</div>;

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">Available Time Slots for {date}</h2>

      {slots.length === 0 ? (
        <p>No availability found.</p>
      ) : (
        <ul className="space-y-2">
          {slots.map((slot, index) => (
            <li
              key={index}
              className="border rounded p-2 flex justify-between items-center"
            >
              <span>{slot.time.slice(0, 5)}</span>
              <span className="text-sm text-gray-600">
                Max: {slot.max_party_size} / Booked: {slot.current_bookings}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

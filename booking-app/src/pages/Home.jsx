import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

export default function Home() {
  const [date, setDate] = useState("");
  const [partySize, setPartySize] = useState(2);
  const navigate = useNavigate();

  const handleSearch = async () => {
    navigate(`/availability?date=${date}&partySize=${partySize}`);
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Find a Table</h1>
      <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mb-2 w-full" />
      <input type="number" value={partySize} onChange={e => setPartySize(+e.target.value)} className="mb-2 w-full" />
      <button onClick={handleSearch} className="bg-blue-500 text-white px-4 py-2 w-full">
        Search Availability
      </button>
      <Link to="/booking/lookup" className="text-blue-600 underline">
        View your booking
      </Link> 
    </div>
  );
}

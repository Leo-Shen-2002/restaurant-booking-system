import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Availability from "./pages/availability";
import BookingForm from "./pages/BookingForm";
import BookingLookup from "./pages/BookingLookup";
import EditBooking from "./pages/EditBooking";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/availability" element={<Availability />} />
        <Route path="/booking/new" element={<BookingForm />} />
        <Route path="/booking/lookup" element={<BookingLookup />} />
        <Route path="/booking/edit/:ref" element={<EditBooking />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

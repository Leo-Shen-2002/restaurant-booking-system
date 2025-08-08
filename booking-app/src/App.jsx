import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Availability from "./pages/availability";
import BookingForm from "./pages/BookingForm";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/availability" element={<Availability />} />
        <Route path="/booking/new" element={<BookingForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

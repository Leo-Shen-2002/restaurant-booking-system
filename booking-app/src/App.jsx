import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Availability from "./pages/Availability";
import BookingForm from "./pages/BookingForm";
import BookingLookup from "./pages/BookingLookup";
import EditBooking from "./pages/EditBooking";
import AuthPage from "./pages/Auth";
import RequireAuth from "./components/RequireAuth";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/availability" element={<Availability />} />
        <Route path="/booking/new" element={<BookingForm />} />
        <Route path="/booking/lookup" element={<BookingLookup />} />
        <Route path="/booking/edit/:ref" element={<EditBooking />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Example protected route groups */}
        <Route element={<RequireAuth allow={["customer"]} />}>
          {/* add customer-only pages here */}
        </Route>

        <Route element={<RequireAuth allow={["restaurant"]} />}>
          <Route path="/restaurant/dashboard" element={<div className="p-6">Restaurant dashboard (TODO)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

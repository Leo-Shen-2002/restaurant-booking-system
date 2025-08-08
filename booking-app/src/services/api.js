import axios from "axios";

const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImFwcGVsbGErYXBpQHJlc2RpYXJ5LmNvbSIsIm5iZiI6MTc1NDQzMDgwNSwiZXhwIjoxNzU0NTE3MjA1LCJpYXQiOjE3NTQ0MzA4MDUsImlzcyI6IlNlbGYiLCJhdWQiOiJodHRwczovL2FwaS5yZXNkaWFyeS5jb20ifQ.g3yLsufdk8Fn2094SB3J3XW-KdBc0DY9a2Jiu_56ud8";

const API = axios.create({
  baseURL: "http://localhost:8547/api/ConsumerApi/v1", 
  headers: {
    Authorization: `Bearer ${AUTH_TOKEN}`
  }
});


// Availability search
export const searchAvailability = async (restaurantName, date, partySize) => {
  const body = new URLSearchParams();
  body.append("VisitDate", date);
  body.append("PartySize", partySize);
  body.append("ChannelCode", "ONLINE");

  const res = await API.post(`/Restaurant/${restaurantName}/AvailabilitySearch`, body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });

  return res.data.available_slots; 
};

// New Booking
export const createBooking = async (restaurantName, data) => {
  const body = new URLSearchParams();

  body.append("VisitDate", data.VisitDate);
  body.append("VisitTime", data.VisitTime);
  body.append("PartySize", data.PartySize);
  body.append("ChannelCode", "ONLINE");
  body.append("SpecialRequests", data.SpecialRequests);

  body.append("Customer[FirstName]", data.FirstName);
  body.append("Customer[Surname]", data.Surname);
  body.append("Customer[Email]", data.Email);
  body.append("Customer[Mobile]", data.Mobile);

  console.log("Posting data:", Object.fromEntries(body)); // ✅ Inspect before sending

  return API.post(`/Restaurant/${restaurantName}/BookingWithStripeToken`, body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    }
  });
};
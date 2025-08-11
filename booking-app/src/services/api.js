import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8547/api/ConsumerApi/v1";
const AUTH_BASE = (new URL(API_BASE)).origin;

export const API = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Attach Authorization header if token present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("rb_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 refresh logic
let isRefreshing = false;
let pending = [];

API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // queue while a refresh is in-flight
        return new Promise((resolve, reject) => pending.push({ resolve, reject }));
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const r = await axios.post(`${AUTH_BASE}/auth/refresh`, null, { withCredentials: true });
        const newAccess = r.data?.access_token;
        if (newAccess) {
          localStorage.setItem("rb_token", newAccess);
          // update header and retry original
          original.headers.Authorization = `Bearer ${newAccess}`;
          // flush queued
          pending.forEach(p => p.resolve(API(original)));
          pending = [];
          return API(original);
        }
      } catch (e) {
        pending.forEach(p => p.reject(e));
        pending = [];
        localStorage.removeItem("rb_token");
        localStorage.removeItem("rb_user_type");
        localStorage.removeItem("rb_email");
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// ---------- AUTH ENDPOINTS ----------
export const login = async ({ email, password, user_type }) => {
  const res = await axios.post(`${AUTH_BASE}/auth/login`, { email, password, user_type }, { withCredentials: true });
  // returns: { access_token, token_type, user_type }
  return res.data;
};

export const register = async ({ email, password, user_type, first_name, surname, name }) => {
  const payload = { email, password, user_type };
  if (user_type === "customer") {
    payload.first_name = first_name;
    payload.surname = surname;
  } else if (user_type === "restaurant") {
    payload.name = name;
  }
  const res = await axios.post(`${AUTH_BASE}/auth/register`, payload, { withCredentials: true });
  return res.data;
};



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

  console.log("Posting data:", Object.fromEntries(body)); 

  return API.post(`/Restaurant/${restaurantName}/BookingWithStripeToken`, body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    }
  });
};

//Get Booking
export const getBookingByReference = async (restaurantName, bookingRef) => {
  const res = await API.get(`/Restaurant/${restaurantName}/Booking/${bookingRef}`);
  return res.data;
};

//Cancel Booking 
export const cancelBooking = async (restaurantName, bookingRef,  cancellationReasonId = 1) => {
  const body = new URLSearchParams();
  body.append("micrositeName", restaurantName);
  body.append("bookingReference", bookingRef);
  body.append("cancellationReasonId", String(cancellationReasonId));

  return API.post(
    `/Restaurant/${restaurantName}/Booking/${bookingRef}/Cancel`,
    body,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
};

//Update Booking
export const updateBooking = async (restaurantName, bookingRef, data) => {
  const body = new URLSearchParams();
  body.append("VisitDate", data.VisitDate);
  body.append("VisitTime", data.VisitTime);
  body.append("PartySize", data.PartySize);
  body.append("SpecialRequests", data.SpecialRequests || "");

  return API.patch(
    `/Restaurant/${restaurantName}/Booking/${bookingRef}`,
    body,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
};
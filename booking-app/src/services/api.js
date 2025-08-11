import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8547/api/ConsumerApi/v1";
export const AUTH_BASE = new URL(API_BASE).origin;

export const API_V1 = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});
export const API_ROOT = axios.create({
  baseURL: AUTH_BASE,
  withCredentials: true,
});

const attachAuth = (config) => {
  const token = localStorage.getItem("rb_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
};
API_V1.interceptors.request.use(attachAuth);
API_ROOT.interceptors.request.use(attachAuth);



let isRefreshing = false;
let queue = [];

function setupRefreshInterceptor(client) {
  client.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config;
      const status = error?.response?.status;

      // If not 401 or already retried, just fail
      if (status !== 401 || original?._retry) {
        return Promise.reject(error);
      }

      // mark to avoid infinite loops
      original._retry = true;

      // If a refresh call is already in-flight, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject, original });
        });
      }

      isRefreshing = true;
      try {
        const r = await API_ROOT.post("/auth/refresh"); // refresh uses root client
        const newAccess = r.data?.access_token;
        if (!newAccess) throw new Error("No access token in refresh response");

        // save & update header
        localStorage.setItem("rb_token", newAccess);
        original.headers = { ...(original.headers || {}), Authorization: `Bearer ${newAccess}` };

        // flush queued requests
        queue.forEach(({ resolve, original: o }) => {
          o.headers = { ...(o.headers || {}), Authorization: `Bearer ${newAccess}` };
          resolve(client(o));
        });
        queue = [];

        // retry original
        return client(original);
      } catch (e) {
        // Propagate failure to queued requests
        queue.forEach(({ reject }) => reject(e));
        queue = [];

        // clear local session
        localStorage.removeItem("rb_token");
        localStorage.removeItem("rb_user_type");
        localStorage.removeItem("rb_email");
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
  );
}

// apply to both clients
setupRefreshInterceptor(API_V1);
setupRefreshInterceptor(API_ROOT);

 //AUTH (root-level)

export async function login({ email, password, user_type }) {
  const res = await API_ROOT.post("/auth/login", { email, password, user_type });
  return res.data; // { access_token, token_type, user_type }
}

export async function register({ email, password, user_type, first_name, surname, name }) {
  const payload = { email, password, user_type };
  if (user_type === "customer") {
    payload.first_name = first_name;
    payload.surname = surname;
  } else if (user_type === "restaurant") {
    payload.name = name;
  }
  const res = await API_ROOT.post("/auth/register", payload);
  return res.data;
}

export async function refresh() {
  const res = await API_ROOT.post("/auth/refresh");
  return res.data;
}

export async function authLogout() {
  await API_ROOT.post("/auth/logout"); // clears refresh cookie
}

export async function getAccountMe() {
  const res = await API_ROOT.get("/auth/me");
  return res.data;
}

 //Consumer API (v1)

export async function searchAvailability(restaurantName, date, partySize) {
  const body = new URLSearchParams();
  body.set("VisitDate", date);
  body.set("PartySize", String(partySize));
  body.set("ChannelCode", "ONLINE");

  const res = await API_V1.post(`/Restaurant/${restaurantName}/AvailabilitySearch`, body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return res.data.available_slots || res.data;
}

export async function createBooking(restaurantName, data) {
  const body = new URLSearchParams();
  body.set("VisitDate", data.VisitDate);
  body.set("VisitTime", data.VisitTime);
  body.set("PartySize", String(data.PartySize));
  body.set("ChannelCode", "ONLINE");
  if (data.SpecialRequests) body.set("SpecialRequests", data.SpecialRequests);

  if (data.FirstName) body.set("Customer[FirstName]", data.FirstName);
  if (data.Surname) body.set("Customer[Surname]", data.Surname);
  if (data.Email) body.set("Customer[Email]", data.Email);
  if (data.Mobile) body.set("Customer[Mobile]", data.Mobile);

  return API_V1.post(`/Restaurant/${restaurantName}/BookingWithStripeToken`, body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
}

export async function getBookingByReference(restaurantName, bookingRef) {
  const res = await API_V1.get(`/Restaurant/${restaurantName}/Booking/${bookingRef}`);
  return res.data;
}

export async function cancelBooking(restaurantName, bookingRef, cancellationReasonId = 1) {
  const body = new URLSearchParams();
  body.set("micrositeName", restaurantName);
  body.set("bookingReference", bookingRef);
  body.set("cancellationReasonId", String(cancellationReasonId));

  const res = await API_V1.post(
    `/Restaurant/${restaurantName}/Booking/${bookingRef}/Cancel`,
    body,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return res.data;
}

export async function updateBooking(restaurantName, bookingRef, data) {
  const body = new URLSearchParams();
  if (data.VisitDate) body.set("VisitDate", data.VisitDate);
  if (data.VisitTime) body.set("VisitTime", data.VisitTime);
  if (data.PartySize) body.set("PartySize", String(data.PartySize));
  if (data.SpecialRequests !== undefined) body.set("SpecialRequests", data.SpecialRequests || "");

  const res = await API_V1.patch(
    `/Restaurant/${restaurantName}/Booking/${bookingRef}`,
    body,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return res.data;
}
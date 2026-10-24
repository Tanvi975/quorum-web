import api from "./api";

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? {};
}

export async function getCalendarMonth(year, month) {
  const response = await api.get("/api/calendar/month", {
    params: { year, month },
  });
  const data = unwrap(response);
  return Array.isArray(data) ? data : data.events ?? [];
}

export async function getCalendarDate(date) {
  const response = await api.get("/api/calendar/date", {
    params: { date },
  });
  const data = unwrap(response);
  return Array.isArray(data) ? data : data.events ?? [];
}

export async function getUpcomingEvents(limit = 5) {
  const response = await api.get("/api/calendar/upcoming", {
    params: { limit },
  });
  const data = unwrap(response);
  return Array.isArray(data) ? data : data.events ?? [];
}

export async function getCalendarEvent(id) {
  const response = await api.get(
    `/api/calendar/${encodeURIComponent(id)}`
  );
  return unwrap(response);
}

export async function createCalendarEvent(eventData) {
  const response = await api.post("/api/calendar", eventData);
  return unwrap(response);
}

export async function updateCalendarEvent(id, eventData) {
  const response = await api.patch(
    `/api/calendar/${encodeURIComponent(id)}`,
    eventData
  );
  return unwrap(response);
}

export async function deleteCalendarEvent(id) {
  const response = await api.delete(
    `/api/calendar/${encodeURIComponent(id)}`
  );
  return unwrap(response);
}

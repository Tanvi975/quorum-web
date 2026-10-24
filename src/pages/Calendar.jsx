
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createMeeting } from "../services/meetingService";
import {
  FiHome,
  FiCalendar,
  FiBookmark,
  FiUsers,
  FiMessageCircle,
  FiGlobe,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiX,
  FiClock,
  FiTrash2,
  FiExternalLink,
} from "react-icons/fi";
import {
  getCalendarMonth,
  getUpcomingEvents,
  createCalendarEvent,
  deleteCalendarEvent,
} from "../services/calendarService";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_TITLE = 80;
const MAX_DESCRIPTION = 300;
const MAX_LINK = 500;

const emptyForm = {
  title: "",
  date: "",
  startTime: "10:00",
  endTime: "10:30",
  description: "",
  attendeeEmails: "",
};

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonth(date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatEventDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function mapApiEvent(event) {
  const start = new Date(event.startDate);
  const end = new Date(event.endDate || event.startDate);

  return {
    ...event,
    id: event.id || event._id,
    date: toDateKey(start),
    startTime: start.toTimeString().slice(0, 5),
    endTime: end.toTimeString().slice(0, 5),
    description: event.description || "",
    meetingLink: event.meetingLink || "",
  };
}

function Calendar() {
  const navigate = useNavigate();

  const todayKey = toDateKey(new Date());

  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [ upcomingEvents , setUpcomingEvents] = useState([]);
const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const [deletingEventId, setDeletingEventId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [form, setForm] = useState({
    ...emptyForm,
    date: todayKey,
  });
  const [formError, setFormError] = useState("");

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;

  async function loadCalendarEvents(targetYear, targetMonth) {
    setLoadingEvents(true);
    setCalendarError("");

    try {
      const result = await getCalendarMonth(targetYear, targetMonth);
      setEvents(Array.isArray(result) ? result.map(mapApiEvent) : []);
    } catch (error) {
      setCalendarError(
        error.response?.data?.message ||
          "Calendar events load nahi ho paaye. Please try again."
      );
    } finally {
      setLoadingEvents(false);
    }
  }
  async function loadUpcomingEvents() {
    setLoadingUpcoming(true);
  
    try {
      const result = await getUpcomingEvents(5);
      setUpcomingEvents(Array.isArray(result) ? result.map(mapApiEvent) : []);
    } catch (error) {
      console.error(
        "Upcoming events load failed:",
        error.response?.data || error.message
      );
    } finally {
      setLoadingUpcoming(false);
    }
  }
  useEffect(() => {
    loadCalendarEvents(year, month);
  }, [year, month]);
  
  useEffect(() => {
    loadUpcomingEvents();
  }, []);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells = [];

    for (let i = 0; i < mondayOffset; i++) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(toDateKey(new Date(year, month - 1, day)));
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [year, month]);

  const selectedEvents = useMemo(
    () =>
      events
        .filter((event) => event.date === selectedDate)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [events, selectedDate]
  );

  function changeMonth(offset) {
    setCurrentMonth(
      (previous) =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() + offset,
          1
        )
    );
  }

  function goToToday() {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(toDateKey(today));
  }

  function openCreateModal(date = selectedDate) {
    setForm({ ...emptyForm, date });
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    if (savingEvent) return;
    setShowModal(false);
    setFormError("");
  }

  function updateField(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setFormError("");
  }

  async function handleCreateEvent(e) {
    e.preventDefault();

    const title = form.title.trim();
    const description = form.description.trim();
    
    const attendeeEmails = [
      ...new Set(
        form.attendeeEmails
          .split(",")
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean)
      ),
    ];
    
    const invalidEmail = attendeeEmails.find(
      (email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );
    
    if (invalidEmail) {
      setFormError(`Please enter a valid email: ${invalidEmail}`);
      return;
    }

    if (!title) {
      setFormError("Please enter an event title.");
      return;
    }

    if (title.length > MAX_TITLE) {
      setFormError(`Title must be ${MAX_TITLE} characters or fewer.`);
      return;
    }

    if (!form.date) {
      setFormError("Please select a date.");
      return;
    }

    if (form.date < todayKey) {
      setFormError("Please select today or a future date.");
      return;
    }

    if (!form.startTime || !form.endTime) {
      setFormError("Please select both start and end times.");
      return;
    }

    if (form.endTime <= form.startTime) {
      setFormError("End time must be later than start time.");
      return;
    }

    if (description.length > MAX_DESCRIPTION) {
      setFormError(
        `Description must be ${MAX_DESCRIPTION} characters or fewer.`
      );
      return;
    }

    if (!Array.isArray(attendeeEmails)) {
      setFormError("Please enter valid attendee emails.");
      return;
    }
    const startDate = new Date(`${form.date}T${form.startTime}:00`);
    const endDate = new Date(`${form.date}T${form.endTime}:00`);

    setSavingEvent(true);
    setFormError("");

    try {
const meeting = await createMeeting();

if (!meeting?.code || !meeting?.link) {
  throw new Error("Meeting API did not return a valid meeting link.");
}
await createCalendarEvent({
  title,
  description,
  eventType: "MEETING",
  startDate: startDate.toISOString(),
  endDate: endDate.toISOString(),
  isAllDay: false,
  meetingLink: meeting.link,
  attendeeEmails,
  hasReminder: true,
  reminderMinutes: 15,
});

      setSelectedDate(form.date);

      const [eventYear, eventMonth] = form.date.split("-").map(Number);
      setCurrentMonth(new Date(eventYear, eventMonth - 1, 1));

      setShowModal(false);

await Promise.all([
  loadCalendarEvents(eventYear, eventMonth),
  loadUpcomingEvents(),
]);
    } catch (error) {
      setFormError(
        error.response?.data?.message ||
          error.message ||
          "Event save nahi hua. Please try again."
      );
    } finally {
      setSavingEvent(false);
    }
  }

  async function deleteEvent(eventId) {
    if (!eventId) return;

    setDeletingEventId(eventId);
    setCalendarError("");

    try {
      await deleteCalendarEvent(eventId);
      await loadUpcomingEvents();
      setEvents((previous) =>
        previous.filter(
          (event) => String(event.id) !== String(eventId)
        )
      );
    } catch (error) {
      setCalendarError(
        error.response?.data?.message ||
          "Event delete nahi ho paaya. Please try again."
      );
    } finally {
      setDeletingEventId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#062C5F] text-[#1E293B]">
      <header className="flex h-16 items-center justify-between border-b border-[#E5E7EB] bg-white px-5 sm:px-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-lg font-bold tracking-wide text-[#062C5F]"
        >
          QUORUM
        </button>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-[#64748B] sm:inline">
            Calendar
          </span>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0068FF] text-sm font-semibold text-white"
            aria-label="User profile"
          >
            Q
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-64px)]">
        <aside className="hidden w-[76px] shrink-0 border-r border-white/10 bg-[#062C5F] py-6 md:block lg:w-[220px]">
          <nav className="flex flex-col gap-2 px-2 lg:px-3">
            {[
              { label: "Home", icon: FiHome, path: "/dashboard" },
              { label: "Calendar", icon: FiCalendar, path: "/calendar" },
              { label: "Saved Items", icon: FiBookmark, path: "/saved-items" },
              { label: "Organizations", icon: FiUsers, path: "/organization" },
              { label: "Chat", icon: FiMessageCircle, path: "/chat" },
              { label: "Communities", icon: FiGlobe, path: "/communities" },
            ].map(({ label, icon: Icon, path }) => (
              <button
                key={label}
                title={label}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 transition lg:flex-row lg:justify-start lg:gap-3 lg:px-3 ${
                  label === "Calendar"
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="text-[11px] lg:text-sm">{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                  Workspace
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-white">
                  Calendar
                </h1>
                <p className="mt-1 text-sm text-blue-100/70">
                  Plan meetings and keep track of your schedule.
                </p>
              </div>

              <button
                onClick={() => openCreateModal()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0068FF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#005BE0] focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <FiPlus className="h-4 w-4" />
                Create event
              </button>
            </div>

            {calendarError && (
              <div
                role="alert"
                className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                <span>{calendarError}</span>
                <button
                  onClick={() => loadCalendarEvents(year, month)}
                  className="font-semibold underline"
                >
                  Retry
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
              <section className="min-w-0 rounded-xl border border-white/20 bg-white/95 p-4 shadow-[0_12px_35px_rgba(0,0,0,0.15)] sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-[#062C5F]">
                      {formatMonth(currentMonth)}
                    </h2>
                    <p className="mt-1 text-xs text-[#64748B]">
                      Select a date to view its events.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={goToToday}
                      className="rounded-lg border border-[#D9E2EF] px-3 py-2 text-xs font-medium text-[#334155] hover:bg-[#F1F5F9]"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => changeMonth(-1)}
                      aria-label="Previous month"
                      className="rounded-lg border border-[#D9E2EF] p-2 text-[#334155] hover:bg-[#F1F5F9]"
                    >
                      <FiChevronLeft />
                    </button>
                    <button
                      onClick={() => changeMonth(1)}
                      aria-label="Next month"
                      className="rounded-lg border border-[#D9E2EF] p-2 text-[#334155] hover:bg-[#F1F5F9]"
                    >
                      <FiChevronRight />
                    </button>
                  </div>
                </div>

                {loadingEvents && (
                  <p className="mb-3 text-sm text-[#64748B]" role="status">
                    Loading calendar events...
                  </p>
                )}

                <div className="grid grid-cols-7 border-b border-[#E2E8F0] pb-2">
                  {WEEKDAYS.map((day) => (
                    <div
                      key={day}
                      className="py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-[#64748B] sm:text-xs"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1.5 pt-2 sm:gap-2">
                  {calendarDays.map((dateKey, index) => {
                    if (!dateKey) {
                      return (
                        <div
                          key={`empty-${index}`}
                          className="min-h-[64px] rounded-lg bg-[#F8FAFC] sm:min-h-[94px]"
                        />
                      );
                    }

                    const dayNumber = Number(dateKey.slice(-2));
                    const dayEvents = events.filter(
                      (event) => event.date === dateKey
                    );
                    const isSelected = dateKey === selectedDate;
                    const isToday = dateKey === todayKey;

                    return (
                      <button
                        key={dateKey}
                        onClick={() => setSelectedDate(dateKey)}
                        aria-label={`${dateKey}, ${dayEvents.length} events`}
                        aria-pressed={isSelected}
                        className={`relative min-h-[64px] min-w-0 overflow-hidden rounded-lg border p-1.5 text-left transition sm:min-h-[94px] sm:p-2 ${
                          isSelected
                            ? "border-[#0068FF] bg-blue-50 ring-1 ring-[#0068FF]"
                            : "border-[#E2E8F0] bg-white hover:border-blue-300 hover:bg-[#F8FBFF]"
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                            isToday
                              ? "bg-[#0068FF] text-white"
                              : isSelected
                                ? "text-[#0068FF]"
                                : "text-[#334155]"
                          }`}
                        >
                          {dayNumber}
                        </span>

                        <div className="mt-1 space-y-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              title={event.title}
                              className="truncate rounded bg-[#DCEAFE] px-1 py-0.5 text-[9px] font-medium text-[#164A8A] sm:text-[10px]"
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <p className="text-[9px] text-[#64748B]">
                              +{dayEvents.length - 2} more
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] pt-4">
                  <p className="text-sm font-medium text-[#334155]">
                    Events on {formatEventDate(selectedDate)}
                  </p>
                  <button
                    onClick={() => openCreateModal(selectedDate)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0068FF] hover:text-[#0051C8]"
                  >
                    <FiPlus className="h-4 w-4" />
                    Add event
                  </button>
                </div>

                {selectedEvents.length === 0 ? (
                  <div className="mt-3 flex min-h-24 flex-col items-center justify-center rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 text-center">
                    <p className="text-sm font-medium text-[#475569]">
                      {loadingEvents ? "Loading events..." : "No events scheduled"}
                    </p>
                    <p className="mt-1 text-xs text-[#94A3B8]">
                      Create an event to add it to this date.
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    {selectedEvents.map((event) => (
                      <article
                        key={event.id}
                        className="flex min-w-0 items-start justify-between gap-3 rounded-lg border border-[#E2E8F0] bg-white p-3"
                      >
                        <div className="min-w-0">
                          <h3 className="break-words text-sm font-semibold text-[#062C5F]">
                            {event.title}
                          </h3>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-[#64748B]">
                            <FiClock className="shrink-0" />
                            {event.startTime} – {event.endTime}
                          </p>
                          {event.description && (
                            <p className="mt-2 whitespace-pre-wrap break-words text-xs text-[#475569]">
                              {event.description}
                            </p>
                          )}
                          {event.meetingLink && (
                            <a
                              href={event.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#0068FF] hover:underline"
                            >
                              Open meeting link <FiExternalLink />
                            </a>
                          )}
                        </div>

                        <button
                          onClick={() => deleteEvent(event.id)}
                          disabled={deletingEventId === event.id}
                          aria-label={`Delete ${event.title}`}
                          className="shrink-0 rounded-lg p-2 text-[#94A3B8] hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingEventId === event.id ? (
                            <span className="text-xs">...</span>
                          ) : (
                            <FiTrash2 className="h-4 w-4" />
                          )}
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <aside className="rounded-xl border border-white/20 bg-white/95 p-5 shadow-[0_12px_35px_rgba(0,0,0,0.15)]">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold text-[#062C5F]">
                    Upcoming events
                  </h2>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#0068FF]">
                    {upcomingEvents.length}
                  </span>
                </div>

                <p className="mt-1 text-xs text-[#64748B]">
                  Your next scheduled events in this month.
                </p>

                {loadingUpcoming ? (
  <div className="mt-5 py-8 text-center text-sm text-[#64748B]">
    Loading upcoming events...
  </div>
) : upcomingEvents.length === 0 ? (
                  <div className="mt-5 rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-8 text-center">
                    <FiCalendar className="mx-auto h-7 w-7 text-[#94A3B8]" />
                    <p className="mt-3 text-sm font-medium text-[#475569]">
                      {loadingEvents ? "Loading events..." : "Your calendar is empty"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#94A3B8]">
                      Create your first event to see it here.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {upcomingEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => {
                          setSelectedDate(event.date);
                          const [eventYear, eventMonth] = event.date
                            .split("-")
                            .map(Number);
                          setCurrentMonth(
                            new Date(eventYear, eventMonth - 1, 1)
                          );
                        }}
                        className="block w-full rounded-lg border border-[#E2E8F0] bg-white p-3 text-left transition hover:border-blue-300 hover:bg-[#F8FBFF]"
                      >
                        <p className="break-words text-sm font-semibold text-[#164A8A]">
                          {event.title}
                        </p>
                        <p className="mt-1 text-xs text-[#64748B]">
                          {formatEventDate(event.date)}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-[#64748B]">
                          <FiClock />
                          {event.startTime} – {event.endTime}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                <p className="mt-4 text-[11px] leading-5 text-[#94A3B8]">
                  Events are loaded from your calendar backend.
                </p>
              </aside>
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-event-title"
            className="my-auto w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2
                  id="create-event-title"
                  className="text-lg font-semibold text-[#062C5F]"
                >
                  Create event
                </h2>
                <p className="mt-1 text-sm text-[#64748B]">
                  Add the details for your event.
                </p>
              </div>
              <button
                onClick={closeModal}
                disabled={savingEvent}
                aria-label="Close create event"
                className="rounded-lg p-2 text-[#64748B] hover:bg-slate-100 disabled:opacity-50"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label
                  htmlFor="event-title"
                  className="mb-1.5 block text-sm font-medium text-[#334155]"
                >
                  Event title <span className="text-red-500">*</span>
                </label>
                <input
                  id="event-title"
                  autoFocus
                  required
                  maxLength={MAX_TITLE}
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="e.g. Weekly team meeting"
                  className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2.5 text-sm text-[#1E293B] outline-none placeholder:text-[#94A3B8] focus:border-[#0068FF] focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1 text-right text-xs text-[#94A3B8]">
                  {form.title.length}/{MAX_TITLE}
                </p>
              </div>

              <div>
                <label
                  htmlFor="event-date"
                  className="mb-1.5 block text-sm font-medium text-[#334155]"
                >
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="event-date"
                  type="date"
                  required
                  min={todayKey}
                  value={form.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2.5 text-sm outline-none focus:border-[#0068FF] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="event-start"
                    className="mb-1.5 block text-sm font-medium text-[#334155]"
                  >
                    Start time <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="event-start"
                    type="time"
                    required
                    value={form.startTime}
                    onChange={(e) => updateField("startTime", e.target.value)}
                    className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2.5 text-sm outline-none focus:border-[#0068FF] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="event-end"
                    className="mb-1.5 block text-sm font-medium text-[#334155]"
                  >
                    End time <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="event-end"
                    type="time"
                    required
                    value={form.endTime}
                    onChange={(e) => updateField("endTime", e.target.value)}
                    className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2.5 text-sm outline-none focus:border-[#0068FF] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="event-description"
                  className="mb-1.5 block text-sm font-medium text-[#334155]"
                >
                  Description <span className="text-xs text-[#94A3B8]">(optional)</span>
                </label>
                <textarea
                  id="event-description"
                  rows={3}
                  maxLength={MAX_DESCRIPTION}
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Add an agenda or a short note..."
                  className="w-full max-h-40 resize-y overflow-y-auto rounded-lg border border-[#CBD5E1] px-3 py-2.5 text-sm outline-none placeholder:text-[#94A3B8] focus:border-[#0068FF] focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1 text-right text-xs text-[#94A3B8]">
                  {form.description.length}/{MAX_DESCRIPTION}
                </p>
              </div>

              <div>
  <label
    htmlFor="attendee-emails"
    className="mb-1.5 block text-sm font-medium text-[#334155]"
  >
    Invite attendees
    <span className="text-xs text-[#94A3B8]"> (optional)</span>
  </label>

  <textarea
    id="attendee-emails"
    rows={2}
    value={form.attendeeEmails}
    onChange={(e) => updateField("attendeeEmails", e.target.value)}
    placeholder="person1@example.com, person2@example.com"
    className="w-full resize-y rounded-lg border border-[#CBD5E1] px-3 py-2.5 text-sm outline-none placeholder:text-[#94A3B8] focus:border-[#0068FF] focus:ring-2 focus:ring-blue-100"
  />

  <p className="mt-1 text-xs text-[#94A3B8]">
    Enter email addresses separated by commas.
  </p>
</div>

              {formError && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  {formError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={savingEvent}
                  className="rounded-lg border border-[#CBD5E1] px-4 py-2.5 text-sm font-medium text-[#475569] hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEvent}
                  className="rounded-lg bg-[#0068FF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005BE0] focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingEvent ? "Saving..." : "Create event"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Calendar;

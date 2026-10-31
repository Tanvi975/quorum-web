import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createScopedMeeting,
  cancelMeeting,
} from "../services/meetingService";
import {
  getOrganizations,
  getOrganizationTeams,
} from "../services/organizationService";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  FiArrowLeft,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiX,
  FiClock,
  FiTrash2,
  FiExternalLink,
  FiVideo,
} from "react-icons/fi";
import {
  getCalendarMonth,
  getUpcomingEvents,
  createCalendarEvent,
  deleteCalendarEvent,
} from "../services/calendarService";


const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const MAX_TITLE = 80;
const MAX_DESCRIPTION = 300;

const emptyForm = {
  title: "",
  date: "",
  startTime: "10:00",
  endTime: "10:30",
  description: "",
  attendeeEmails: "",
  scopeType: "PERSONAL",
  organizationId: "",
  teamId: "",
};
const GLASS = {
  background: "rgba(42, 79, 116, 0.92)",
  border: "1px solid rgba(255, 255, 255, 0.14)",
  boxShadow: "0 18px 45px rgba(2, 16, 38, 0.35)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
};

const PRIMARY_GRADIENT = { background: "linear-gradient(135deg, #0066FF, #0148B3)" };

const inputClass =
  "w-full rounded-xl border border-white/30 bg-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/50 focus:border-sky-300 focus:ring-2 focus:ring-sky-300/20";

const labelClass = "mb-1.5 block text-sm font-medium text-white/90";
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

function GlassPanel({ children, className = "" }) {
  return (
    <section
      className={`min-w-0 rounded-2xl p-4 sm:p-5 ${className}`}
      style={GLASS}
    >
      {children}
    </section>
  );
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
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ ...emptyForm, date: todayKey });
  const [organizations, setOrganizations] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);

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
          "Unable to load calendar events. Please try again."
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

  useEffect(() => {
    if (!showModal || form.scopeType === "PERSONAL") return;

    let active = true;
    setLoadingOrganizations(true);

    getOrganizations()
      .then((response) => {
        const payload = response?.data?.data ?? response?.data ?? response;
        const list = Array.isArray(payload)
          ? payload
          : payload?.organizations ?? [];
        if (active) setOrganizations(list);
      })
      .catch((error) => {
        if (active) {
          setFormError(
            error.response?.data?.message ||
              "Unable to load organizations. Please try again."
          );
        }
      })
      .finally(() => {
        if (active) setLoadingOrganizations(false);
      });

    return () => {
      active = false;
    };
  }, [showModal, form.scopeType]);

  useEffect(() => {
    if (!showModal || form.scopeType !== "TEAM" || !form.organizationId) {
      setTeams([]);
      return;
    }

    let active = true;
    setLoadingTeams(true);

    getOrganizationTeams(form.organizationId)
      .then((response) => {
        const payload = response?.data?.data ?? response?.data ?? response;
        const list = Array.isArray(payload) ? payload : payload?.teams ?? [];
        if (active) setTeams(list);
      })
      .catch((error) => {
        if (active) {
          setFormError(
            error.response?.data?.message ||
              "Unable to load teams. Please try again."
          );
        }
      })
      .finally(() => {
        if (active) setLoadingTeams(false);
      });

    return () => {
      active = false;
    };
  }, [showModal, form.scopeType, form.organizationId]);
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month, 0).getDate();
    const prevMonthDays = new Date(year, month - 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < mondayOffset; i++) {
      cells.push({
        key: `prev-${i}`,
        dateKey: null,
        day: prevMonthDays - mondayOffset + 1 + i,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = toDateKey(new Date(year, month - 1, day));
      cells.push({ key: dateKey, dateKey, day });
    }

    let nextDay = 1;
    while (cells.length % 7 !== 0) {
      cells.push({ key: `next-${nextDay}`, dateKey: null, day: nextDay });
      nextDay++;
    }

    return cells;
  }, [year, month]);

  const todayEvents = useMemo(
    () =>
      events
        .filter((event) => event.date === todayKey)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [events, todayKey]
  );

  const selectedEvents = useMemo(
    () =>
      events
        .filter((event) => event.date === selectedDate)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [events, selectedDate]
  );

  const selectedDateLabel = useMemo(() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, [selectedDate]);

  function changeMonth(offset) {
    setCurrentMonth(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() + offset, 1)
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

    const attendeeEmails =
      form.scopeType === "PERSONAL"
        ? [
            ...new Set(
              form.attendeeEmails
                .split(",")
                .map((email) => email.trim().toLowerCase())
                .filter(Boolean)
            ),
          ]
        : [];

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

    if (form.scopeType !== "PERSONAL" && !form.organizationId) {
      setFormError("Please select an organization.");
      return;
    }

    if (form.scopeType === "TEAM" && !form.teamId) {
      setFormError("Please select a team.");
      return;
    }

    const startDate = new Date(`${form.date}T${form.startTime}:00`);
    const endDate = new Date(`${form.date}T${form.endTime}:00`);

    if (startDate <= new Date()) {
      setFormError("Please select a future meeting start time.");
      return;
    }

    setSavingEvent(true);
    setFormError("");

    try {
      const meetingPayload = {
        title,
        scopeType: form.scopeType,
        scheduledStartTime: startDate.toISOString(),
        ...(form.scopeType !== "PERSONAL"
          ? { organizationId: form.organizationId }
          : {}),
        ...(form.scopeType === "TEAM" ? { teamId: form.teamId } : {}),
      };

      const meeting = await createScopedMeeting(meetingPayload);

      if (!meeting?.code || !meeting?.link) {
        throw new Error("Meeting API did not return a valid meeting link.");
      }

      if (form.scopeType === "PERSONAL") {
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
      }

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
          "Unable to create the meeting. Please try again."
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
      const targetEvent = events.find(
        (event) => String(event.id) === String(eventId)
      );
  
      if (!targetEvent) {
        throw new Error("Event not found.");
      }
  
      const meetingLink = targetEvent.meetingLink || "";
      const meetingCode =
        targetEvent.meetingCode ||
        meetingLink.match(/\/meet\/([^/?#]+)/i)?.[1];
  
      await deleteCalendarEvent(eventId);
      if (meetingCode) {
        await cancelMeeting(meetingCode);
      }
      await Promise.all([
        loadUpcomingEvents(),
        loadCalendarEvents(year, month),
      ]);
  
    } catch (error) {
      console.error("Delete event failed:", error);
  
      setCalendarError(
        error.response?.data?.message ||
          error.message ||
          "Unable to delete this event. Please try again."
      );
    } finally {
      setDeletingEventId(null);
    }
  }
  async function confirmDeleteEvent() {
    if (!eventToDelete) return;
  
    const eventId = eventToDelete.id;
  
    await deleteEvent(eventId);
  
    setEventToDelete(null);
  }
  function selectEventDate(event) {
    setSelectedDate(event.date);

    const [eventYear, eventMonth] = event.date.split("-").map(Number);

    setCurrentMonth(new Date(eventYear, eventMonth - 1, 1));
  }
  function openMeeting(event) {
    if (!event.meetingLink) {
      selectEventDate(event);
      return;
    }
  
    const meetingUrl = new URL(event.meetingLink, window.location.origin);
  
    const meetingCode =
      meetingUrl.searchParams.get("code") ||
      meetingUrl.pathname.match(/\/meet\/([^/?#]+)/i)?.[1];
  
    if (!meetingCode) {
      meetingUrl.searchParams.set("whiteboard", "1");
      window.open(meetingUrl.toString(), "_blank", "noopener,noreferrer");
      return;
    }
  
    const params = new URLSearchParams({
      code: meetingCode,
      whiteboard: "1",
    });
  
    const organizationId =
    event.organizationId ||
    event.organization?._id ||
    event.organization?.id;
  
  const teamId =
    event.teamId ||
    event.team?._id ||
    event.team?.id;
  
  if (organizationId) {
    params.set("organizationId", organizationId);
  }
  
  if (teamId) {
    params.set("teamId", teamId);
  }
  
  navigate(`/video-call?${params.toString()}`);
  }
  return (
    <div className="flex h-screen min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-[#062C5F]">

      <header className="relative z-20 flex h-16 min-h-16 shrink-0 items-center border-b border-white/15 bg-[#062C5F]/85 px-4 shadow-sm sm:px-6 lg:px-8">
  <button
    type="button"
    onClick={() => navigate("/dashboard")}
    aria-label="Back to dashboard"
    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
  >
    <FiArrowLeft size={18} />
  </button>

  <button
    type="button"
    onClick={() => navigate("/dashboard")}
    className="absolute left-1/2 -translate-x-1/2 font-sans text-xl font-extrabold tracking-[0.18em] text-white transition hover:text-blue-200 sm:text-2xl"
  >
    QUORUM
  </button>
</header>
      <main
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-5 sm:py-6 lg:px-8"
        style={{
          backgroundImage: `linear-gradient(
            to bottom,
            #062C5F 0%,
            #315A8A 50%,
            #7698C5 100%
          )`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundAttachment: "local",
        }}
      >
        <div className="mx-auto w-full max-w-[1400px]">
          <div
            className="mb-4 flex flex-col gap-3 rounded-2xl p-4 sm:mb-5 sm:flex-row sm:items-center sm:justify-between"
            style={GLASS}
          >
            <div className="min-w-0">
              <h1 className="text-base font-bold text-white sm:text-lg">
                Calendar
              </h1>
              <p className="mt-0.5 text-xs text-[#B6C6D9] sm:text-sm">
                Plan meetings and keep track of your team&apos;s schedule.
              </p>
              <p className="mt-1 text-[11px] text-[#9EB0BC]">
                Today: {todayEvents.length}{" "}
                {todayEvents.length === 1 ? "meeting" : "meetings"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => openCreateModal()}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white/70 sm:w-auto"
              style={PRIMARY_GRADIENT}
            >
              <FiPlus className="h-4 w-4" />
              Create event
            </button>
          </div>

          {calendarError && (
            <div
              role="alert"
              className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200/50 bg-red-500/20 px-4 py-3 text-sm text-white backdrop-blur-md sm:mb-5"
            >
              <span>{calendarError}</span>

              <button
                type="button"
                onClick={() => loadCalendarEvents(year, month)}
                className="font-semibold underline underline-offset-2"
              >
                Retry
              </button>
            </div>
          )}

          <div className="grid min-w-0 grid-cols-1 items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <GlassPanel className="sm:p-5 lg:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-white sm:text-base">
                  {formatMonth(currentMonth)}
                </h2>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={goToToday}
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                  >
                    Today
                  </button>

                  <button
                    type="button"
                    onClick={() => changeMonth(-1)}
                    aria-label="Previous month"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                  >
                    <FiChevronLeft className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => changeMonth(1)}
                    aria-label="Next month"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                  >
                    <FiChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {loadingEvents && (
                <p className="mb-3 text-xs text-[#9EB0BC]" role="status">
                  Loading calendar events...
                </p>
              )}
              <div className="grid grid-cols-7 gap-1 border-b border-white/15 pb-2 sm:gap-2">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="py-1 text-center text-[9px] font-bold tracking-wide text-[#EDEFF7] sm:text-[11px]"
                  >
                    <span className="sm:hidden">{day.charAt(0)}</span>
                    <span className="hidden sm:inline">{day}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 pt-3 sm:gap-2">
                {calendarDays.map((cell) => {
                  if (!cell.dateKey) {
                    return (
                      <div
                        key={cell.key}
                        aria-hidden="true"
                        className="min-h-[50px] rounded-lg border border-white/10 bg-[#7698C5]/35 p-1 text-[10px] font-semibold text-[#A9C1D9] sm:min-h-[84px] sm:p-2 sm:text-xs lg:min-h-[96px]"
                      >
                        {cell.day}
                      </div>
                    );
                  }

                  const dateKey = cell.dateKey;

                  const dayEvents = events
                    .filter((event) => event.date === dateKey)
                    .sort((a, b) => a.startTime.localeCompare(b.startTime));

                  const isSelected = dateKey === selectedDate;
                  const isToday = dateKey === todayKey;

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      onClick={() => setSelectedDate(dateKey)}
                      aria-label={`${dateKey}, ${dayEvents.length} events`}
                      aria-pressed={isSelected}
                      className={`relative min-h-[50px] min-w-0 overflow-hidden rounded-lg border pt-0 pb-1 px-0 text-left sm:pt-0 sm:pb-2 sm:px-0 text-[#294761]shadow-sm transition duration-150 sm:min-h-[84px] 1 lg:min-h-[96px] ${
                        isSelected
                          ? "border-[#0066FF] bg-[#B6C6D9] ring-2 ring-[#0066FF]/50"
                          : "border-white/60 bg-[#E2E8F0] hover:border-[#38BDF8] hover:bg-white"
                      }`}
                    >
     
<span
  className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-black sm:h-8 sm:w-8 sm:text-base ${
    isToday ? "bg-[#0066FF] text-white" : ""
  }`}
>
  {cell.day}
</span>

                      {dayEvents.length > 0 && (
                        <div className="mt-1.5 flex items-center gap-0.5 sm:hidden">
                          {dayEvents.slice(0, 3).map((event) => (
                            <span
                              key={event.id}
                              className="h-1.5 w-1.5 rounded-full bg-[#039464]"
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="text-[8px] font-bold text-[#496985]">
                              +
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-1 hidden space-y-1 sm:block">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            title={`${event.title} (${event.startTime})`}
                            className="truncate rounded border border-[#039464]/25 bg-[#039464]/15 px-1.5 py-1 text-[9px] font-semibold leading-tight text-[#039464]"
                          >
                            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#039464]" />
                            {event.title}
                          </div>
                        ))}

                        {dayEvents.length > 2 && (
                          <p className="truncate text-[9px] font-semibold text-[#334155]">
                            +{dayEvents.length - 2} more
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </GlassPanel>

            <aside className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-1">
              <GlassPanel>
                <h2 className="text-sm font-bold text-white">
                  {selectedDateLabel}
                </h2>
                <p className="mt-1 text-[11px] text-[#9EB0BC]">
                  Your schedule at a glance
                </p>

                <div className="mt-4 space-y-2.5">
                  {selectedEvents.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-6 text-center">
                      <FiCalendar className="mx-auto h-5 w-5 text-[#9EB0BC]" />
                      <p className="mt-2 text-xs font-semibold text-white">
                        No events scheduled
                      </p>
                      <p className="mt-1 text-[11px] text-[#9EB0BC]">
                        Make room for what matters.
                      </p>
                    </div>
                  ) : (
                    selectedEvents.map((event) => (
                      <div
                        key={event.id}
                        className="rounded-xl border border-white/15 bg-white/10 p-3"
                      >
                        <p className="flex items-center gap-1.5 text-[10px] text-[#B6C6D9]">
                          <FiClock className="shrink-0" />
                          {event.startTime} – {event.endTime}
                        </p>

                        <p className="mt-1 break-words text-sm font-semibold text-white">
                          {event.title}
                        </p>

                        {event.description && (
                          <p className="mt-1 line-clamp-2 break-words text-[11px] text-[#9EB0BC]">
                            {event.description}
                          </p>
                        )}

                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openMeeting(event)}
                            className="inline-flex min-h-8 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white transition hover:brightness-110"
                            style={PRIMARY_GRADIENT}
                          >
                            View event
                            {event.meetingLink && (
                              <FiExternalLink className="h-3 w-3" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setEventToDelete(event)}
                            disabled={
                              String(deletingEventId) === String(event.id)
                            }
                            aria-label={`Delete ${event.title}`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-red-200 transition hover:bg-red-500/25 disabled:opacity-50"
                          >
                            <FiTrash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => openCreateModal(selectedDate)}
                  className="mt-4 inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110"
                  style={PRIMARY_GRADIENT}
                >
                  <FiPlus className="h-3.5 w-3.5" />
                  Add event
                </button>
              </GlassPanel>

              <GlassPanel>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-white">Upcoming</h2>
                  <span className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-bold text-[#B6C6D9]">
                    {upcomingEvents.length}
                  </span>
                </div>

                {loadingUpcoming ? (
                  <p className="mt-3 text-xs text-[#9EB0BC]" role="status">
                    Loading upcoming events...
                  </p>
                ) : upcomingEvents.length === 0 ? (
                  <p className="mt-3 text-xs leading-5 text-[#9EB0BC]">
                    No upcoming events. Create your first event to see it here.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-1.5">
                    {upcomingEvents.map((event) => (
                      <li key={event.id}>
                        <button
                          type="button"
                          onClick={() => selectEventDate(event)}
                          className={`block w-full rounded-lg border px-3 py-2 text-left transition ${
                            event.date === selectedDate
                              ? "border-[#0066FF]/60 bg-[#0066FF]/20"
                              : "border-transparent hover:border-white/15 hover:bg-white/10"
                          }`}
                        >
                          <p className="break-words text-xs font-semibold text-white">
                            {event.title}
                          </p>
                          <p className="mt-0.5 text-[10px] text-[#9EB0BC]">
                            {formatEventDate(event.date)} · {event.startTime} –{" "}
                            {event.endTime}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </GlassPanel>
            </aside>
          </div>
        </div>
      </main>

      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#06152B]/65 p-3 backdrop-blur-md sm:p-5"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-event-title"
            className="my-auto w-full max-w-lg rounded-2xl border border-white/20 p-5 shadow-2xl sm:p-6"
            style={{
              background: "rgba(20, 48, 82, 0.96)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2
                  id="create-event-title"
                  className="text-lg font-semibold text-white"
                >
                  Create event
                </h2>

                <p className="mt-1 text-sm text-white/65">
                  Add the details for your event.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={savingEvent}
                aria-label="Close create event"
                className="rounded-lg border border-white/15 bg-white/10 p-2 text-white/80 transition hover:bg-white/20 disabled:opacity-50"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label htmlFor="event-title" className={labelClass}>
                  Event title <span className="text-red-300">*</span>
                </label>

                <input
                  id="event-title"
                  autoFocus
                  required
                  maxLength={MAX_TITLE}
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="e.g. Weekly team meeting"
                  className={inputClass}
                />

                <p className="mt-1 text-right text-xs text-white/50">
                  {form.title.length}/{MAX_TITLE}
                </p>
              </div>

              <div>
                <label htmlFor="meeting-scope" className={labelClass}>
                  Meeting scope <span className="text-red-300">*</span>
                </label>
                <select
                  id="meeting-scope"
                  value={form.scopeType}
                  onChange={(e) =>
                    setForm((previous) => ({
                      ...previous,
                      scopeType: e.target.value,
                      organizationId: "",
                      teamId: "",
                    }))
                  }
                  className={`${inputClass} [color-scheme:dark]`}
                  style={{ backgroundColor: "#1E3A5F", color: "#FFFFFF" }}
                >
                  <option value="PERSONAL" className="bg-[#1E3A5F] text-white">Personal</option>
                  <option value="ORGANIZATION" className="bg-[#1E3A5F] text-white">Organization</option>
                 <option value="TEAM" className="bg-[#1E3A5F] text-white">Team</option>
                </select>
              </div>

              {form.scopeType !== "PERSONAL" && (
                <div>
                  <label htmlFor="meeting-organization" className={labelClass}>
                    Organization <span className="text-red-300">*</span>
                  </label>
                  <select
                    id="meeting-organization"
                    required
                    value={form.organizationId}
                    disabled={loadingOrganizations}
                    onChange={(e) =>
                      setForm((previous) => ({
                        ...previous,
                        organizationId: e.target.value,
                        teamId: "",
                      }))
                    }
                    className={`${inputClass} [color-scheme:dark]`}
                  >
                    <option value="">
                      {loadingOrganizations ? "Loading organizations..." : "Select organization"}
                    </option>
                    {organizations.map((organization) => {
                      const id = organization.id || organization._id;
                      return (
                        <option key={id} value={id}>
                          {organization.name || organization.title || id}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {form.scopeType === "TEAM" && (
                <div>
                  <label htmlFor="meeting-team" className={labelClass}>
                    Team <span className="text-red-300">*</span>
                  </label>
                  <select
                    id="meeting-team"
                    required
                    value={form.teamId}
                    disabled={!form.organizationId || loadingTeams}
                    onChange={(e) => updateField("teamId", e.target.value)}
                    className={`${inputClass} [color-scheme:dark]`}
                  >
                    <option value="">
                      {!form.organizationId
                        ? "Select an organization first"
                        : loadingTeams
                          ? "Loading teams..."
                          : "Select team"}
                    </option>
                    {teams.map((team) => {
                      const id = team.id || team._id;
                      return (
                        <option key={id} value={id}>
                          {team.name || team.title || id}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="event-date" className={labelClass}>
                  Date <span className="text-red-300">*</span>
                </label>

                <input
                  id="event-date"
                  type="date"
                  required
                  min={todayKey}
                  value={form.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  className={`${inputClass} [color-scheme:dark]`}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="event-start" className={labelClass}>
                    Start time <span className="text-red-300">*</span>
                  </label>

                  <input
                    id="event-start"
                    type="time"
                    required
                    value={form.startTime}
                    onChange={(e) => updateField("startTime", e.target.value)}
                    className={`${inputClass} [color-scheme:dark]`}
                  />
                </div>

                <div>
                  <label htmlFor="event-end" className={labelClass}>
                    End time <span className="text-red-300">*</span>
                  </label>

                  <input
                    id="event-end"
                    type="time"
                    required
                    value={form.endTime}
                    onChange={(e) => updateField("endTime", e.target.value)}
                    className={`${inputClass} [color-scheme:dark]`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="event-description" className={labelClass}>
                  Description{" "}
                  <span className="text-xs text-white/50">(optional)</span>
                </label>

                <textarea
                  id="event-description"
                  rows={3}
                  maxLength={MAX_DESCRIPTION}
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Add an agenda or a short note..."
                  className={`${inputClass} max-h-40 resize-y`}
                />

                <p className="mt-1 text-right text-xs text-white/50">
                  {form.description.length}/{MAX_DESCRIPTION}
                </p>
              </div>

              {form.scopeType === "PERSONAL" && (
                <div>
                  <label htmlFor="attendee-emails" className={labelClass}>
                    Invite attendees{" "}
                    <span className="text-xs text-white/50">(optional)</span>
                  </label>

                  <textarea
                    id="attendee-emails"
                    rows={2}
                    value={form.attendeeEmails}
                    onChange={(e) =>
                      updateField("attendeeEmails", e.target.value)
                    }
                    placeholder="person1@example.com, person2@example.com"
                    className={`${inputClass} resize-y`}
                  />

                  <p className="mt-1 text-xs text-white/50">
                    Enter email addresses separated by commas.
                  </p>
                </div>
              )}

              {form.scopeType !== "PERSONAL" && (
                <div className="rounded-xl border border-sky-300/20 bg-sky-400/10 px-3 py-3 text-xs leading-5 text-sky-100">
                  All members in the selected {form.scopeType.toLowerCase()} will
                  automatically receive this meeting in their calendar and
                  notifications.
                </div>
              )}

              {formError && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-200/30 bg-red-500/15 px-3 py-2 text-sm text-red-100"
                >
                  {formError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={savingEvent}
                  className="rounded-lg border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingEvent}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0068FF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#005BE0] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiVideo className="h-4 w-4" />
                  {savingEvent ? "Saving..." : "Create event"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
       <ConfirmDialog
        open={Boolean(eventToDelete)}
        type="delete"
        title="Delete event?"
        message={
          eventToDelete
            ? `Are you sure you want to delete "${eventToDelete.title}"? This action cannot be undone.`
            : "Are you sure you want to delete this event?"
        }
        confirmText="Delete event"
        cancelText="Cancel"
        onConfirm={confirmDeleteEvent}
        onCancel={() => setEventToDelete(null)}
      />
    </div>
  );
}

export default Calendar;

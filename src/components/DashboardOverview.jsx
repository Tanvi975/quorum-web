import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiClock,
  FiArrowUpRight,
  FiChevronLeft,
  FiChevronRight,
  FiUsers,
  FiGlobe,
  FiPlus,
  FiMessageCircle,
  FiCpu,
  FiVideo,
  FiBookmark,
  FiArrowRight,
} from "react-icons/fi";

const cardStyle =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)]";

const mutedText = "text-sm text-slate-500";

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function DashboardOverview({
  upcomingEvents = [],
  upcomingLoading = false,
  upcomingError = "",
}) {
  const navigate = useNavigate();

  const [calendarDate, setCalendarDate] = useState(() => new Date());

  const today = new Date();
  const todayKey = getDateKey(today);

  const monthLabel = calendarDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    for (let i = 0; i < mondayOffset; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  }, [calendarDate]);

  const meetingDays = useMemo(() => {
    const days = new Set();

    upcomingEvents.forEach((event) => {
      if (event.startDate) {
        const date = new Date(event.startDate);

        if (!Number.isNaN(date.getTime())) {
          days.add(getDateKey(date));
        }
      }
    });

    return days;
  }, [upcomingEvents]);

  const changeMonth = (offset) => {
    setCalendarDate(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + offset,
          1
        )
    );
  };

  const formatMeetingDate = (dateString) => {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    });
  };

  return (
    <section className="mt-5 space-y-5">
      
      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-[1.55fr_1fr]">
        
        <div className={`${cardStyle} min-w-0 p-4 sm:p-5 lg:p-6`}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FiVideo size={19} />
                </span>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Upcoming Meetings
                  </h2>
                  <p className={`mt-1 text-xs ${mutedText}`}>
                    Stay ready for what's next
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/calendar")}
              className="flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-600 transition hover:text-slate-900"
            >
              View all <FiArrowUpRight size={15} />
            </button>
          </div>

          {upcomingLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-[76px] animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : upcomingError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-600">{upcomingError}</p>
              <button
                type="button"
                onClick={() => navigate("/calendar")}
                className="mt-3 text-sm font-medium text-blue-600 hover:text-slate-900"
              >
                Open Calendar
              </button>
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="flex min-h-[230px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <FiCalendar size={23} />
              </span>

              <h3 className="font-medium text-slate-900">
                Your schedule is clear
              </h3>

              <p className={`mt-2 max-w-xs text-xs leading-5 ${mutedText}`}>
                You don't have any upcoming meetings. Schedule one whenever
                you're ready.
              </p>

              <button
                type="button"
                onClick={() => navigate("/calendar")}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0068FF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#005BE0]"
              >
                <FiPlus size={16} /> Schedule a meeting
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.slice(0, 4).map((event, index) => (
                <div
                  key={event.id || event._id || `${event.title}-${index}`}
                  className="group flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-blue-300 hover:bg-blue-50 sm:flex-nowrap sm:gap-4"
                >
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
                    <span className="text-lg font-bold leading-5 text-slate-900">
                      {event.startDate &&
                      !Number.isNaN(new Date(event.startDate).getTime())
                        ? new Date(event.startDate).getDate()
                        : "—"}
                    </span>
                    <span className="mt-1 text-[9px] uppercase tracking-wider text-slate-7000">
                      {event.startDate &&
                      !Number.isNaN(new Date(event.startDate).getTime())
                        ? new Date(event.startDate).toLocaleDateString(
                            "en-IN",
                            { month: "short" }
                          )
                        : "Date"}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-slate-900">
                      {event.title || "Untitled meeting"}
                    </h3>

                    <p className={`mt-1 flex items-center gap-1.5 text-xs ${mutedText}`}>
                      <FiClock size={12} />
                      {formatMeetingDate(event.startDate)}
                    </p>
                  </div>

                  {event.meetingLink ? (
                    <a
                      href={event.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 rounded-lg bg-[#0068FF] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#005BE0]"
                    >
                      Join
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate("/calendar")}
                      className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-blue-700 transition hover:bg-slate-100"
                    >
                      Details
                    </button>
                  )}
                </div>
              ))}

              {upcomingEvents.length > 4 && (
                <button
                  type="button"
                  onClick={() => navigate("/calendar")}
                  className="w-full rounded-lg py-2 text-sm font-medium text-blue-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  See all {upcomingEvents.length} meetings
                  <FiArrowRight className="ml-1 inline" size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className={`${cardStyle} min-w-0 p-5 sm:p-6`}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FiCalendar size={19} />
              </span>
              <div>
                <h2 className="font-semibold text-slate-900">My Calendar</h2>
                <p className={`mt-1 text-xs ${mutedText}`}>
                  Your monthly overview
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/calendar")}
              className="text-xs font-semibold text-blue-600 hover:text-slate-900"
            >
              Open
            </button>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              {monthLabel}
            </h3>

            <div className="flex gap-1">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => changeMonth(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100"
              >
                <FiChevronLeft size={17} />
              </button>

              <button
                type="button"
                aria-label="Next month"
                onClick={() => changeMonth(1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100"
              >
                <FiChevronRight size={17} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
              <div
                key={`${day}-${index}`}
                className="py-2 text-[11px] font-semibold text-slate-400"
              >
                {day}
              </div>
            ))}

            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="h-9" />;
              }

              const dateKey = getDateKey(date);
              const isToday = dateKey === todayKey;
              const hasMeeting = meetingDays.has(dateKey);

              return (
                <button
                  key={dateKey}
                  type="button"
                  title={hasMeeting ? "Meeting scheduled" : dateKey}
                  onClick={() => navigate("/calendar")}
                  className={`relative flex h-8 items-center justify-center rounded-lg text-xs transition sm:h-9 ${
                    isToday
                      ? "bg-[#0068FF] font-bold text-white shadow-md shadow-blue-950/30"
                      : hasMeeting
                        ? "bg-blue-100 font-semibold text-blue-800 hover:bg-blue-200"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {date.getDate()}
                  {hasMeeting && (
                    <span
                      className={`absolute bottom-1 h-1 w-1 rounded-full ${
                        isToday ? "bg-white" : "bg-cyan-300"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-200 pt-4">
            <span className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="h-2 w-2 rounded-full bg-[#0068FF]" />
              Today
            </span>
            <span className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              Meeting scheduled
            </span>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Your Workspace
            </h2>
            <p className={`mt-1 text-sm ${mutedText}`}>
              Everything you need, all in one place
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          
          <button
            type="button"
            onClick={() => navigate("/organization")}
            className={`${cardStyle} group p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-blue-50`}
          >
            <div className="flex items-start justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-400/15 text-violet-200">
                <FiUsers size={23} />
              </span>
              <FiArrowUpRight
                className="text-slate-400 transition group-hover:text-slate-900"
                size={19}
              />
            </div>

            <h3 className="mt-5 font-semibold text-slate-900">
              Your Organizations
            </h3>
            <p className={`mt-2 text-sm leading-6 ${mutedText}`}>
              Manage your organization, workspace and team collaboration.
            </p>

            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 group-hover:text-slate-900">
              Explore organizations <FiArrowRight size={15} />
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/communities")}
            className={`${cardStyle} group p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-blue-50`}
          >
            <div className="flex items-start justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200">
                <FiGlobe size={23} />
              </span>
              <FiArrowUpRight
                className="text-slate-400 transition group-hover:text-slate-900"
                size={19}
              />
            </div>

            <h3 className="mt-5 font-semibold text-slate-900">
              Your Communities
            </h3>
            <p className={`mt-2 text-sm leading-6 ${mutedText}`}>
              Discover communities, join conversations and share ideas.
            </p>

            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 group-hover:text-slate-900">
              Explore communities <FiArrowRight size={15} />
            </span>
          </button>

          <div className={`${cardStyle} p-5`}>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-200">
                <FiPlus size={23} />
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">Quick Actions</h3>
                <p className={`mt-1 text-xs ${mutedText}`}>
                  Jump straight into your work
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={() => navigate("/calendar")}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-100"
              >
                <FiCalendar className="text-blue-600" size={17} />
                Schedule a meeting
                <FiArrowRight className="ml-auto text-slate-400" size={15} />
              </button>

              <button
                type="button"
                onClick={() => navigate("/chat")}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-100"
              >
                <FiMessageCircle className="text-blue-600" size={17} />
                Open team chat
                <FiArrowRight className="ml-auto text-slate-400" size={15} />
              </button>

              <button
                type="button"
                onClick={() => navigate("/ai-assistant")}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-100"
              >
                <FiCpu className="text-blue-600" size={17} />
                Open Quorum AI
                <FiArrowRight className="ml-auto text-slate-400" size={15} />
              </button>

              <button
                type="button"
                onClick={() => navigate("/saved-items")}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-100"
              >
                <FiBookmark className="text-blue-600" size={17} />
                Saved items
                <FiArrowRight className="ml-auto text-slate-400" size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-xs text-slate-600/50">
          Your workspace, connected.
        </p>
        <button
          type="button"
          onClick={() => navigate("/calendar")}
          className="text-xs font-medium text-blue-600 hover:text-slate-900"
        >
          View your schedule <FiArrowRight className="ml-1 inline" size={13} />
        </button>
      </div>
    </section>
  );
}

export default DashboardOverview;

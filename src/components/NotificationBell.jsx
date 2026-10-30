
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBell,
  FiCheck,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { notificationService } from "../services/notificationService";
import useChatSocket from "../hooks/useChatSocket";

function getNotificationTarget(notification) {
  const data = notification.data || {};

  switch (notification.type) {
    case "ORG_INVITE":
      return data.token
        ? `/invites/organization?token=${encodeURIComponent(data.token)}`
        : null;

        case "TEAM_INVITE":
  return data.organizationId && data.teamId
    ? `/organizations/${encodeURIComponent(data.organizationId)}?teamId=${encodeURIComponent(data.teamId)}`
    : null;
    case "COMMUNITY_POST_COMMENT":
      return data.communityId && data.postId
        ? `/communities/${data.communityId}/posts/${data.postId}${
            data.commentId ? `#comment-${data.commentId}` : ""
          }`
        : null;
        case "COMMUNITY_INVITE":
          return data.token
            ? `/communities/invites/${encodeURIComponent(data.token)}`
            : data.communityId
              ? `/communities/${data.communityId}`
              : null;     
    case "MEETING_SCHEDULED":
    case "MEETING_REMINDER":
    case "MEETING_UPDATED":
    case "MEETING_CANCELLED":
    case "MEETING_STARTED": {
      const meetingId = data.meetingId || data.meetingCode || data.code;

      return meetingId
        ? `/meetings/${encodeURIComponent(meetingId)}`
        : null;
    }

    case "DIRECT_MESSAGE":
      return data.conversationId
        ? `/messages/${data.conversationId}`
        : null;

    case "SYSTEM":
    default:
      return "/dashboard";
  }
}

function formatTime(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function NotificationBell() {
  const navigate = useNavigate();
  const { socket } = useChatSocket();
  const panelRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");

  async function loadUnreadCount() {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.data?.data?.unreadCount ?? 0);
    } catch {
    }
  }

  async function loadNotifications(nextPage = page, onlyUnread = unreadOnly) {
    setLoading(true);
    setError("");

    try {
      const response = await notificationService.getNotifications(
        nextPage,
        20,
        onlyUnread
      );

      const result = response.data?.data;
      setNotifications(result?.notifications ?? []);
      setPage(result?.pagination?.page ?? nextPage);
      setTotalPages(result?.pagination?.totalPages ?? 1);
      setUnreadCount(result?.unreadCount ?? unreadCount);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Notifications could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUnreadCount();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = () => {
      loadUnreadCount();

      if (isOpen) {
        loadNotifications(1, unreadOnly);
      }
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [socket, isOpen, unreadOnly]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function togglePanel() {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);

    if (nextOpen) {
      setPage(1);
      await loadNotifications(1, unreadOnly);
    }
  }

  async function handleFilterChange(onlyUnread) {
    setUnreadOnly(onlyUnread);
    setPage(1);
    await loadNotifications(1, onlyUnread);
  }

  async function handleMarkRead(notification) {
    if (notification.isRead) return;

    setActionId(notification.id);
    setError("");

    try {
      await notificationService.markAsRead(notification.id);

      setNotifications((items) =>
        items.map((item) =>
          item.id === notification.id
            ? { ...item, isRead: true }
            : item
        )
      );

      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not mark notification as read."
      );
    } finally {
      setActionId("");
    }
  }

  async function handleMarkAllRead() {
    setActionId("all");
    setError("");

    try {
      await notificationService.markAllAsRead();

      setNotifications((items) =>
        items.map((item) => ({ ...item, isRead: true }))
      );

      setUnreadCount(0);

      if (unreadOnly) {
        await loadNotifications(1, true);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not mark notifications as read."
      );
    } finally {
      setActionId("");
    }
  }

  async function handleDelete(notification) {
    setActionId(notification.id);
    setError("");

    try {
      await notificationService.deleteNotification(notification.id);

      setNotifications((items) =>
        items.filter((item) => item.id !== notification.id)
      );

      if (!notification.isRead) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not delete notification."
      );
    } finally {
      setActionId("");
    }
  }

  async function handleNotificationClick(notification) {
    if (!notification.isRead) {
      const success = await markReadBeforeNavigate(notification);
      if (!success) return;
    }

    setIsOpen(false);
    navigate(getNotificationTarget(notification) || "/dashboard");
  }

  async function markReadBeforeNavigate(notification) {
    setActionId(notification.id);
    setError("");

    try {
      await notificationService.markAsRead(notification.id);

      setNotifications((items) =>
        items.map((item) =>
          item.id === notification.id
            ? { ...item, isRead: true }
            : item
        )
      );

      setUnreadCount((count) => Math.max(0, count - 1));
      return true;
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not open this notification."
      );
      return false;
    } finally {
      setActionId("");
    }
  }

  return (
    <div className="relative" ref={panelRef}>

<button
  type="button"
  onClick={togglePanel}
  aria-label={`Notifications, ${unreadCount} unread`}
  aria-expanded={isOpen}
  className="relative flex h-10 w-10 items-center justify-center rounded-lg text-white transition hover:bg-white/10 hover:text-blue-200"
>
  <FiBell className="h-5 w-5 text-white" />

  {unreadCount > 0 && (
    <span className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-[#102A46] bg-red-500 px-1 text-[10px] font-extrabold leading-none text-white shadow-lg">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  )}
</button>


      {isOpen && (
        <section
          aria-label="Notifications"
className="fixed left-3 right-3 top-[76px] z-[60] mx-auto max-w-[390px] overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:mx-0 sm:w-[390px] sm:max-w-[min(92vw,390px)]">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-[#062C5F]">
                Notifications
              </h2>
              <p className="mt-0.5 text-xs text-[#64748B]">
                {unreadCount} unread
              </p>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close notifications"
              className="rounded-md p-1.5 text-[#64748B] hover:bg-slate-100"
            >
              <FiX />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] px-4 py-2">
            <select
              value={unreadOnly ? "unread" : "all"}
              onChange={(event) =>
                handleFilterChange(event.target.value === "unread")
              }
              aria-label="Filter notifications"
              className="rounded-md border border-[#E2E8F0] bg-white px-2 py-1.5 text-xs text-[#334155] outline-none focus:border-[#0068FF]"
            >
              <option value="all">All notifications</option>
              <option value="unread">Unread only</option>
            </select>

            <button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || actionId !== ""}
              className="text-xs font-medium text-[#0068FF] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-1">
                <FiCheck />
                Mark all as read
              </span>
            </button>
          </div>

          {error && (
            <p role="alert" className="px-4 py-2 text-xs text-red-600">
              {error}
            </p>
          )}

          <div className="max-h-[390px] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-[#64748B]">
                Loading notifications...
              </p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[#64748B]">
                No notifications found.
              </p>
            ) : (
              notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`border-b border-[#F1F5F9] px-4 py-3 ${
                    notification.isRead ? "bg-white" : "bg-blue-50/60"
                  }`}
                >
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    disabled={actionId === notification.id}
                    className="block w-full text-left disabled:opacity-60"
                  >
                    <div className="flex items-start gap-2">
                      {!notification.isRead && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#0068FF]" />
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-medium text-[#1E293B]">
                          {notification.title}
                        </p>
                        <p className="mt-1 break-words text-xs leading-5 text-[#64748B]">
                          {notification.body}
                        </p>
                        {notification.actor?.name && (
                          <p className="mt-1 text-xs text-[#64748B]">
                            {notification.actor.name}
                          </p>
                        )}
                        <p className="mt-1.5 text-[11px] text-[#94A3B8]">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>

                  <div className="mt-2 flex justify-end gap-3">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkRead(notification)}
                        disabled={actionId !== ""}
                        className="text-xs font-medium text-[#0068FF] hover:underline disabled:opacity-50"
                      >
                        Mark read
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(notification)}
                      disabled={actionId !== ""}
                      aria-label={`Delete ${notification.title}`}
                      className="inline-flex items-center gap-1 text-xs text-[#64748B] hover:text-red-600 disabled:opacity-50"
                    >
                      <FiTrash2 />
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[#E2E8F0] px-4 py-3">
            <button
              onClick={() => loadNotifications(page - 1, unreadOnly)}
              disabled={loading || page <= 1}
              className="rounded-md border border-[#E2E8F0] px-3 py-1.5 text-xs text-[#334155] hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-xs text-[#64748B]">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => loadNotifications(page + 1, unreadOnly)}
              disabled={loading || page >= totalPages}
              className="rounded-md border border-[#E2E8F0] px-3 py-1.5 text-xs text-[#334155] hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default NotificationBell;

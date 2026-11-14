
import { useMemo } from "react";
import {
  FaBuilding,
  FaCoffee,
  FaDesktop,
  FaShieldAlt,
  FaVideo,
  FaSyncAlt,
  FaSpinner,
  FaMapMarkerAlt,
} from "react-icons/fa";
import useVirtualOffice from "../../hooks/useVirtualOffice";

const statusStyles = {
  AVAILABLE: "bg-emerald-400",
  BUSY: "bg-red-400",
  AWAY: "bg-amber-400",
  BE_RIGHT_BACK: "bg-amber-400",
  DO_NOT_DISTURB: "bg-red-400",
  EMPTY: "bg-slate-500",
};

const statusLabels = {
  AVAILABLE: "Available",
  BUSY: "Busy",
  AWAY: "Away",
  BE_RIGHT_BACK: "On break",
  DO_NOT_DISTURB: "Do not disturb",
  EMPTY: "Empty",
};

const isDeskFree = (desk) =>
  desk.status === "EMPTY" || !desk.occupiedByUserId;

function getInitials(name) {
  return String(name || "M")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function MemberAvatar({ name, avatarUrl, status }) {
  return (
    <div className="relative h-9 w-9 shrink-0">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name || "Team member"}
          className="h-9 w-9 rounded-full border border-white/20 object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1D4770] text-xs font-semibold text-white">
          {getInitials(name)}
        </div>
      )}

      <span
        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#213F70] ${
          statusStyles[status] || "bg-slate-400"
        }`}
      />
    </div>
  );
}

function ZoneMember({ member }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
      <MemberAvatar
        name={member.name}
        avatarUrl={member.avatarUrl}
        status={member.presenceStatus}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          {member.name || "Team member"}
        </p>

        <p className="text-xs text-sky-100/65">
          {statusLabels[member.presenceStatus] || "Active"}
        </p>
      </div>
    </div>
  );
}

function ZoneCard({
  title,
  description,
  icon: Icon,
  members,
  actionLabel,
  onAction,
  disabled,
  accent,
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-white/15 bg-white/[0.07] p-4 shadow-lg shadow-[#102842]/10 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}
          >
            <Icon className="text-lg" />
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="mt-0.5 text-xs text-sky-100/60">
              {description}
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-full border border-white/10 bg-black/10 px-2 py-1 text-xs text-sky-100/80">
          {members.length}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {members.length > 0 ? (
          members.map((member) => (
            <ZoneMember key={member.userId} member={member} />
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-white/15 px-3 py-4 text-center text-xs text-sky-100/55">
            Nobody is here right now.
          </p>
        )}
      </div>

      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          disabled={disabled}
          className="mt-4 w-full rounded-xl border border-sky-300/25 bg-[#1B4B7A]/70 px-3 py-2.5 text-sm font-semibold text-sky-50 transition hover:bg-[#245D91] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {actionLabel}
        </button>
      )}
    </section>
  );
}

export default function VirtualOffice({
  teamId,
  teamName,
  socket,
  connected,
  enabled,
}) {
  const {
    floorState,
    loading,
    joining,
    error,
    socketError,
    actionLoading,
    refreshFloor,
    claimDesk,
    changeZone,
  } = useVirtualOffice({
    teamId,
    socket,
    connected,
    enabled,
  });

  const members = useMemo(
    () => Object.values(floorState?.members || {}),
    [floorState?.members]
  );

  const zoneMembers = useMemo(
    () => ({
      WAR_ROOM: members.filter(
        (member) => member.zoneId === "WAR_ROOM"
      ),
      COFFEE_LOUNGE: members.filter(
        (member) => member.zoneId === "COFFEE_LOUNGE"
      ),
      FOCUS_POD: members.filter(
        (member) => member.zoneId === "FOCUS_POD"
      ),
    }),
    [members]
  );

  const desks = floorState?.desks || [];
  const counts = floorState?.counts || {};
  const isLoading = loading || joining;

  if (isLoading && !floorState) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/5 text-sky-100">
        <FaSpinner className="animate-spin text-2xl text-sky-300" />
        <p className="text-sm">
          Connecting to your virtual office...
        </p>
      </div>
    );
  }

  if (!floorState && error) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-2xl border border-red-300/20 bg-red-400/5 p-6 text-center">
        <FaBuilding className="text-3xl text-red-200" />

        <h3 className="font-semibold text-white">
          Unable to load Virtual Office
        </h3>

        <p className="max-w-md text-sm text-sky-100/70">
          {error}
        </p>

        <button
          type="button"
          onClick={refreshFloor}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0148B3] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <FaSyncAlt />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3 text-white sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FaBuilding className="text-sky-300" />

            <h2 className="truncate text-lg font-bold sm:text-xl">
              Virtual Office
            </h2>
          </div>

          <p className="mt-1 text-xs text-sky-100/65 sm:text-sm">
            {teamName} · Your team's shared workspace
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${
              connected
                ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-200"
                : "border-red-300/25 bg-red-400/10 text-red-200"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-emerald-400" : "bg-red-400"
              }`}
            />

            {connected ? "Live" : "Reconnecting"}
          </span>

          <button
            type="button"
            onClick={refreshFloor}
            disabled={loading}
            aria-label="Refresh office"
            title="Refresh office"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-sky-100 transition hover:bg-white/10 disabled:opacity-50"
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {(error || socketError) && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100"
        >
          <span>{error || socketError}</span>

          <button
            type="button"
            onClick={refreshFloor}
            className="font-semibold underline underline-offset-2"
          >
            Refresh
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Active members",
            value: counts.totalActive ?? members.length,
          },
          {
            label: "Occupied desks",
            value: desks.filter((desk) => !isDeskFree(desk)).length,
          },
          {
            label: "In War Room",
            value: counts.warRoom ?? zoneMembers.WAR_ROOM.length,
          },
          {
            label: "Focus Pods",
            value: counts.focusPods ?? zoneMembers.FOCUS_POD.length,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-white/15 bg-white/[0.07] p-3"
          >
            <p className="text-xs text-sky-100/60">
              {item.label}
            </p>

            <p className="mt-1 text-xl font-bold text-white">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[1.35fr_1fr]">
        <section className="min-w-0 rounded-2xl border border-white/15 bg-white/[0.07] p-4 backdrop-blur-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="flex items-center gap-2 font-bold text-white">
                <FaDesktop className="text-sky-300" />
                Open Workspace
              </h3>

              <p className="mt-1 text-xs text-sky-100/60">
                Choose an available desk to join your team.
              </p>
            </div>

            <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1.5 text-xs text-sky-100">
              {desks.filter(isDeskFree).length} desks free
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {desks.map((desk) => {
              const occupied = !isDeskFree(desk);

              const member = members.find(
                (item) => item.userId === desk.occupiedByUserId
              );

              const memberName =
                desk.occupiedByUserName || member?.name || "Occupied";

              const memberAvatar =
                desk.occupiedByUserAvatar || member?.avatarUrl;

              return (
                <button
                  key={desk.deskId}
                  type="button"
                  onClick={() =>
                    !occupied && claimDesk(desk.deskId)
                  }
                  disabled={occupied || actionLoading || !connected}
                  className={`flex min-h-[132px] min-w-0 flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center transition ${
                    occupied
                      ? "cursor-default border-white/10 bg-[#102842]/45"
                      : "border-sky-300/25 bg-[#1B4B7A]/35 hover:border-sky-300/70 hover:bg-[#1B4B7A]/70"
                  }`}
                  aria-label={
                    occupied
                      ? `Desk ${desk.deskNumber}, occupied by ${memberName}`
                      : `Claim desk ${desk.deskNumber}`
                  }
                >
                  {occupied && member ? (
                    <MemberAvatar
                      name={memberName}
                      avatarUrl={memberAvatar}
                      status={member.presenceStatus || desk.status}
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sky-100">
                      <FaDesktop />
                    </div>
                  )}

                  <span className="text-xs font-semibold text-white">
                    Desk {desk.deskNumber}
                  </span>

                  <span className="max-w-full truncate text-[11px] text-sky-100/65">
                    {occupied
                      ? memberName
                      : "Available · Claim desk"}
                  </span>

                  <span className="flex items-center gap-1.5 text-[10px] text-sky-100/65">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        occupied
                          ? statusStyles[desk.status] || "bg-red-400"
                          : "bg-emerald-400"
                      }`}
                    />

                    {occupied
                      ? statusLabels[desk.status] || "Occupied"
                      : "Free"}
                  </span>
                </button>
              );
            })}
          </div>

          {desks.length === 0 && (
            <p className="mt-5 rounded-xl border border-dashed border-white/20 p-6 text-center text-sm text-sky-100/60">
              No desk information is available yet.
            </p>
          )}
        </section>

        <div className="grid min-w-0 content-start gap-4">
          <ZoneCard
            title="The War Room"
            description="Team meetings and huddles"
            icon={FaVideo}
            members={zoneMembers.WAR_ROOM}
            accent="bg-violet-400/15 text-violet-200"
            actionLabel={
                floorState?.activeMeetingCode
                ? "Meeting in progress"
                : "War Room available"
            }
            disabled
          />

          <ZoneCard
            title="Coffee Lounge"
            description="Take a break and recharge"
            icon={FaCoffee}
            members={zoneMembers.COFFEE_LOUNGE}
            accent="bg-amber-400/15 text-amber-200"
            actionLabel="Take a break"
            onAction={() => changeZone("COFFEE_LOUNGE")}
            disabled={actionLoading || !connected}
          />

          <ZoneCard
            title="Focus Pods"
            description="Quiet space for deep work"
            icon={FaShieldAlt}
            members={zoneMembers.FOCUS_POD}
            accent="bg-sky-400/15 text-sky-200"
            actionLabel="Enter Focus Pod"
            onAction={() => changeZone("FOCUS_POD")}
            disabled={actionLoading || !connected}
          />

          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-5 text-sky-100/60">
            <FaMapMarkerAlt className="mr-2 inline text-sky-300" />
            Your location and availability update automatically when teammates
            move between office zones.
          </div>
        </div>
      </div>
    </div>
  );
}

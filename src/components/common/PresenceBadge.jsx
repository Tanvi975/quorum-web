
import React from "react";

const STATUS_CONFIG = {
  AVAILABLE: { color: "#22C55E", label: "Available" },
  BUSY: { color: "#EF4444", label: "Busy" },
  DO_NOT_DISTURB: { color: "#DC2626", label: "Do Not Disturb" },
  BE_RIGHT_BACK: { color: "#F59E0B", label: "Be Right Back" },
  AWAY: { color: "#F59E0B", label: "Away" },
  OFFLINE: { color: "#6B7280", label: "Offline" },
};

export default function PresenceBadge({
  status = "OFFLINE",
  size = 12,
  className = "",
}) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.OFFLINE;

  return (
    <span
      title={config.label}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 border-[#172A40] ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        backgroundColor: config.color,
      }}
    >
      {status === "DO_NOT_DISTURB" && (
        <span className="h-[2px] w-[60%] rounded-full bg-white" />
      )}
    </span>
  );
}

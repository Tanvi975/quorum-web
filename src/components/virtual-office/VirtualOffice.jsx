import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import useVirtualOffice from "../../hooks/useVirtualOffice";
import { useAuth } from "../../context/AuthContext";

const GRID = 10;
const WALL_UNITS = 1.5;
const DESK_HEIGHT = 0.28;

const WAR_RECT    = { l: 0.3, t: 0.3, r: 4.7, b: 4.7 };
const COFFEE_RECT = { l: 5.3, t: 0.3, r: 9.7, b: 4.7 };
const FOCUS_RECT  = { l: 0.3, t: 5.3, r: 4.7, b: 9.7 };
const OPEN_RECT   = { l: 5.3, t: 5.3, r: 9.7, b: 9.7 };

const WAR_SLOTS = [
  [1.0, 2.4], [2.0, 1.2], [3.4, 1.2], [4.1, 2.4],
  [3.5, 3.7], [2.2, 3.8], [1.0, 3.5],
];
const COFFEE_SLOTS = [
  [6.3, 1.7], [8.5, 1.7], [6.3, 3.5],
  [8.5, 3.6], [7.5, 4.2], [7.5, 1.1],
];
const POD_CENTERS = [
  [1.5, 6.6], [3.5, 6.6], [1.5, 8.6], [3.5, 8.6],
];

const C = {
  floorA: "#414E75", floorB: "#2C3659",
  slabL:  "#1B2440", slabR:  "#111729",
  gridLine: "rgba(255,255,255,0.078)",
  floorEdge: "rgba(255,255,255,0.22)",
  wallA:  "rgba(35,44,77,0.5)", wallB:  "rgba(107,127,181,0.302)",
  wallEdge: "rgba(255,255,255,0.4)",
  window: "rgba(96,165,250,0.2)",
  warPadDefault: "rgba(79,123,217,0.25)",
  warPadLive:    "rgba(34,197,94,0.28)",
  coffeePad: "rgba(251,191,36,0.22)",
  focusPad:  "rgba(139,92,246,0.22)",
  openPad:   "rgba(20,184,166,0.196)",
  ellipseShadow: "rgba(255,255,255,0.122)",
  minePadStroke: "rgba(167,139,250,0.9)",
  deskRug: "rgba(167,139,250,0.333)",
  chair:   "#334155",
  deskTop: "#C8B08A",
  monitor: "#0F172A",
  tableRoom: "#9DB0D6",
  partition: "rgba(255,255,255,0.18)",
  partitionB: "rgba(255,255,255,0.078)",
  shelf:   "#B08968",
  coffeeMachine: "#1F2937",
  coffeeTable:   "#E8CFA6",
  couchBase: "#C2704B",
  couchBack: "#A85A3A",
  podActive: "#8B5CF6",
  podIdle:   "#3B4268",
  presenceAvailable: "#22C55E",
  presenceBusy:  "#EF4444",
  presenceAway:  "#FBBF24",
  presenceDnd:   "#A855F7",
  presenceOff:   "#9EA3AE",
  tileBorder:    "rgba(255,255,255,0.133)",
};

function presenceColor(p) {
  switch ((p || "").toUpperCase()) {
    case "AVAILABLE": return C.presenceAvailable;
    case "BUSY": return C.presenceBusy;
    case "DO_NOT_DISTURB": return C.presenceDnd;
    case "AWAY":
    case "BE_RIGHT_BACK": return C.presenceAway;
    case "OFFLINE": return C.presenceOff;
    default: return C.presenceAvailable;
  }
}
function presenceLabel(p) {
  switch ((p || "").toUpperCase()) {
    case "AVAILABLE": return "Available";
    case "BUSY": return "Busy · In meeting";
    case "AWAY": return "Away";
    case "BE_RIGHT_BACK": return "Be right back";
    case "DO_NOT_DISTURB": return "Focus · DND";
    case "OFFLINE": return "Offline";
    default: return "Active";
  }
}
function presenceEmoji(p) {
  switch ((p || "").toUpperCase()) {
    case "BUSY": return "🎧";
    case "DO_NOT_DISTURB": return "⛔";
    case "BE_RIGHT_BACK": return "☕";
    case "AWAY": return "💤";
    default: return null;
  }
}
function initials(name) {
  return String(name || "M").trim().split(/\s+/).slice(0, 2)
    .map((p) => p[0] || "").join("").toUpperCase();
}
function shade(hex, f) {
  const h = hex.replace("#", "");
  const r = Math.round(parseInt(h.slice(0, 2), 16) * f);
  const g = Math.round(parseInt(h.slice(2, 4), 16) * f);
  const b = Math.round(parseInt(h.slice(4, 6), 16) * f);
  return `rgb(${r},${g},${b})`;
}
function computeDeskRects(n) {
  const cols = 4;
  const rows = Math.max(Math.ceil(n / cols), 1);
  const x0 = 5.4, x1 = 9.7, y0 = 5.7, y1 = 9.7;
  const cw = (x1 - x0) / cols;
  const rh = (y1 - y0) / rows;
  const rects = [];
  for (let i = 0; i < n; i++) {
    rects.push({
      left: x0 + (i % cols) * cw + cw * 0.1,
      top:  y0 + Math.floor(i / cols) * rh + rh * 0.1,
      width:  cw * 0.8,
      height: rh * 0.5,
    });
  }
  return rects;
}
function makeIso(ox, oy, tw, th, unit) {
  return {
    ox, oy, tw, th, unit,
    p(x, y, z = 0) {
      return [ox + (x - y) * tw / 2, oy + (x + y) * th / 2 - z * unit];
    },
  };
}

function paintFloor(ctx, iso, state) {
  const { myZone, warLive, deskRects, deskColors, mineDesk, focusCount, pulse } = state;
  const fillPath = (pts, color) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
  };
  const strokePath = (pts, color, w = 1) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.lineWidth = w; ctx.strokeStyle = color; ctx.stroke();
  };

  const T = 0.5;
  fillPath([iso.p(0, GRID), iso.p(GRID, GRID), iso.p(GRID, GRID, -T), iso.p(0, GRID, -T)], C.slabL);
  fillPath([iso.p(GRID, 0), iso.p(GRID, GRID), iso.p(GRID, GRID, -T), iso.p(GRID, 0, -T)], C.slabR);

  const corners = [iso.p(0, 0), iso.p(GRID, 0), iso.p(GRID, GRID), iso.p(0, GRID)];
  let minY = Infinity, maxY = -Infinity;
  corners.forEach(([, y]) => { if (y < minY) minY = y; if (y > maxY) maxY = y; });
  const grad = ctx.createLinearGradient(0, minY, 0, maxY);
  grad.addColorStop(0, C.floorA); grad.addColorStop(1, C.floorB);
  fillPath(corners, grad);
  ctx.lineWidth = 1; ctx.strokeStyle = C.gridLine;
  for (let i = 1; i < GRID; i++) {
    const a1 = iso.p(i, 0), a2 = iso.p(i, GRID);
    ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.stroke();
    const b1 = iso.p(0, i), b2 = iso.p(GRID, i);
    ctx.beginPath(); ctx.moveTo(b1[0], b1[1]); ctx.lineTo(b2[0], b2[1]); ctx.stroke();
  }
  strokePath(corners, C.floorEdge, 1.4);

  const pad = (r, color, mine, live) => {
    const pts = [iso.p(r.l, r.t), iso.p(r.r, r.t), iso.p(r.r, r.b), iso.p(r.l, r.b)];
    fillPath(pts, color);
    if (live) {
      ctx.save();
      ctx.shadowColor = `rgba(34,197,94,${0.35 + 0.55 * pulse})`;
      ctx.shadowBlur = 10;
      strokePath(pts, `rgba(34,197,94,${0.4 + 0.6 * pulse})`, 2.4);
      ctx.restore();
    } else if (mine) {
      strokePath(pts, C.minePadStroke, 2);
    } else {
      strokePath(pts, C.tileBorder, 1);
    }
  };
  pad(WAR_RECT,    warLive ? C.warPadLive : C.warPadDefault, myZone === "WAR_ROOM", warLive);
  pad(COFFEE_RECT, C.coffeePad, myZone === "COFFEE_LOUNGE", false);
  pad(FOCUS_RECT,  C.focusPad,  myZone === "FOCUS_POD", false);
  pad(OPEN_RECT,   C.openPad,   myZone === "OPEN_WORKSPACE", false);

  fillEllipse(ctx, iso, 7.5, 2.5, 1.35, 0.01, C.ellipseShadow);

  wall(ctx, iso, 0, GRID, 0, 0, WALL_UNITS, C.wallA, C.wallB, true);
  wall(ctx, iso, 0, 0,    GRID, 0, WALL_UNITS, C.wallA, C.wallB, true);
  windows(ctx, iso, true);
  windows(ctx, iso, false);

  const items = [];
  items.push([0.5, () => {
    box(ctx, iso, 1.4, 0.05, 2.0, 0.08, 0.7, C.monitor, 0.55);
    fillPath(
      [iso.p(1.5, 0.13, 0.62), iso.p(3.3, 0.13, 0.62), iso.p(3.3, 0.13, 1.18), iso.p(1.5, 0.13, 1.18)],
      warLive ? `rgba(34,197,94,${0.35 + 0.3 * pulse})` : "rgba(96,165,250,0.333)"
    );
  }]);
  items.push([4.8, () => box(ctx, iso, 1.4, 1.8, 2.0, 1.2, 0.35, C.tableRoom)]);
  items.push([7.35, () => wall(ctx, iso, 5.0, 0.0, 5.0, 4.7, 0.55, C.partition, C.partitionB, false)]);
  items.push([7.35, () => wall(ctx, iso, 0.0, 5.0, 4.7, 5.0, 0.55, C.partition, C.partitionB, false)]);
  items.push([6.9, () => {
    box(ctx, iso, 5.5, 0.35, 1.6, 0.6, 0.55, C.shelf);
    box(ctx, iso, 5.8, 0.45, 0.35, 0.35, 0.35, C.coffeeMachine, 0.55);
  }]);
  items.push([10.0, () => cyl(ctx, iso, 7.5, 2.5, 0.55, 0.4, C.coffeeTable)]);
  items.push([11.0, () => {
    box(ctx, iso, 9.1, 1.2, 0.55, 2.6, 0.35, C.couchBase);
    box(ctx, iso, 9.45, 1.2, 0.2, 2.6, 0.75, C.couchBack);
  }]);
  for (let i = 0; i < POD_CENTERS.length; i++) {
    const [cx, cy] = POD_CENTERS[i];
    items.push([cx + cy, () => drawPod(ctx, iso, cx, cy, i < focusCount, pulse)]);
  }
  for (let i = 0; i < deskRects.length; i++) {
    const r = deskRects[i];
    const cx = r.left + r.width / 2;
    const cy = r.top  + r.height / 2;
    items.push([cx + cy, () => drawDesk(ctx, iso, r, deskColors[i], i === mineDesk)]);
  }
  items.sort((a, b) => a[0] - b[0]);
  items.forEach(([, fn]) => fn());
}

function wall(ctx, iso, x1, y1, x2, y2, h, a, b, edge) {
  const pts = [iso.p(x1, y1), iso.p(x2, y2), iso.p(x2, y2, h), iso.p(x1, y1, h)];
  let minY = Infinity, maxY = -Infinity;
  pts.forEach(([, y]) => { if (y < minY) minY = y; if (y > maxY) maxY = y; });
  const g = ctx.createLinearGradient(0, minY, 0, maxY);
  g.addColorStop(0, b); g.addColorStop(1, a);
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = g; ctx.fill();
  if (edge) {
    const p1 = iso.p(x1, y1, h), p2 = iso.p(x2, y2, h);
    ctx.beginPath();
    ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]);
    ctx.strokeStyle = C.wallEdge; ctx.lineWidth = 1.4; ctx.stroke();
  }
}

function windows(ctx, iso, alongX) {
  for (let k = 0; k < 4; k++) {
    const s = 0.9 + k * 2.4;
    const e = s + 1.4;
    const pts = alongX
      ? [iso.p(s, 0, 0.8), iso.p(e, 0, 0.8), iso.p(e, 0, 1.35), iso.p(s, 0, 1.35)]
      : [iso.p(0, s, 0.8), iso.p(0, e, 0.8), iso.p(0, e, 1.35), iso.p(0, s, 1.35)];
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fillStyle = C.window; ctx.fill();
  }
}

function box(ctx, iso, x, y, w, d, h, topColor, z0 = 0) {
  const z1 = z0 + h;
  const fill = (pts, color) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
  };
  fill([iso.p(x, y + d, z0), iso.p(x + w, y + d, z0), iso.p(x + w, y + d, z1), iso.p(x, y + d, z1)], shade(topColor, 0.72));
  fill([iso.p(x + w, y, z0), iso.p(x + w, y + d, z0), iso.p(x + w, y + d, z1), iso.p(x + w, y, z1)], shade(topColor, 0.52));
  fill([iso.p(x, y, z1), iso.p(x + w, y, z1), iso.p(x + w, y + d, z1), iso.p(x, y + d, z1)], topColor);
}

function ringPath(ctx, iso, cx, cy, r, z) {
  const path = new Path2D();
  for (let i = 0; i <= 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const [px, py] = iso.p(cx + r * Math.cos(a), cy + r * Math.sin(a), z);
    if (i === 0) path.moveTo(px, py);
    else path.lineTo(px, py);
  }
  path.closePath();
  return path;
}
function cyl(ctx, iso, cx, cy, r, h, topColor, z0 = 0) {
  const side = shade(topColor, 0.6);
  for (let i = 0; i <= 6; i++) {
    const p = ringPath(ctx, iso, cx, cy, r, z0 + h * i / 6);
    ctx.fillStyle = side; ctx.fill(p);
  }
  const top = ringPath(ctx, iso, cx, cy, r, z0 + h);
  ctx.fillStyle = topColor; ctx.fill(top);
}
function fillEllipse(ctx, iso, cx, cy, r, z, color) {
  const p = ringPath(ctx, iso, cx, cy, r, z);
  ctx.fillStyle = color; ctx.fill(p);
}

function drawPod(ctx, iso, cx, cy, active, pulse) {
  box(ctx, iso, cx - 0.72, cy - 0.72, 1.44, 1.44, 0.08, active ? C.podActive : C.podIdle);
  const wallH = 1.5;
  const wa = active ? "rgba(139,92,246,0.5)" : "rgba(107,114,170,0.3)";
  const wb = active ? "rgba(196,181,253,0.25)" : "rgba(180,190,220,0.12)";
  wall(ctx, iso, cx - 0.72, cy + 0.72, cx - 0.72, cy - 0.72, wallH, wa, wb, true);
  wall(ctx, iso, cx - 0.72, cy - 0.72, cx + 0.72, cy - 0.72, wallH, wa, wb, true);
  wall(ctx, iso, cx + 0.72, cy - 0.72, cx + 0.72, cy + 0.72, wallH, wa, wb, false);
  wall(ctx, iso, cx + 0.72, cy + 0.72, cx - 0.72, cy + 0.72, wallH, wa, wb, false);
  const roof = [
    iso.p(cx - 0.72, cy - 0.72, wallH),
    iso.p(cx + 0.72, cy - 0.72, wallH),
    iso.p(cx + 0.72, cy + 0.72, wallH),
    iso.p(cx - 0.72, cy + 0.72, wallH),
  ];
  ctx.beginPath();
  ctx.moveTo(roof[0][0], roof[0][1]);
  for (let i = 1; i < 4; i++) ctx.lineTo(roof[i][0], roof[i][1]);
  ctx.closePath();
  ctx.fillStyle = active ? `rgba(167,139,250,${0.35 + 0.2 * pulse})` : "rgba(80,90,130,0.25)";
  ctx.fill();
  box(ctx, iso, cx - 0.45, cy - 0.15, 0.9, 0.3, 0.3, C.deskTop, 0.08);
  box(ctx, iso, cx - 0.2, cy + 0.2, 0.4, 0.28, 0.32, C.chair, 0.08);
  if (active) {
    const [dx, dy] = iso.p(cx, cy, wallH + 0.15);
    ctx.save();
    ctx.shadowColor = "#EF4444"; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(dx, dy, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#EF4444"; ctx.fill();
    ctx.restore();
  }
}

function drawDesk(ctx, iso, r, color, mine) {
  if (mine) {
    fillEllipse(ctx, iso, r.left + r.width / 2, r.top + r.height / 2 + 0.2, 0.95, 0.02, C.deskRug);
  }
  box(ctx, iso, r.left + r.width * 0.3, r.top + r.height + 0.05, r.width * 0.4, 0.32, 0.3, C.chair);
  box(ctx, iso, r.left, r.top, r.width, r.height, DESK_HEIGHT, C.deskTop);
  const my = r.top + r.height * 0.2;
  box(ctx, iso, r.left + r.width * 0.25, my, r.width * 0.5, 0.07, 0.4, C.monitor, DESK_HEIGHT);
  const pts = [
    iso.p(r.left + r.width * 0.28, my + 0.07, DESK_HEIGHT + 0.05),
    iso.p(r.left + r.width * 0.72, my + 0.07, DESK_HEIGHT + 0.05),
    iso.p(r.left + r.width * 0.72, my + 0.07, DESK_HEIGHT + 0.36),
    iso.p(r.left + r.width * 0.28, my + 0.07, DESK_HEIGHT + 0.36),
  ];
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  if (color) {
    const h = color.replace("#", "");
    const rr = parseInt(h.slice(0, 2), 16);
    const gg = parseInt(h.slice(2, 4), 16);
    const bb = parseInt(h.slice(4, 6), 16);
    ctx.fillStyle = `rgba(${rr},${gg},${bb},0.85)`;
  } else ctx.fillStyle = "#1E293B";
  ctx.fill();
}

function KnockToast({ data, onDismiss }) {
  useEffect(() => {
    try {
      const a = new Audio("/sounds/desk-knock.mp3");
      a.volume = 0.5;
      a.play().catch(() => {});
    } catch {}
    const t = setTimeout(onDismiss, 12000);
    return () => clearTimeout(t);
  }, [data, onDismiss]);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4 text-white shadow-2xl" style={{ maxWidth: 340 }}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold">
        {initials(data.senderName)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">🚪 {data.senderName} knocked on your desk</div>
        {data.message && <div className="mt-0.5 text-xs text-slate-400">{data.message}</div>}
        <div className="mt-2 flex gap-2">
          <button onClick={onDismiss} className="rounded bg-indigo-600 px-3 py-1 text-xs font-semibold hover:bg-indigo-500">Reply in chat</button>
          <button onClick={onDismiss} className="rounded bg-slate-800 px-3 py-1 text-xs hover:bg-slate-700">Dismiss</button>
        </div>
      </div>
    </div>
  );
}

export default function VirtualOffice({ teamId, teamName, socket, connected, enabled }) {
  const { user } = useAuth();
  const currentUserId = user?.id || user?.userId || user?._id || null;

  const {
    floorState, loading, joining, error, socketError, actionLoading,
    knockNotification,
    refreshFloor, claimDesk, changeZone, knockOnDesk, dismissKnock,
    startHuddle, endHuddle,
  } = useVirtualOffice({ teamId, socket, connected, enabled });

  const members = floorState?.members || {};
  const membersList = useMemo(() => Object.values(members), [members]);
  const desks = floorState?.desks || [];
  const activeMeetingCode = floorState?.activeMeetingCode;
  const warLive = Boolean(activeMeetingCode);

  const selfMember = membersList.find((m) => m.userId === currentUserId);
  const myZone = selfMember?.zoneId || null;
  const myPresence = selfMember?.presenceStatus || "AVAILABLE";

  const inZone = (z) => membersList.filter((m) => m.zoneId === z);
  const warM = inZone("WAR_ROOM");
  const coffeeM = inZone("COFFEE_LOUNGE");
  const focusM = inZone("FOCUS_POD");

  const deskRects = useMemo(() => computeDeskRects(desks.length), [desks.length]);
  const sortedDesks = useMemo(
    () => [...desks].sort((a, b) => (a.deskNumber ?? 0) - (b.deskNumber ?? 0)),
    [desks]
  );
  const deskColors = sortedDesks.map((d) => {
    const m = d.occupiedByUserId ? members[d.occupiedByUserId] : null;
    return m ? presenceColor(m.presenceStatus) : null;
  });
  const mineDesk = sortedDesks.findIndex((d) => d.occupiedByUserId === currentUserId);

  const uniqueOccupiedDesks = useMemo(() => {
    const seen = new Set();
    const rows = [];
    for (const d of sortedDesks) {
      if (!d.occupiedByUserId || seen.has(d.occupiedByUserId)) continue;
      seen.add(d.occupiedByUserId);
      rows.push(d);
    }
    return rows;
  }, [sortedDesks]);
  const realOccupiedCount = uniqueOccupiedDesks.length;
  const realFreeCount = Math.max(0, desks.length - realOccupiedCount);
  const firstFreeDesk = useMemo(
    () => sortedDesks.find((d) => !d.occupiedByUserId),
    [sortedDesks]
  );

  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [size, setSize] = useState(() => {
    const w = 800, h = 520;
    const tw = w / (GRID + 0.4);
    const th = tw * 0.56;
    const unit = th * 1.7;
    const drawH = WALL_UNITS * unit + GRID * th + 0.5 * unit + 34;
    const top = Math.max(WALL_UNITS * unit + 18, (h - drawH) / 2 + WALL_UNITS * unit + 18);
    return { w, h, tw, th, unit, top };
  });

  useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.max(320, entry.contentRect.width);
      const h = Math.max(360, entry.contentRect.height);
      const tw = w / (GRID + 0.4);
      const th = tw * 0.56;
      const unit = th * 1.7;
      const drawH = WALL_UNITS * unit + GRID * th + 0.5 * unit + 34;
      const top = Math.max(WALL_UNITS * unit + 18, (h - drawH) / 2 + WALL_UNITS * unit + 18);
      setSize({ w, h, tw, th, unit, top });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const pulseRef = useRef(0);
  useEffect(() => {
    let raf;
    const tick = (t) => {
      pulseRef.current = (Math.sin(t / 900) + 1) / 2;
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [size, warLive, myZone, mineDesk, sortedDesks.length, focusM.length]);

  function draw() {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    if (w < 50 || h < 50) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const tw = w / (GRID + 0.4);
    const th = tw * 0.56;
    const unit = th * 1.7;
    const drawH = WALL_UNITS * unit + GRID * th + 0.5 * unit + 34;
    const top = Math.max(WALL_UNITS * unit + 18, (h - drawH) / 2 + WALL_UNITS * unit + 18);
    const iso = makeIso(w / 2, top, tw, th, unit);
    paintFloor(ctx, iso, {
      myZone, warLive, deskRects, deskColors, mineDesk,
      focusCount: focusM.length, pulse: pulseRef.current,
    });
  }

  const iso = useMemo(() => {
    const w = size.w || 800;
    const h = size.h || 520;
    const tw = w / (GRID + 0.4);
    const th = tw * 0.56;
    const unit = th * 1.7;
    const drawH = WALL_UNITS * unit + GRID * th + 0.5 * unit + 34;
    const top = Math.max(WALL_UNITS * unit + 18, (h - drawH) / 2 + WALL_UNITS * unit + 18);
    return makeIso(w / 2, top, tw, th, unit);
  }, [size]);

  const avatarSize = Math.max(34, Math.min(48, size.tw * 1.0));

  const avatars = useMemo(() => {
    const out = [];
    const seen = new Set();
    const deskByUser = {};
    sortedDesks.forEach((d, i) => {
      if (d.occupiedByUserId) deskByUser[d.occupiedByUserId] = { desk: d, idx: i };
    });
    let coffeeIdx = 0, focusIdx = 0, warIdx = 0, strayIdx = 0;
    const push = (m, wx, wy, z, dim) => {
      if (seen.has(m.userId)) return;
      seen.add(m.userId);
      const [px, py] = iso.p(wx, wy, z);
      out.push({
        userId: m.userId,
        left: px - avatarSize / 2,
        top: py - avatarSize - 6,
        member: m, dim,
        label: m.userId === currentUserId ? "You" : (m.name || "").split(" ")[0],
      });
    };
    membersList.forEach((m) => {
      const presence = (m.presenceStatus || "OFFLINE").toUpperCase();
      if (presence === "OFFLINE") return;
      let effZone = m.zoneId;
      if (presence === "DO_NOT_DISTURB") effZone = "FOCUS_POD";
      else if (presence === "BE_RIGHT_BACK") effZone = "COFFEE_LOUNGE";
      else if (presence === "BUSY" && m.isInMeeting) effZone = "WAR_ROOM";
      else if (presence === "BUSY" || presence === "AVAILABLE" || presence === "AWAY") effZone = "OPEN_WORKSPACE";

      if (effZone === "OPEN_WORKSPACE") {
        const dk = deskByUser[m.userId];
        if (dk) {
          const r = deskRects[dk.idx];
          let cx = r.left + r.width / 2;
          let cy = r.top + r.height + 0.2;
          if (presence === "AWAY") { cx += 0.4; cy += 0.4; }
          push(m, cx, cy, 0.15, presence === "AWAY" ? 0.5 : 1);
        } else {
          push(m, 6.0 + (strayIdx % 4) * 0.9, 9.3, 0, 1);
          strayIdx++;
        }
      } else if (effZone === "COFFEE_LOUNGE") {
        const [cx, cy] = COFFEE_SLOTS[coffeeIdx % COFFEE_SLOTS.length];
        coffeeIdx++;
        push(m, cx, cy, 0, 1);
      } else if (effZone === "FOCUS_POD") {
        const [cx, cy] = POD_CENTERS[focusIdx % POD_CENTERS.length];
        focusIdx++;
        push(m, cx, cy + 0.15, 0.1, 1);
      } else if (effZone === "WAR_ROOM") {
        const [cx, cy] = WAR_SLOTS[warIdx % WAR_SLOTS.length];
        warIdx++;
        push(m, cx, cy, 0, 1);
      }
    });
    out.sort((a, b) => a.top - b.top);
    return out;
  }, [membersList, sortedDesks, deskRects, iso, avatarSize, currentUserId]);

  const labels = [
    { text: warLive ? "Meeting Room · LIVE" : (warM.length ? `Meeting Room · ${warM.length}` : "Meeting Room"), pos: iso.p(2.5, 0, 0.3) },
    { text: coffeeM.length ? `Coffee Lounge · ${coffeeM.length}` : "Coffee Lounge", pos: iso.p(7.5, 0, 0.3) },
    { text: focusM.length ? `Focus Pods · ${focusM.length}` : "Focus Pods", pos: iso.p(0, 7.5, 0.3) },
    { text: "Open Workspace", pos: iso.p(7.5, 5.1) },
  ];

  const [huddleBusy, setHuddleBusy] = useState(false);
  const handleStartHuddle = useCallback(async () => {
    if (huddleBusy || !startHuddle) return;
    setHuddleBusy(true);
    try {
      await startHuddle();
      changeZone("WAR_ROOM");
    } finally {
      setHuddleBusy(false);
    }
  }, [huddleBusy, startHuddle, changeZone]);

  const handleEndHuddle = useCallback(async () => {
    if (huddleBusy || !endHuddle) return;
    setHuddleBusy(true);
    try {
      await endHuddle();
      changeZone("OPEN_WORKSPACE");
    } finally {
      setHuddleBusy(false);
    }
  }, [huddleBusy, endHuddle, changeZone]);

  const handleJoinHuddle = useCallback(() => {
    changeZone("WAR_ROOM");
  }, [changeZone]);

  const handleSitAtDesk = useCallback(() => {
    if (myZone === "OPEN_WORKSPACE" && mineDesk >= 0) return;
    if (firstFreeDesk) claimDesk(firstFreeDesk.deskId);
    else changeZone("OPEN_WORKSPACE");
  }, [myZone, mineDesk, firstFreeDesk, claimDesk, changeZone]);

  const isLoading = loading || joining;
  if (isLoading && !floorState) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/5 text-sky-100">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-300 border-t-transparent" />
        <p className="text-sm">Connecting to your virtual office...</p>
      </div>
    );
  }
  if (!floorState && error) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-2xl border border-red-300/20 bg-red-400/5 p-6 text-center">
        <h3 className="font-semibold text-white">Unable to load Virtual Office</h3>
        <p className="max-w-md text-sm text-sky-100/70">{error}</p>
        <button onClick={refreshFloor} className="rounded-xl bg-[#0066FF] px-4 py-2.5 text-sm font-semibold text-white">Try again</button>
      </div>
    );
  }

  const meInWarRoom = myZone === "WAR_ROOM";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3 text-white sm:p-5">
      {knockNotification && (
        <KnockToast data={knockNotification} onDismiss={dismissKnock} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold sm:text-xl">Virtual Office</h2>
          <p className="mt-1 text-xs text-sky-100/65 sm:text-sm">
            {teamName} · Your team's shared workspace
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ background: presenceColor(myPresence) }} />
            <span className="font-semibold">{presenceLabel(myPresence)}</span>
          </span>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${
            connected
              ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-200"
              : "border-red-300/25 bg-red-400/10 text-red-200"
          }`}>
            <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-red-400"}`} />
            {connected ? `${membersList.length} Online` : "Reconnecting"}
          </span>
          <button
            onClick={refreshFloor}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-sky-100 hover:bg-white/10 disabled:opacity-50"
            aria-label="Refresh office"
          >↻</button>
        </div>
      </div>

      {(error || socketError) && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          <span>{error || socketError}</span>
          <button onClick={refreshFloor} className="font-semibold underline">Refresh</button>
        </div>
      )}

      <div className="grid min-w-0 gap-4 xl:grid-cols-[1.5fr_1fr]">
        <section className="min-w-0">
          <div className="rounded-3xl border border-white/10 p-3 shadow-2xl"
            style={{ background: "linear-gradient(180deg,#222E50 0%,#151C33 100%)" }}>
            <div className="mb-2 flex items-center justify-between px-2">
              <div>
                <h3 className="text-base font-bold text-white sm:text-lg">
                  Virtual Office Floor
                  <span className="ml-2 rounded-full bg-sky-500/20 px-2 py-0.5 text-[11px] font-semibold text-sky-200">
                    {desks.length} Desks
                  </span>
                </h3>
                <p className="mt-0.5 text-[11px] text-sky-100/60 sm:text-xs">
                  Interactive isometric floor · Click any room or desk to navigate
                </p>
              </div>
              <div className="hidden gap-2 sm:flex">
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-center">
                  <div className="text-base font-bold text-white">{realFreeCount}</div>
                  <div className="text-[10px] text-sky-100/60">Desks Free</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-center">
                  <div className="text-base font-bold text-white">{warM.length}</div>
                  <div className="text-[10px] text-sky-100/60">In Huddle</div>
                </div>
              </div>
            </div>

            <div ref={wrapRef}
              className="relative w-full overflow-hidden rounded-2xl"
              style={{ aspectRatio: "1.45 / 1", minHeight: 420, maxHeight: 640 }}>
              <canvas ref={canvasRef}
                className="pointer-events-none absolute inset-0"
                style={{ width: "100%", height: "100%" }} />

              {sortedDesks.map((desk, i) => {
                const r = deskRects[i];
                if (!r) return null;
                const [cx, cy] = iso.p(r.left + r.width / 2, r.top + r.height / 2, 0.3);
                const w = size.tw * 1.2;
                const h = size.tw * 0.9;
                const occupied = desk.status !== "EMPTY" && desk.occupiedByUserId;
                return (
                  <button key={desk.deskId} type="button"
                    onClick={() => occupied
                      ? desk.occupiedByUserId !== currentUserId && knockOnDesk(desk.occupiedByUserId, "")
                      : claimDesk(desk.deskId)}
                    disabled={actionLoading || !connected}
                    title={occupied
                      ? `Desk ${desk.deskNumber} · ${members[desk.occupiedByUserId]?.name || "Teammate"}`
                      : `Desk ${desk.deskNumber} · Free`}
                    className="absolute cursor-pointer border-0 bg-transparent p-0"
                    style={{ left: cx - w / 2, top: cy - h * 0.65, width: w, height: h }} />
                );
              })}

              {[
                { zone: "WAR_ROOM", rect: WAR_RECT },
                { zone: "COFFEE_LOUNGE", rect: COFFEE_RECT },
                { zone: "FOCUS_POD", rect: FOCUS_RECT },
              ].map(({ zone, rect }) => {
                const corners = [
                  iso.p(rect.l, rect.t), iso.p(rect.r, rect.t),
                  iso.p(rect.r, rect.b), iso.p(rect.l, rect.b),
                ];
                const xs = corners.map((p) => p[0]);
                const ys = corners.map((p) => p[1]);
                const x1 = Math.min(...xs), x2 = Math.max(...xs);
                const y1 = Math.min(...ys), y2 = Math.max(...ys);
                return (
                  <button key={zone} type="button"
                    onClick={() => changeZone(zone)}
                    disabled={actionLoading || !connected}
                    title={zone.replace("_", " ")}
                    className="absolute cursor-pointer border-0 bg-transparent p-0"
                    style={{ left: x1, top: y1, width: x2 - x1, height: y2 - y1, zIndex: 1 }} />
                );
              })}

              {labels.map((l, i) => (
                <div key={i}
                  className="pointer-events-none absolute text-center font-bold text-white"
                  style={{
                    left: l.pos[0] - 70, top: l.pos[1] - 7, width: 140,
                    fontSize: 10, letterSpacing: 0.3,
                    textShadow: "0 0 4px rgba(0,0,0,0.6)",
                  }}>{l.text}</div>
              ))}

              {avatars.map((a) => {
                const isSelf = a.userId === currentUserId;
                const presence = a.member.presenceStatus;
                const ring = presenceColor(presence);
                const emoji = presenceEmoji(presence);
                return (
                  <div key={a.userId} className="absolute"
                    style={{
                      left: a.left, top: a.top, width: avatarSize,
                      opacity: a.dim ?? 1,
                      zIndex: Math.round(a.top + 500),
                    }}>
                    <div
                      onClick={() => !isSelf && knockOnDesk(a.userId, "")}
                      className={`relative mx-auto flex items-center justify-center rounded-full ${!isSelf ? "cursor-pointer" : ""}`}
                      style={{
                        width: avatarSize, height: avatarSize,
                        background: "#0F172A",
                        border: `3px solid ${ring}`,
                        boxShadow: `0 0 14px ${ring}99, 0 2px 8px rgba(0,0,0,0.5)`,
                      }}>
                      {a.member.avatarUrl ? (
                        <img src={a.member.avatarUrl} alt=""
                          className="h-full w-full rounded-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      ) : (
                        <span className="font-bold text-white"
                          style={{ fontSize: avatarSize * 0.42 }}>
                          {initials(a.member.name)}
                        </span>
                      )}
                      {emoji && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] shadow"
                          style={{ border: `1.5px solid ${ring}` }}>
                          {emoji}
                        </span>
                      )}
                      {a.member.isInMeeting && !emoji && (
                        <span className="absolute -right-1.5 -top-1.5 rounded-md bg-emerald-500 px-1 text-[10px] font-bold text-white">
                          📹
                        </span>
                      )}
                    </div>
                    {a.label && (
                      <div className="mx-auto mt-1 truncate rounded-md border px-2 py-0.5 text-center text-[10px] font-bold text-white"
                        style={{
                          background: "rgba(15,23,42,0.8)",
                          borderColor: `${ring}cc`,
                          maxWidth: avatarSize + 24,
                        }}>
                        {a.label}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 px-2 sm:grid-cols-4">
              <button onClick={handleSitAtDesk}
                disabled={actionLoading || !connected || (realFreeCount === 0 && mineDesk < 0)}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition disabled:opacity-50 ${
                  myZone === "OPEN_WORKSPACE"
                    ? "border-emerald-300/60 bg-emerald-400/20 text-emerald-100"
                    : "border-white/10 bg-white/5 text-sky-100 hover:bg-white/10"
                }`}>🪑 Sit at Desk</button>
              <button onClick={() => changeZone("COFFEE_LOUNGE")}
                disabled={actionLoading || !connected}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition disabled:opacity-50 ${
                  myZone === "COFFEE_LOUNGE"
                    ? "border-amber-300/60 bg-amber-400/20 text-amber-100"
                    : "border-white/10 bg-white/5 text-sky-100 hover:bg-white/10"
                }`}>☕ Coffee Lounge</button>
              <button onClick={() => changeZone("FOCUS_POD")}
                disabled={actionLoading || !connected}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition disabled:opacity-50 ${
                  myZone === "FOCUS_POD"
                    ? "border-violet-300/60 bg-violet-400/20 text-violet-100"
                    : "border-white/10 bg-white/5 text-sky-100 hover:bg-white/10"
                }`}>🛡️ Focus Pod</button>
              {warLive ? (
                meInWarRoom ? (
                  <button onClick={handleEndHuddle}
                    disabled={huddleBusy || actionLoading || !connected}
                    className="flex items-center justify-center gap-2 rounded-xl border border-red-400/60 bg-red-500/20 px-3 py-3 text-sm font-semibold text-red-100 hover:bg-red-500/30 disabled:opacity-50">
                    🛑 End Huddle
                  </button>
                ) : (
                  <button onClick={handleJoinHuddle}
                    disabled={actionLoading || !connected}
                    className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/60 bg-emerald-500/20 px-3 py-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/30 disabled:opacity-50">
                    📞 Join Huddle
                  </button>
                )
              ) : (
                <button onClick={handleStartHuddle}
                  disabled={huddleBusy || actionLoading || !connected}
                  className="flex items-center justify-center gap-2 rounded-xl border border-violet-400/60 bg-gradient-to-r from-violet-500 to-purple-600 px-3 py-3 text-sm font-bold text-white hover:from-violet-400 hover:to-purple-500 disabled:opacity-50">
                  🚀 Start Huddle
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="grid min-w-0 content-start gap-4">
          <section className="rounded-2xl border border-white/15 bg-white/[0.07] p-4 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-400/15 text-xl">📹</div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white">The War Room</h3>
                  <p className="text-xs text-sky-100/60">
                    {warLive ? `Meeting in progress · code ${activeMeetingCode}` : "War Room available"}
                  </p>
                </div>
              </div>
              {warLive ? (
                meInWarRoom ? (
                  <button onClick={handleEndHuddle}
                    disabled={huddleBusy || actionLoading || !connected}
                    className="shrink-0 rounded-full bg-red-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg hover:bg-red-400 disabled:opacity-50">
                    🛑 End
                  </button>
                ) : (
                  <button onClick={handleJoinHuddle}
                    disabled={actionLoading || !connected}
                    className="shrink-0 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-400 disabled:opacity-50">
                    📞 Join
                  </button>
                )
              ) : (
                <button onClick={handleStartHuddle}
                  disabled={huddleBusy || actionLoading || !connected}
                  className="shrink-0 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg disabled:opacity-50">
                  🚀 Start Huddle
                </button>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-black/20 px-3 py-2 text-xs">
              <span className="text-sky-100/60">Room Status:</span>
              <span className="font-semibold text-sky-100">
                {warLive ? `${warM.length} in call` : "Nobody is in the call yet"}
              </span>
            </div>
          </section>

          <section className="rounded-2xl border border-white/15 bg-white/[0.07] p-4 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-xl">🪑</div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white">Open Desks</h3>
                  <p className="text-xs text-sky-100/60">{realFreeCount} Desks Available</p>
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-white/10 bg-black/10 px-2 py-1 text-xs text-sky-100/80">
                {realOccupiedCount}/{desks.length} Occupied
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {uniqueOccupiedDesks.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/15 px-3 py-4 text-center text-xs text-sky-100/55">
                  Nobody sitting yet.
                </p>
              ) : (
                uniqueOccupiedDesks.map((desk) => {
                  const m = members[desk.occupiedByUserId];
                  const isSelf = desk.occupiedByUserId === currentUserId;
                  const name = m?.name || desk.occupiedByUserName || "Teammate";
                  const status = m?.presenceStatus || desk.status;
                  const ring = presenceColor(status);
                  const canKnock = !isSelf && status !== "DO_NOT_DISTURB" && status !== "OFFLINE";
                  return (
                    <div key={desk.deskId}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="relative h-10 w-10 shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#1D4770] text-xs font-semibold text-white">
                          {m?.avatarUrl ? (
                            <img src={m.avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : initials(name)}
                        </div>
                        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#213F70]"
                          style={{ background: ring }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {name}
                          {isSelf && (
                            <span className="ml-2 rounded bg-amber-500/80 px-1.5 py-0.5 text-[10px] font-bold text-white">YOU</span>
                          )}
                        </p>
                        <p className="text-xs text-sky-100/65">
                          Desk #{String(desk.deskNumber).padStart(2, "0")} · {presenceLabel(status)}
                        </p>
                      </div>
                      {canKnock && (
                        <button onClick={() => knockOnDesk(desk.occupiedByUserId, "")}
                          disabled={actionLoading || !connected}
                          className="shrink-0 rounded-lg bg-amber-500/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-50">
                          Knock 👋
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <section className="rounded-2xl border border-white/15 bg-white/[0.07] p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/15 text-lg">☕</div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-white">Coffee Lounge</h3>
                  <p className="truncate text-[10px] text-sky-100/60">
                    {coffeeM.length ? `${coffeeM.length} on break` : "The lounge is quiet"}
                  </p>
                </div>
              </div>
              <button onClick={() => changeZone("COFFEE_LOUNGE")}
                disabled={actionLoading || !connected}
                className="mt-3 w-full rounded-lg bg-amber-500/70 px-2 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-50">
                Take Break ☕
              </button>
            </section>
            <section className="rounded-2xl border border-white/15 bg-white/[0.07] p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-400/15 text-lg">🛡️</div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-white">Focus Pods</h3>
                  <p className="truncate text-[10px] text-sky-100/60">
                    {focusM.length ? `${focusM.length} focusing` : "All pods are free"}
                  </p>
                </div>
              </div>
              <button onClick={() => changeZone("FOCUS_POD")}
                disabled={actionLoading || !connected}
                className="mt-3 w-full rounded-lg bg-violet-500/70 px-2 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50">
                Enter Pod 🛡️
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

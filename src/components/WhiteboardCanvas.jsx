import { useRef, useState } from "react";

function makeId() {
  return globalThis.crypto?.randomUUID?.() ||
    `wb-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function renderElement(element) {
  const common = {
    key: element.id,
    stroke: element.strokeColor || "#0066FF",
    strokeWidth: element.strokeWidth || 3,
    fill: element.fill || "none",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  if (element.type === "stroke") {
    return <polyline {...common} points={(element.points || []).map(([x, y]) => `${x},${y}`).join(" ")} fill="none" />;
  }
  if (element.type === "line") return <line {...common} x1={element.x1 ?? element.x} y1={element.y1 ?? element.y} x2={element.x2} y2={element.y2} />;
  if (element.type === "rectangle") return <rect {...common} x={Math.min(element.x, element.x2)} y={Math.min(element.y, element.y2)} width={Math.abs(element.x2 - element.x)} height={Math.abs(element.y2 - element.y)} />;
  if (element.type === "ellipse") return <ellipse {...common} cx={(element.x + element.x2) / 2} cy={(element.y + element.y2) / 2} rx={Math.abs(element.x2 - element.x) / 2} ry={Math.abs(element.y2 - element.y) / 2} />;
  if (element.type === "text") return <text key={element.id} x={element.x} y={element.y} fill={element.color || "#0F172A"} fontSize={element.fontSize || 18}>{element.text}</text>;
  return null;
}

function pointNearElement(element, point, threshold = 16) {
  if (element.type === "stroke") return (element.points || []).some(([x, y]) => Math.hypot(x - point.x, y - point.y) < threshold);
  if (element.type === "line") {
    const x1 = element.x1 ?? element.x, y1 = element.y1 ?? element.y, x2 = element.x2, y2 = element.y2;
    const dx = x2 - x1, dy = y2 - y1;
    const length2 = dx * dx + dy * dy;
    const t = length2 ? Math.max(0, Math.min(1, ((point.x - x1) * dx + (point.y - y1) * dy) / length2)) : 0;
    return Math.hypot(point.x - (x1 + t * dx), point.y - (y1 + t * dy)) < threshold;
  }
  const left = Math.min(element.x ?? 0, element.x2 ?? element.x ?? 0);
  const right = Math.max(element.x ?? 0, element.x2 ?? element.x ?? 0);
  const top = Math.min(element.y ?? 0, element.y2 ?? element.y ?? 0);
  const bottom = Math.max(element.y ?? 0, element.y2 ?? element.y ?? 0);
  if (element.type === "text") return Math.abs(point.x - element.x) < 80 && Math.abs(point.y - element.y) < 24;
  return point.x >= left - threshold && point.x <= right + threshold && point.y >= top - threshold && point.y <= bottom + threshold;
}

export default function WhiteboardCanvas({
  elements = [], drawElement, changeElements, moveCursor = () => {},
  tool = "pen", color = "#0066FF", strokeWidth = 3, backgroundColor = "#FFFFFF",
}) {
  const svgRef = useRef(null);
  const drawingRef = useRef(null);
  const [draft, setDraft] = useState(null);

  function getPoint(event) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svg.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    const local = point.matrixTransform(matrix.inverse());
    return { x: local.x, y: local.y };
  }

  function eraseAt(point) {
    const target = [...elements].reverse().find((element) => pointNearElement(element, point));
    if (target) changeElements([], [target.id]);
  }

  function handlePointerDown(event) {
    if (tool === "select" || tool === "text") return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = getPoint(event);
    if (tool === "eraser") {
      drawingRef.current = { type: "eraser" };
      eraseAt(point);
      return;
    }
    const base = { id: makeId(), strokeColor: color, strokeWidth, x: point.x, y: point.y, x2: point.x, y2: point.y };
    const next = tool === "pen" ? { ...base, type: "stroke", points: [[point.x, point.y]] } : { ...base, type: tool };
    drawingRef.current = next;
    setDraft(next);
  }

  function handlePointerMove(event) {
    const point = getPoint(event);
    moveCursor(point.x, point.y);
    const current = drawingRef.current;
    if (!current) return;
    if (current.type === "eraser") { eraseAt(point); return; }
    const next = current.type === "stroke"
      ? { ...current, points: [...current.points, [point.x, point.y]] }
      : { ...current, x2: point.x, y2: point.y };
    drawingRef.current = next;
    setDraft(next);
  }

  function handlePointerUp() {
    const completed = drawingRef.current;
    drawingRef.current = null;
    setDraft(null);
    if (completed && completed.type !== "eraser") {
      if (completed.type === "line") drawElement({ ...completed, x1: completed.x, y1: completed.y });
      else drawElement(completed);
    }
  }

  function handleDoubleClick(event) {
    if (tool !== "text") return;
    const point = getPoint(event);
    const text = window.prompt("Enter text");
    if (text?.trim()) drawElement({ id: makeId(), type: "text", x: point.x, y: point.y, text: text.trim(), fontSize: 18, color });
  }

  return (
    <div className="h-full min-h-0 w-full overflow-hidden rounded-md bg-white">
      <svg ref={svgRef} viewBox="0 0 1200 700" preserveAspectRatio="none"
        className="h-full w-full touch-none" style={{ backgroundColor }}
        onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onDoubleClick={handleDoubleClick}>
        {elements.map(renderElement)}
        {draft && renderElement(draft)}
      </svg>
    </div>
  );
}


import { useCallback, useRef, useState } from "react";

function makeId() {
  return globalThis.crypto?.randomUUID?.() ||
      `wb-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 700;
const HIT_TOLERANCE = 10;

const normalizePoint = (point) => {
    if (Array.isArray(point)) {
        return { x: Number(point[0]) || 0, y: Number(point[1]) || 0 };
    }

    return {
        x: Number(point?.x) || 0,
        y: Number(point?.y) || 0,
    };
};

const getElementBounds = (element) => {
    if (["line", "arrow"].includes(element.type)) {
        const points = element.points || [
            { x: element.x || 0, y: element.y || 0 },
            { x: element.x2 ?? element.x ?? 0, y: element.y2 ?? element.y ?? 0 },
        ];

        const start = normalizePoint(points[0]);
        const end = normalizePoint(points[1]);

        return {
            x: Math.min(start.x, end.x),
            y: Math.min(start.y, end.y),
            width: Math.abs(end.x - start.x),
            height: Math.abs(end.y - start.y),
        };
    }
   
    const x = Number(element.x) || 0;
    const y = Number(element.y) || 0;

    const width = Number(element.width) || Math.abs((element.x2 ?? x) - x);
    const height = Number(element.height) || Math.abs((element.y2 ?? y) - y);

    return {
        x: Math.min(x, x + width),
        y: Math.min(y, y + height),
        width: Math.abs(width),
        height: Math.abs(height),
    };
};

const getElementPoints = (element) => {
    if (element.type === "stroke") {
        return (element.points || []).map(normalizePoint);
    }

    if (element.type === "line" || element.type === "arrow") {
        if (Array.isArray(element.points) && element.points.length >= 2) {
            return element.points.slice(0, 2).map(normalizePoint);
        }

        return [
            {
                x: element.x1 ?? element.x ?? 0,
                y: element.y1 ?? element.y ?? 0,
            },
            {
                x: element.x2 ?? element.x ?? 0,
                y: element.y2 ?? element.y ?? 0,
            },
        ];
    }

    return [];
};

const isFilled = (element) => {
    const fill = element.fillColor ?? element.fill;

    return Boolean(
        fill &&
        fill !== "none" &&
        fill !== "transparent"
    );
};

const distanceToSegment = (point, start, end) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;

    const t = lengthSquared
        ? Math.max(
            0,
            Math.min(
                1,
                ((point.x - start.x) * dx + (point.y - start.y) * dy) /
                lengthSquared
            )
        )
        : 0;

    return Math.hypot(
        point.x - (start.x + t * dx),
        point.y - (start.y + t * dy)
    );
};

const isPointInsidePolygon = (point, polygon) => {
    let inside = false;

    for (
        let i = 0, j = polygon.length - 1;
        i < polygon.length;
        j = i++
    ) {
        const a = polygon[i];
        const b = polygon[j];

        const intersects =
            (a.y > point.y) !== (b.y > point.y) &&
            point.x <
            ((b.x - a.x) * (point.y - a.y)) /
            ((b.y - a.y) || Number.EPSILON) +
            a.x;

        if (intersects) inside = !inside;
    }

    return inside;
};

const getShapePolygon = (element) => {
    const bounds = getElementBounds(element);
    const { x, y, width, height } = bounds;

    if (element.type === "diamond") {
        return [
            { x: x + width / 2, y },
            { x: x + width, y: y + height / 2 },
            { x: x + width / 2, y: y + height },
            { x, y: y + height / 2 },
        ];
    }

    if (element.type === "triangle") {
        return [
            { x: x + width / 2, y },
            { x: x + width, y: y + height },
            { x, y: y + height },
        ];
    }

    return [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height },
    ];
};

const pointNearElement = (element, point, tolerance = HIT_TOLERANCE) => {
    const bounds = getElementBounds(element);
    const { x, y, width, height } = bounds;

    if (element.type === "stroke") {
        const points = getElementPoints(element);

        if (points.length === 1) {
            return Math.hypot(
                point.x - points[0].x,
                point.y - points[0].y
            ) <= tolerance;
        }

        return points.some((current, index) => {
            if (index === 0) return false;

            return distanceToSegment(
                point,
                points[index - 1],
                current
            ) <= tolerance;
        });
    }

    if (element.type === "line" || element.type === "arrow") {
        const points = getElementPoints(element);

        return distanceToSegment(point, points[0], points[1]) <= tolerance;
    }

    if (element.type === "text") {
        const fontSize = Number(element.fontSize) || 18;
        const textWidth = Math.max(
            Number(element.width) || 0,
            String(element.text || "").length * fontSize * 0.6
        );

        return (
            point.x >= x - tolerance &&
            point.x <= x + textWidth + tolerance &&
            point.y >= y - fontSize - tolerance &&
            point.y <= y + tolerance
        );
    }

    if (element.type === "ellipse") {
        const rx = width / 2;
        const ry = height / 2;

        if (!rx || !ry) return false;

        const normalizedDistance =
            Math.sqrt(
                ((point.x - (x + rx)) / rx) ** 2 +
                ((point.y - (y + ry)) / ry) ** 2
            );

        if (isFilled(element)) {
            return normalizedDistance <= 1;
        }

        const approximateDistance =
            Math.abs(normalizedDistance - 1) *
            Math.min(rx, ry);

        return normalizedDistance <= 1.15 &&
            approximateDistance <= tolerance;
    }

    const polygon = getShapePolygon(element);

    if (isFilled(element)) {
        return isPointInsidePolygon(point, polygon);
    }

    const insideBounds =
        point.x >= x - tolerance &&
        point.x <= x + width + tolerance &&
        point.y >= y - tolerance &&
        point.y <= y + height + tolerance;

    if (!insideBounds) return false;

    return polygon.some((current, index) => {
        const next = polygon[(index + 1) % polygon.length];

        return distanceToSegment(point, current, next) <= tolerance;
    });
};

const renderElement = (element, selected = false) => {
    if (!element?.id) return null;

    const stroke = element.strokeColor || "#0066FF";
    const strokeWidth = Number(element.strokeWidth) || 3;
    const fill = element.fillColor ?? element.fill ?? "none";
    const bounds = getElementBounds(element);
    const { x, y, width, height } = bounds;

    const common = {
        stroke,
        strokeWidth,
        fill,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        vectorEffect: "non-scaling-stroke",
    };

    let rendered = null;

    if (element.type === "stroke") {
        const points = getElementPoints(element);

        rendered = (
            <polyline
                {...common}
                points={points.map((point) => `${point.x},${point.y}`).join(" ")}
                fill="none"
            />
        );
    }

    if (element.type === "line" || element.type === "arrow") {
        const points = getElementPoints(element);

        rendered = (
            <line
                {...common}
                x1={points[0].x}
                y1={points[0].y}
                x2={points[1].x}
                y2={points[1].y}
                markerEnd={
                    element.type === "arrow"
                        ? "url(#whiteboard-arrow)"
                        : undefined
                }
            />
        );
    }

    if (element.type === "rectangle") {
        rendered = (
            <rect
                {...common}
                x={x}
                y={y}
                width={width}
                height={height}
            />
        );
    }

    if (element.type === "ellipse") {
        rendered = (
            <ellipse
                {...common}
                cx={x + width / 2}
                cy={y + height / 2}
                rx={width / 2}
                ry={height / 2}
            />
        );
    }

    if (element.type === "diamond" || element.type === "triangle") {
        const points = getShapePolygon(element);

        rendered = (
            <polygon
                {...common}
                points={points.map((point) => `${point.x},${point.y}`).join(" ")}
            />
        );
    }

    if (element.type === "text") {
        rendered = (
            <text
                x={x}
                y={y}
                fill={element.color || element.strokeColor || "#111827"}
                fontSize={element.fontSize || 18}
                fontFamily={element.fontFamily || "Inter, sans-serif"}
                dominantBaseline="auto"
            >
                {element.text}
            </text>
        );
    }

    if (!rendered) return null;

    return (
        <g key={element.id}>
            {rendered}
            {selected && (
                <rect
                    x={x - 6}
                    y={y - 6}
                    width={Math.max(width + 12, 12)}
                    height={Math.max(height + 12, 12)}
                    fill="none"
                    stroke="#0066FF"
                    strokeWidth="1.5"
                    strokeDasharray="5 4"
                    vectorEffect="non-scaling-stroke"
                    pointerEvents="none"
                />
            )}
        </g>
    );
};

export default function WhiteboardCanvas({
    elements = [],
    drawElement,
    changeElements,
    moveCursor = () => {},
    tool = "pen",
    color = "#0066FF",
    strokeWidth = 3,
    backgroundColor = "#FFFFFF",
    viewState,
    updateViewState = () => {},
    readOnly = false,
}) {
    const svgRef = useRef(null);
    const drawingRef = useRef(null);
    const lastPointRef = useRef(null);
    const [draft, setDraft] = useState(null);
    const [textEditor, setTextEditor] = useState(null);
    const [selectedId, setSelectedId] = useState(null);

    const zoom = Math.min(
        3,
        Math.max(0.25, Number(viewState?.zoom) || 1)
    );

    const scrollX = Number(viewState?.scrollX) || 0;
    const scrollY = Number(viewState?.scrollY) || 0;

    const viewWidth = DEFAULT_WIDTH / zoom;
    const viewHeight = DEFAULT_HEIGHT / zoom;

    const getPoint = useCallback((event) => {
        const svg = svgRef.current;

        if (!svg) return null;

        const point = svg.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;

        const matrix = svg.getScreenCTM();

        if (!matrix) return null;

        const local = point.matrixTransform(matrix.inverse());

        return {
            x: local.x,
            y: local.y,
        };
    }, []);

    const findElement = useCallback(
        (point) => {
            return [...elements]
                .reverse()
                .find((element) => pointNearElement(element, point));
        },
        [elements]
    );

    const updateDraft = useCallback((point) => {
        const current = drawingRef.current;

        if (!current) return;

        let next;

        if (current.type === "stroke") {
            next = {
                ...current,
                points: [
                    ...current.points,
                    { x: point.x, y: point.y },
                ],
            };
        } else if (current.type === "line" || current.type === "arrow") {
            next = {
                ...current,
                width: point.x - current.x,
                height: point.y - current.y,
                points: [
                    current.points[0],
                    { x: point.x, y: point.y },
                ],
            };
        } else {
            next = {
                ...current,
                width: point.x - current.x,
                height: point.y - current.y,
            };
        }

        drawingRef.current = next;
        setDraft(next);
    }, []);

    const handlePointerDown = useCallback(
        (event) => {
            if (readOnly) return;

            const point = getPoint(event);

            if (!point) return;

            event.preventDefault();
            event.currentTarget.setPointerCapture?.(event.pointerId);

            if (tool === "select") {
                const target = findElement(point);

                if (target) {
                    setSelectedId(target.id);

                    drawingRef.current = {
                        type: "move",
                        element: target,
                        start: point,
                    };
                } else {
                    setSelectedId(null);

                    drawingRef.current = {
                        type: "pan",
                        start: point,
                        scrollX,
                        scrollY,
                    };
                }

                lastPointRef.current = point;
                return;
            }

            if (tool === "text") return;

            if (tool === "eraser") {
                drawingRef.current = { type: "eraser" };

                const target = findElement(point);

                if (target) {
                    changeElements([], [target.id]);
                }

                return;
            }

            const base = {
                id: makeId(),
                x: point.x,
                y: point.y,
                width: 0,
                height: 0,
                strokeColor: color,
                strokeWidth,
                fillColor: "transparent",
            };

            let next;

            if (tool === "pen" || tool === "stroke") {
                next = {
                    ...base,
                    type: "stroke",
                    points: [{ x: point.x, y: point.y }],
                };
            } else if (tool === "line" || tool === "arrow") {
                next = {
                    ...base,
                    type: tool,
                    points: [
                        { x: point.x, y: point.y },
                        { x: point.x, y: point.y },
                    ],
                };
            } else if (
                ["rectangle", "ellipse", "diamond", "triangle"].includes(tool)
            ) {
                next = {
                    ...base,
                    type: tool,
                };
            } else {
                return;
            }

            drawingRef.current = next;
            setDraft(next);
        },
        [
            readOnly,
            getPoint,
            tool,
            findElement,
            scrollX,
            scrollY,
            color,
            strokeWidth,
            changeElements,
        ]
    );

    const handlePointerMove = useCallback(
        (event) => {
            const point = getPoint(event);

            if (!point) return;

            moveCursor(point.x, point.y);

            const current = drawingRef.current;

            if (!current) return;

            if (current.type === "eraser") {
                const target = findElement(point);

                if (target) {
                    changeElements([], [target.id]);
                }

                return;
            }

            if (current.type === "pan") {
                const previous = lastPointRef.current;

                if (!previous) return;

                const dx = point.x - previous.x;
                const dy = point.y - previous.y;

                updateViewState({
                    scrollX: current.scrollX - dx,
                    scrollY: current.scrollY - dy,
                });

                lastPointRef.current = point;
                return;
            }

            if (current.type === "move") {
                const dx = point.x - current.start.x;
                const dy = point.y - current.start.y;

                const element = current.element;

                if (element.type === "stroke") {
                    const points = getElementPoints(element).map((item) => ({
                        x: item.x + dx,
                        y: item.y + dy,
                    }));

                    setDraft({
                        ...element,
                        points,
                    });
                } else if (element.type === "line" || element.type === "arrow") {
                    const points = getElementPoints(element).map((item) => ({
                        x: item.x + dx,
                        y: item.y + dy,
                    }));

                    setDraft({
                        ...element,
                        x: (element.x || 0) + dx,
                        y: (element.y || 0) + dy,
                        points,
                    });
                } else {
                    setDraft({
                        ...element,
                        x: (element.x || 0) + dx,
                        y: (element.y || 0) + dy,
                    });
                }

                return;
            }

            updateDraft(point);
        },
        [
            getPoint,
            moveCursor,
            findElement,
            changeElements,
            updateViewState,
            updateDraft,
        ]
    );

    const finishPointer = useCallback(() => {
        const completed = drawingRef.current;

        drawingRef.current = null;
        lastPointRef.current = null;
        setDraft(null);

        if (!completed) return;

        if (completed.type === "move") {
            if (draft?.id === completed.element.id) {
                changeElements([draft], []);
            }

            return;
        }

        if (completed.type === "eraser" || completed.type === "pan") {
            return;
        }

        if (completed.type === "stroke" && completed.points.length < 2) {
            return;
        }

        if (
            ["rectangle", "ellipse", "diamond", "triangle", "line", "arrow"].includes(
                completed.type
            ) &&
            Math.abs(completed.width || 0) < 2 &&
            Math.abs(completed.height || 0) < 2
        ) {
            return;
        }

        drawElement(completed);
    }, [draft, changeElements, drawElement]);

    const handleDoubleClick = useCallback((event) => {
      if (tool !== "text") return;
  
      const point = getPoint(event);
  
      setTextEditor({
          x: point.x,
          y: point.y,
          text: "",
          fontSize: 18,
      });
  }, [tool, getPoint]);
  const handleAddText = useCallback(() => {
    if (!textEditor?.text.trim()) return;

    drawElement({
        id: makeId(),
        type: "text",
        x: textEditor.x,
        y: textEditor.y,
        text: textEditor.text.trim(),
        fontSize: Number(textEditor.fontSize) || 18,
        fontFamily: "Inter, sans-serif",
        color,
    });

    setTextEditor(null);
}, [textEditor, drawElement, color]);
    const handleWheel = useCallback(
        (event) => {
            if (readOnly) return;

            event.preventDefault();

            if (event.ctrlKey || event.metaKey) {
                const direction = event.deltaY < 0 ? 1 : -1;
                const nextZoom = Math.min(
                    3,
                    Math.max(0.25, zoom * (direction > 0 ? 1.1 : 0.9))
                );

                const point = getPoint(event);

                if (!point) return;

                const ratio = nextZoom / zoom;

                updateViewState({
                    zoom: nextZoom,
                    scrollX: point.x - (point.x - scrollX) / ratio,
                    scrollY: point.y - (point.y - scrollY) / ratio,
                });

                return;
            }

            updateViewState({
                scrollX: scrollX + event.deltaX / zoom,
                scrollY: scrollY + event.deltaY / zoom,
            });
        },
        [
            readOnly,
            zoom,
            getPoint,
            updateViewState,
            scrollX,
            scrollY,
        ]
    );

    const selectedElement = elements.find(
        (element) => element.id === selectedId
    );

    return (
        <div className="relative h-full min-h-[220px] w-full overflow-hidden rounded-md">
            <svg
                ref={svgRef}
                viewBox={`${scrollX} ${scrollY} ${viewWidth} ${viewHeight}`}
                preserveAspectRatio="xMidYMid meet"
                className={`block h-full w-full select-none ${
                    readOnly ? "cursor-default" :
                    tool === "select" ? "cursor-default" :
                    tool === "text" ? "cursor-text" :
                    "cursor-crosshair"
                }`}
                style={{
                    backgroundColor,
                    touchAction: "none",
                    userSelect: "none",
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={finishPointer}
                onPointerCancel={finishPointer}
                onLostPointerCapture={finishPointer}
                onDoubleClick={handleDoubleClick}
                onWheel={handleWheel}
            >
                <defs>
                    <marker
                        id="whiteboard-arrow"
                        markerWidth="10"
                        markerHeight="10"
                        refX="8"
                        refY="3"
                        orient="auto"
                        markerUnits="strokeWidth"
                    >
                        <path
                            d="M0,0 L0,6 L9,3 z"
                            fill={draft?.strokeColor || color}
                        />
                    </marker>
                </defs>

                {elements.map((element) =>
                    renderElement(element, element.id === selectedId)
                )}

                {draft && renderElement(draft, true)}

                {selectedElement && !draft && (
                    <rect
                        x={getElementBounds(selectedElement).x - 6}
                        y={getElementBounds(selectedElement).y - 6}
                        width={Math.max(
                            getElementBounds(selectedElement).width + 12,
                            12
                        )}
                        height={Math.max(
                            getElementBounds(selectedElement).height + 12,
                            12
                        )}
                        fill="none"
                        stroke="#0066FF"
                        strokeWidth="1.5"
                        strokeDasharray="5 4"
                        vectorEffect="non-scaling-stroke"
                        pointerEvents="none"
                    />
                )}
            </svg>
            {textEditor && (
    <div
        className="absolute inset-0 z-50 flex items-center justify-center bg-[#06182F]/50 p-4"
        onPointerDown={(event) => event.stopPropagation()}
    >
        <div className="w-full max-w-sm rounded-xl border border-[#23466F] bg-[#0B2344] p-5 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-white">
                Add Text
            </h3>

            <textarea
                autoFocus
                value={textEditor.text}
                onChange={(event) =>
                    setTextEditor((current) => ({
                        ...current,
                        text: event.target.value,
                    }))
                }
                onKeyDown={(event) => {
                    if (event.key === "Escape") setTextEditor(null);
                    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) handleAddText();
                }}
                placeholder="Write something..."
                rows={3}
                className="w-full resize-none rounded-lg border border-[#315477] bg-[#06182F] p-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-[#38BDF8]"
            />

            <div className="mt-3">
                <label className="mb-2 block text-sm text-slate-300">
                    Font Size
                </label>
                <select
                    value={textEditor.fontSize}
                    onChange={(event) =>
                        setTextEditor((current) => ({
                            ...current,
                            fontSize: Number(event.target.value),
                        }))
                    }
                    className="w-full rounded-lg border border-[#315477] bg-[#06182F] p-2.5 text-white outline-none"
                >
                    {[14, 16, 18, 20, 24, 28, 32, 40, 48].map((size) => (
                        <option key={size} value={size}>{size}px</option>
                    ))}
                </select>
            </div>

            <div className="mt-5 flex justify-end gap-3">
                <button
                    onClick={() => setTextEditor(null)}
                    className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-[#173657]"
                >
                    Cancel
                </button>
                <button
                    onClick={handleAddText}
                    disabled={!textEditor.text.trim()}
                    className="rounded-lg bg-[#0066FF] px-5 py-2 text-sm font-medium text-white hover:bg-[#0148B3] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Add Text
                </button>
            </div>
        </div>
    </div>
)}
        </div>
    );
}


import { useEffect, useRef, useState } from "react";
import {
    FiMousePointer,
    FiEdit3,
    FiMinus,
    FiSquare,
    FiCircle,
    FiType,
    FiTrash2,
    FiChevronDown,
    FiArrowUpRight,
    FiDroplet,
} from "react-icons/fi";

const toolGroups = {
    shapes: [
        { id: "rectangle", label: "Rectangle", icon: <FiSquare /> },
        { id: "ellipse", label: "Ellipse", icon: <FiCircle /> },
        { id: "diamond", label: "Diamond", icon: <span className="text-xl leading-none">◇</span> },
        { id: "triangle", label: "Triangle", icon: <span className="text-xl leading-none">△</span> },
    ],
    connectors: [
        { id: "line", label: "Line", icon: <FiMinus /> },
        { id: "arrow", label: "Arrow", icon: <FiArrowUpRight /> },
    ],
};

function ToolButton({
    active,
    onClick,
    title,
    children,
    disabled = false,
}) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            aria-pressed={Boolean(active)}
            disabled={disabled}
            onClick={onClick}
            className={`flex h-10 min-w-10 shrink-0 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                active
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-transparent text-gray-600 hover:bg-gray-100"
            }`}
        >
            {children}
        </button>
    );
}

export default function WhiteboardToolbar({
    tool,
    setTool,
    color,
    setColor,
    strokeWidth,
    setStrokeWidth,
    onClear,
    disabled = false,
}) {
    const [openGroup, setOpenGroup] = useState(null);
    const toolbarRef = useRef(null);

    useEffect(() => {
        const handlePointerDown = (event) => {
            if (
                toolbarRef.current &&
                !toolbarRef.current.contains(event.target)
            ) {
                setOpenGroup(null);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setOpenGroup(null);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const isGroupActive = (group) =>
        toolGroups[group].some((item) => item.id === tool);

    const selectTool = (toolId) => {
        setTool(toolId);
        setOpenGroup(null);
    };

    const renderGroup = (group, label) => {
        const active = isGroupActive(group);
        const selectedTool = toolGroups[group].find(
            (item) => item.id === tool
        );

        const icon = selectedTool?.icon || toolGroups[group][0].icon;

        return (
            <div className="relative shrink-0" key={group}>
                <div
                    className={`flex h-10 items-center rounded-lg border transition-colors ${
                        active
                            ? "border-blue-500 bg-blue-50 text-blue-600"
                            : "border-transparent text-gray-600 hover:bg-gray-100"
                    }`}
                >
                    <button
                        type="button"
                        title={selectedTool?.label || label}
                        aria-label={selectedTool?.label || label}
                        aria-pressed={active}
                        disabled={disabled}
                        onClick={() =>
                            selectTool(
                                selectedTool?.id ||
                                toolGroups[group][0].id
                            )
                        }
                        className="flex h-10 min-w-10 items-center justify-center pl-2 disabled:opacity-50"
                    >
                        {icon}
                    </button>

                    <button
                        type="button"
                        title={`More ${label.toLowerCase()} tools`}
                        aria-label={`More ${label.toLowerCase()} tools`}
                        aria-expanded={openGroup === group}
                        disabled={disabled}
                        onClick={() =>
                            setOpenGroup(
                                openGroup === group ? null : group
                            )
                        }
                        className="flex h-10 items-center px-1 disabled:opacity-50"
                    >
                        <FiChevronDown
                            size={14}
                            className={`transition-transform ${
                                openGroup === group ? "rotate-180" : ""
                            }`}
                        />
                    </button>
                </div>

                {openGroup === group && (
                    <div className="absolute bottom-12 left-0 z-50 flex min-w-max flex-col gap-1 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                        {toolGroups[group].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => selectTool(item.id)}
                                className={`flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                    tool === item.id
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                <span className="flex h-5 w-5 items-center justify-center">
                                    {item.icon}
                                </span>
                                {item.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const handleClear = () => {
        setOpenGroup(null);

        const confirmed = window.confirm(
            "Are you sure you want to clear the entire whiteboard? This action cannot be undone."
        );

        if (confirmed) {
            onClear?.();
        }
    };

    return (
        <div
            ref={toolbarRef}
            className="relative flex w-full items-center gap-2 overflow-x-auto border-b border-gray-200 bg-white px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
            <div className="flex shrink-0 items-center gap-1">
                <ToolButton
                    title="Select"
                    active={tool === "select"}
                    disabled={disabled}
                    onClick={() => selectTool("select")}
                >
                    <FiMousePointer size={18} />
                </ToolButton>

                <ToolButton
                    title="Pen"
                    active={tool === "pen"}
                    disabled={disabled}
                    onClick={() => selectTool("pen")}
                >
                    <FiEdit3 size={18} />
                </ToolButton>

                {renderGroup("shapes", "Shapes")}
                {renderGroup("connectors", "Connectors")}

                <ToolButton
                    title="Text"
                    active={tool === "text"}
                    disabled={disabled}
                    onClick={() => selectTool("text")}
                >
                    <FiType size={18} />
                </ToolButton>

                <ToolButton
                    title="Eraser"
                    active={tool === "eraser"}
                    disabled={disabled}
                    onClick={() => selectTool("eraser")}
                >
                    <FiDroplet size={18} />
                </ToolButton>
            </div>

            <div className="mx-1 h-7 w-px shrink-0 bg-gray-200" />

            <div className="flex shrink-0 items-center gap-2">
                <label
                    title="Stroke color"
                    className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-gray-200 ${
                        disabled ? "pointer-events-none opacity-50" : ""
                    }`}
                >
                    <span
                        className="h-6 w-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: color }}
                    />

                    <input
                        type="color"
                        value={color}
                        disabled={disabled}
                        onChange={(event) =>
                            setColor(event.target.value)
                        }
                        className="sr-only"
                        aria-label="Choose stroke color"
                    />
                </label>

                <label className="flex shrink-0 items-center gap-2 text-xs text-gray-600">
                    <span>Width</span>

                    <input
                        type="range"
                        min="1"
                        max="20"
                        step="1"
                        value={strokeWidth}
                        disabled={disabled}
                        onChange={(event) =>
                            setStrokeWidth(Number(event.target.value))
                        }
                        className="w-20 accent-blue-600 disabled:opacity-50"
                        aria-label="Stroke width"
                    />

                    <span className="w-4 text-center tabular-nums">
                        {strokeWidth}
                    </span>
                </label>
            </div>

            <div className="mx-1 h-7 w-px shrink-0 bg-gray-200" />

            <ToolButton
                title="Clear board"
                disabled={disabled}
                onClick={handleClear}
            >
                <FiTrash2 size={18} />
            </ToolButton>
        </div>
    );
}

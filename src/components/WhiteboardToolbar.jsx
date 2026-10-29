import {
  FiEdit3, FiMinus, FiSquare, FiCircle, FiType, FiDelete, FiTrash2, FiMousePointer,
} from "react-icons/fi";

const tools = [
  { id: "select", label: "Select", Icon: FiMousePointer },
  { id: "pen", label: "Pen", Icon: FiEdit3 },
  { id: "line", label: "Line", Icon: FiMinus },
  { id: "rectangle", label: "Rectangle", Icon: FiSquare },
  { id: "ellipse", label: "Ellipse", Icon: FiCircle },
  { id: "text", label: "Text", Icon: FiType },
  { id: "eraser", label: "Eraser", Icon: FiDelete },
];

export default function WhiteboardToolbar({ tool, setTool, color, setColor, strokeWidth, setStrokeWidth, onClear }) {
  return (
    <div className="flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-full border border-[#B6C6D9]/50 bg-[#253348] px-2 py-2 shadow-xl">
      {tools.map(({ id, label, Icon }) => (
        <button key={id} type="button" title={label} aria-label={label} aria-pressed={tool === id} onClick={() => setTool(id)}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition ${tool === id ? "bg-[#0066FF] text-white" : "text-[#EDEFF7] hover:bg-white/10"}`}>
          <Icon size={16} />
        </button>
      ))}
      <span className="mx-1 h-6 w-px bg-white/20" />
      <label title="Stroke color" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full hover:bg-white/10">
        <span className="h-4 w-4 rounded-full border border-white/60" style={{ backgroundColor: color }} />
        <input type="color" value={color} onChange={(event) => setColor(event.target.value)} className="sr-only" aria-label="Stroke color" />
      </label>
      <select aria-label="Stroke width" value={strokeWidth} onChange={(event) => setStrokeWidth(Number(event.target.value))}
        className="h-8 max-w-[76px] rounded-md border border-white/10 bg-[#1E293B] px-1 text-xs text-white outline-none">
        <option value={2}>Thin</option><option value={3}>Normal</option><option value={4}>Medium</option><option value={7}>Thick</option>
      </select>
      <button type="button" title="Clear whiteboard" aria-label="Clear whiteboard" onClick={onClear}
        className="flex h-8 w-8 items-center justify-center rounded-full text-[#EF4444] transition hover:bg-red-500/15">
        <FiTrash2 size={16} />
      </button>
    </div>
  );
}

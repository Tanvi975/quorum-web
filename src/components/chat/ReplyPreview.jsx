import { FiX } from "react-icons/fi";

export default function ReplyPreview({ reply, onCancel }) {
  if (!reply) return null;
  return (
    <div className="mb-2 flex items-center gap-2 rounded-lg border-l-2 border-blue-400 bg-white/5 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-blue-200">Replying to {reply.sender?.name || reply.senderName || "message"}</p>
        <p className="truncate text-[11px] text-white/75">{reply.isDeleted ? "This message was deleted" : reply.content || reply.text || (reply.fileType === "voice" ? "Voice message" : "Attachment")}</p>
      </div>
      <button type="button" onClick={onCancel} aria-label="Cancel reply" className="rounded p-1 text-white/60 hover:bg-white/10"><FiX size={14} /></button>
    </div>
  );
}

import { useEffect, useRef } from "react";
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiX, FiSend } from "react-icons/fi";

function statusValue(item, keys) {
  for (const key of keys) if (typeof item?.[key] === "boolean") return item[key];
  return null;
}

export default function ParticipantPanel({
  isOpen = false, activeTab = "participants", onTabChange = () => {}, onClose = () => {},
  participants = [], messages = [], user, isHost = false, chatInput = "", setChatInput = () => {}, onSendMessage = () => {},
}) {
  const endRef = useRef(null);
  useEffect(() => {
    if (isOpen && activeTab === "chat") endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, activeTab]);
  if (!isOpen) return null;
  const selfId = String(user?.id || user?._id || user?.userId || "");
  function send(event) {
    event.preventDefault();
    const content = chatInput.trim();
    if (!content) return;
    onSendMessage(content);
    setChatInput("");
  }
  return (
    <aside className="flex h-full min-h-0 w-[min(340px,88vw)] shrink-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0B2344] shadow-xl">
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-3">
        <div><h2 className="text-sm font-semibold">Meeting panel</h2><p className="text-[11px] text-white/50">{activeTab === "participants" ? `${participants.length} participant${participants.length === 1 ? "" : "s"}` : "Messages in this meeting"}</p></div>
        <button type="button" onClick={onClose} aria-label="Close meeting panel" className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"><FiX size={17} /></button>
      </header>
      <div className="flex shrink-0 gap-1 border-b border-white/10 p-2" role="tablist" aria-label="Meeting panel tabs">
        <button type="button" role="tab" aria-selected={activeTab === "participants"} onClick={() => onTabChange("participants")} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${activeTab === "participants" ? "bg-[#0066FF] text-white" : "text-white/65 hover:bg-white/5"}`}>Participants</button>
        <button type="button" role="tab" aria-selected={activeTab === "chat"} onClick={() => onTabChange("chat")} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${activeTab === "chat" ? "bg-[#0066FF] text-white" : "text-white/65 hover:bg-white/5"}`}>Chat</button>
      </div>
      {activeTab === "participants" ? <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {participants.length === 0 ? <p className="py-8 text-center text-xs text-white/50">No participants yet.</p> : participants.map((participant, index) => {
          const id = String(participant.userId || participant.id || participant._id || "");
          const self = Boolean(id && id === selfId);
          const name = participant.name || participant.username || (self ? "You" : "Participant");
          const muted = statusValue(participant, ["isMuted", "muted"]);
          const videoOff = statusValue(participant, ["isVideoOff", "cameraOff", "videoOff"]);
          return <div key={id || participant.peerId || `${name}-${index}`} className="flex items-center gap-3 rounded-lg bg-white/5 p-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4C698E] text-sm font-semibold">{name.trim().charAt(0).toUpperCase() || "?"}</div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{name}{self ? " (You)" : ""}</p><p className="mt-1 text-[11px] text-white/45">{participant.role || (self && isHost ? "Organizer" : "Meeting guest")}</p></div>
            <div className="flex shrink-0 items-center gap-2">{muted === true ? <FiMicOff title="Muted" className="text-red-400" size={15} /> : muted === false ? <FiMic title="Microphone on" className="text-emerald-400" size={15} /> : <span className="text-[10px] text-white/40">Mic —</span>}{videoOff === true ? <FiVideoOff title="Camera off" className="text-red-300" size={15} /> : videoOff === false ? <FiVideo title="Camera on" className="text-emerald-300" size={15} /> : <span className="text-[10px] text-white/40">Cam —</span>}</div>
          </div>;
        })}
      </div> : <>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3" aria-live="polite">
          {messages.length === 0 ? <p className="mt-8 text-center text-xs text-white/45">No messages yet. Start the conversation.</p> : messages.map((message, index) => <div key={message._id || message.id || `${message.createdAt || ""}-${index}`} className="rounded-lg bg-white/10 p-2.5"><p className="text-xs font-semibold text-blue-200">{message.name || message.senderName || message.userName || "Participant"}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm text-white">{message.content || message.message || ""}</p></div>)}
          <div ref={endRef} />
        </div>
        <form onSubmit={send} className="flex shrink-0 gap-2 border-t border-white/10 p-3"><input value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Type a message..." aria-label="Chat message" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 text-sm outline-none placeholder:text-white/35 focus:border-blue-400" /><button type="submit" disabled={!chatInput.trim()} aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"><FiSend size={16} /></button></form>
      </>}
    </aside>
  );
}

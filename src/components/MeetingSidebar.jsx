import { useEffect, useRef } from "react";
import { FiMicOff, FiVideoOff } from "react-icons/fi";

function VideoTile({ stream, name, muted, videoOff }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream || null; }, [stream]);
  return <div className="relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-[#0B2344]">
    {stream && !videoOff ? <video ref={ref} autoPlay playsInline muted={muted} className="h-full w-full object-cover" /> :
      <div className="flex h-full items-center justify-center text-lg font-semibold text-white/80">{(name || "G").trim().charAt(0).toUpperCase()}</div>}
    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/60 px-2 py-1 text-[10px] text-white">
      <span className="truncate">{name || "Guest"}</span>{muted && <FiMicOff />}{videoOff && <FiVideoOff />}
    </div>
  </div>;
}

export default function MeetingSidebar({ user, participants = [], localStream, remoteStreams = {}, isMuted, isVideoOff }) {
  const entries = Object.entries(remoteStreams);
  return <aside className="hidden w-36 shrink-0 flex-col gap-2 overflow-y-auto rounded-lg border border-white/10 bg-[#0B2344]/70 p-2 sm:flex lg:w-44">
    <p className="text-xs font-semibold text-white/70">In this call</p>
    <VideoTile stream={localStream} name={`${user?.name || user?.username || "You"} (You)`} muted videoOff={isVideoOff} />
    {entries.map(([peerId, stream]) => {
      const participant = participants.find((p) => p.userId === peerId || p.peerId === peerId);
      return <VideoTile key={peerId} stream={stream} name={participant?.name || "Guest"} muted={Boolean(participant?.isMuted)} videoOff={Boolean(participant?.isVideoOff || participant?.cameraOff)} />;
    })}
  </aside>;
}

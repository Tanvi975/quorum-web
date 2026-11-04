import { useRef, useState } from "react";
import { FiPause, FiPlay } from "react-icons/fi";

export default function VoiceMessage({ message }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const waveform = Array.isArray(message.audioWaveform) && message.audioWaveform.length ? message.audioWaveform : Array.from({ length: 36 }, (_, i) => 0.2 + ((i * 17) % 65) / 100);
  const duration = Number(message.audioDuration || 0);
  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try { await audio.play(); setPlaying(true); } catch { setPlaying(false); }
    } else { audio.pause(); setPlaying(false); }
  };
  return (
    <div className="flex min-w-[190px] max-w-[260px] items-center gap-2 rounded-lg bg-black/15 p-2">
      <audio ref={audioRef} src={message.fileUrl} onTimeUpdate={(event) => setProgress(event.currentTarget.duration ? event.currentTarget.currentTime / event.currentTarget.duration : 0)} onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)} />
      <button type="button" onClick={toggle} aria-label={playing ? "Pause voice message" : "Play voice message"} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">{playing ? <FiPause size={14} /> : <FiPlay size={14} />}</button>
      <div className="min-w-0 flex-1">
        <div className="flex h-7 items-center gap-[2px]" aria-label="Audio waveform">
          {waveform.slice(0, 64).map((height, index) => <span key={index} className={`w-[3px] rounded-full ${index / waveform.length <= progress ? "bg-blue-300" : "bg-white/55"}`} style={{ height: `${Math.max(15, Math.min(100, Number(height) * 100))}%` }} />)}
        </div>
        <p className="text-[9px] text-white/65">{duration ? `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}` : "Voice message"}</p>
      </div>
    </div>
  );
}

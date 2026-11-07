import { useEffect, useRef, useState } from "react";
import { FiMic, FiSquare, FiX } from "react-icons/fi";

export default function VoiceRecorder({ disabled, onSend, onError }) {
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(0);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const frameRef = useRef(null);
  const samplesRef = useRef([]);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!recording) return undefined;
    const interval = window.setInterval(() => setSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000)), 250);
    return () => window.clearInterval(interval);
  }, [recording]);

  const cleanup = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (audioContextRef.current && audioContextRef.current.state !== "closed") audioContextRef.current.close().catch(() => {});
    audioContextRef.current = null;
    analyserRef.current = null;
    recorderRef.current = null;
  };
  useEffect(() => () => cleanup(), []);
  const sampleWaveform = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i += 1) { const value = (data[i] - 128) / 128; sum += value * value; }
    samplesRef.current.push(Math.min(1, Math.sqrt(sum / data.length) * 3));
    frameRef.current = requestAnimationFrame(sampleWaveform);
  };
  const start = async () => {
    if (disabled || sending) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { onError?.("Voice recording is not supported by this browser."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported?.(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      samplesRef.current = [];
      cancelledRef.current = false;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        sampleWaveform();
      }
      recorder.ondataavailable = (event) => { if (event.data?.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const duration = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        const samples = samplesRef.current;
        const bucketCount = 48;
        const normalized = Array.from({ length: bucketCount }, (_, index) => {
          const startIndex = Math.floor(index * samples.length / bucketCount);
          const endIndex = Math.max(startIndex + 1, Math.floor((index + 1) * samples.length / bucketCount));
          const slice = samples.slice(startIndex, endIndex);
          return slice.length ? Math.max(0.08, Math.min(1, slice.reduce((sum, value) => sum + value, 0) / slice.length)) : 0.12;
        });
        cleanup();
        setRecording(false);
        setSeconds(duration);
        if (!cancelledRef.current) setPreview(blob.size ? { blob, duration, waveform: normalized, mimeType: blob.type } : null);
        cancelledRef.current = false;
      };
      startedAtRef.current = Date.now();
      recorder.start(250);
      setRecording(true);
    } catch (error) {
      cleanup();
      onError?.(error.name === "NotAllowedError" ? "Microphone permission was denied." : "Could not start voice recording.");
    }
  };
  const stop = () => { if (recorderRef.current?.state === "recording") recorderRef.current.stop(); };
  const cancel = () => { cancelledRef.current = true; if (recorderRef.current?.state === "recording") recorderRef.current.stop(); else cleanup(); setPreview(null); setSeconds(0); };
  const send = async () => {
    if (!preview || sending) return;
    setSending(true);
    try { await onSend(preview); setPreview(null); setSeconds(0); }
    catch { onError?.("Could not send the voice message. Please try again."); }
    finally { setSending(false); }
  };
  return (
    <div className="flex shrink-0 items-center gap-1">
      {recording ? <><span className="text-[10px] tabular-nums text-red-200">Recording {seconds}s</span><button type="button" onClick={stop} aria-label="Stop recording" className="rounded-lg p-2 text-red-200 hover:bg-white/10"><FiSquare size={15} /></button><button type="button" onClick={cancel} aria-label="Cancel recording" className="rounded-lg p-2 text-white/60 hover:bg-white/10"><FiX size={15} /></button></> : preview ? <><span className="text-[10px] text-white/75">Voice note ready · {seconds}s</span><button type="button" onClick={send} disabled={sending} className="rounded-lg bg-blue-600 px-2 py-1.5 text-[10px] text-white disabled:opacity-50">{sending ? "Sending..." : "Send"}</button><button type="button" onClick={cancel} aria-label="Discard voice message" className="rounded-lg p-2 text-white/60 hover:bg-white/10"><FiX size={15} /></button></> : <button type="button" onClick={start} disabled={disabled} aria-label="Record voice message" title="Record voice message" className="rounded-lg p-2 text-white/75 hover:bg-white/10 disabled:opacity-40"><FiMic size={15} /></button>}
    </div>
  );
}

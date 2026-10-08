import { useEffect, useRef, useState } from "react";
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiMonitor,
  FiUsers,
  FiMessageCircle,
  FiPhoneOff,
} from "react-icons/fi";

function VideoCall() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    startCamera();

    return () => {
      stopStream();
    };
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Camera/microphone permission denied:", error);
    }
  }

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  }

  function toggleMic() {
    if (!streamRef.current) return;

    const audioTrack = streamRef.current.getAudioTracks()[0];

    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
    }
  }

  function toggleCamera() {
    if (!streamRef.current) return;

    const videoTrack = streamRef.current.getVideoTracks()[0];

    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCameraOn(videoTrack.enabled);
    }
  }

  async function toggleScreenShare() {
    if (screenSharing) {
      await startCamera();
      setScreenSharing(false);
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      const screenTrack = screenStream.getVideoTracks()[0];

      if (videoRef.current) {
        videoRef.current.srcObject = screenStream;
      }

      screenTrack.onended = () => {
        startCamera();
        setScreenSharing(false);
      };

      setScreenSharing(true);
    } catch (error) {
      console.log("Screen sharing cancelled");
    }
  }

  function leaveCall() {
    stopStream();
    window.history.back();
  }

  return (
    <div className="min-h-screen bg-[#06182F] text-white flex flex-col">

      {/* Top Header */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-white/10 bg-[#071D38]">

        <div>
          <h1 className="text-base font-semibold">
            Quorum Meeting
          </h1>

          <p className="text-xs text-white/50">
            Q4 Product Sync • 45 min
          </p>
        </div>

        <div className="flex items-center gap-2">

          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center transition"
            title="Participants"
          >
            <FiUsers size={17} />
          </button>

          <button
            onClick={() => setShowChat(!showChat)}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center transition"
            title="Chat"
          >
            <FiMessageCircle size={17} />
          </button>

        </div>
      </header>

      {/* Main Meeting Area */}
      <main className="flex-1 p-4 md:p-6 relative">
  <div className="flex gap-3 h-full min-h-[520px]">

  <div
  className={`grid grid-cols-2 gap-3 h-full min-h-[520px] ${
    showChat ? "flex-1 min-w-0" : "w-full"
  }`}
>

          {/* My Video */}
          <div className="relative rounded-xl overflow-hidden bg-[#0B2344] border border-[#0B8FD8]/50">

            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${
                cameraOn ? "" : "hidden"
              }`}
            />

            {!cameraOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0B2344]">
                <div className="w-16 h-16 rounded-full bg-[#1C4D7C] flex items-center justify-center text-xl font-semibold">
                  T
                </div>
              </div>
            )}

            <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-md bg-black/60 text-xs flex items-center gap-2">
              {micOn ? <FiMic size={13} /> : <FiMicOff size={13} />}
              You
            </div>

          </div>
        

          {/* Participant 1 */}
          <div className="relative rounded-xl overflow-hidden bg-[#0B2344] border border-[#0B8FD8]/40 flex items-center justify-center">

            <div className="w-16 h-16 rounded-full bg-[#263D68] flex items-center justify-center text-lg font-semibold">
              A
            </div>

            <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-md bg-black/60 text-xs">
              Aniket
            </div>

          </div>

          {/* Participant 2 */}
          <div className="relative rounded-xl overflow-hidden bg-[#0B2344] border border-[#0B8FD8]/40 flex items-center justify-center">

            <div className="w-16 h-16 rounded-full bg-[#263D68] flex items-center justify-center text-lg font-semibold">
              S
            </div>

            <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-md bg-black/60 text-xs">
              Swasti
            </div>

          </div>
          

          {/* Waiting */}
          <div className="relative rounded-xl overflow-hidden bg-[#0B2344] border border-white/10 flex items-center justify-center">

            <div className="text-center">

              <div className="w-12 h-12 mx-auto rounded-full bg-[#12355B] flex items-center justify-center mb-3">
                <FiUsers size={20} />
              </div>

              <p className="text-sm text-white/60">
                Waiting for another participant...
              </p>

            </div>

          </div>

        </div>
      

           {/* Chat Panel */}
           {showChat && (
          <div className="w-72 shrink-0 h-full rounded-xl bg-[#0B2344] border border-white/10 shadow-xl p-4 flex flex-col">
            <h3 className="font-semibold text-sm mb-4">
              Meeting Chat
            </h3>

            <div className="flex-1 flex items-center justify-center text-xs text-white/40">
              No messages yet
            </div>

            <input
              placeholder="Type a message..."
              className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-xs outline-none placeholder:text-white/30"
            />
          </div>
        )}
          </div>

        {/* Participants Panel */}
        {showParticipants && (
          <div className="absolute top-6 right-6 w-64 rounded-xl bg-[#0B2344] border border-white/10 shadow-xl p-4 z-20">

            <h3 className="font-semibold text-sm mb-4">
              Participants
            </h3>

            <div className="space-y-3 text-sm">

              <div className="flex items-center justify-between">
                <span>Tanvi</span>
                <FiMic size={14} />
              </div>

              <div className="flex items-center justify-between">
                <span>Aniket</span>
                <FiMic size={14} />
              </div>

              <div className="flex items-center justify-between">
                <span>Swasti</span>
                <FiMicOff size={14} />
              </div>

            </div>

          </div>
        )}


      </main>

      {/* Bottom partt */}
      <footer className="h-20 border-t border-white/10 bg-[#071D38] flex items-center justify-center gap-3">

        <button
          onClick={toggleMic}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition ${
            micOn
              ? "bg-white/10 hover:bg-white/20"
              : "bg-red-500/80"
          }`}
          title={micOn ? "Mute microphone" : "Unmute microphone"}
        >
          {micOn ? <FiMic size={18} /> : <FiMicOff size={18} />}
        </button>

        <button
          onClick={toggleCamera}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition ${
            cameraOn
              ? "bg-white/10 hover:bg-white/20"
              : "bg-red-500/80"
          }`}
          title={cameraOn ? "Turn camera off" : "Turn camera on"}
        >
          {cameraOn ? <FiVideo size={18} /> : <FiVideoOff size={18} />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition ${
            screenSharing
              ? "bg-[#087FBF]"
              : "bg-white/10 hover:bg-white/20"
          }`}
          title="Share screen"
        >
          <FiMonitor size={18} />
        </button>

        <button
          onClick={() => setShowParticipants(!showParticipants)}
          className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          title="Participants"
        >
          <FiUsers size={18} />
        </button>

        <button
          onClick={() => setShowChat(!showChat)}
          className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          title="Chat"
        >
          <FiMessageCircle size={18} />
        </button>

        <button
          onClick={leaveCall}
          className="w-12 h-11 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition ml-2"
          title="Leave meeting"
        >
          <FiPhoneOff size={18} />
        </button>

      </footer>

    </div>
  );
}

export default VideoCall;
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import { useQuorumMeeting } from "../hooks/useQuorumMeeting";
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

function RemoteVideo({ stream }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
  
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
  
    const playVideo = async () => {
      try {
        await video.play();
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("Remote video playback failed:", err);
        }
      }
    };
  
    playVideo();
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="h-full w-full object-cover"
    />
  );
}


function VideoCall() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  const meetingCode = searchParams.get("code");
  const isHost = searchParams.get("host") === "1";
  
  const {
    status,
    error,
    participants,
    waitingList,
    messages,
    localStream,
    remoteStreams,
    isMuted,
    isVideoOff,
    toggleMic,
    toggleCamera,
    sendMessage,
    admitGuest,
    rejectGuest,
    leaveMeeting,
  } = useQuorumMeeting({ meetingCode, user, isHost });
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [screenSharing, setScreenSharing] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

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
    leaveMeeting();
}

  return (
    <div className="min-h-screen bg-[#06182F] text-white flex flex-col">

      {/* Top Header */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-white/10 bg-[#071D38]">

        <div>
          <h1 className="text-base font-semibold">
            Quorum Meeting
            <p className="text-xs text-white/50">
  {status}
</p>

{error && (
  <p className="text-xs text-red-400">
    {error}
  </p>
)}
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

{/* Host Waiting Room */}
{isHost && waitingList.length > 0 && (
  <div className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
    <h2 className="mb-3 text-lg font-semibold text-slate-800">
      Waiting Room ({waitingList.length})
    </h2>

    {waitingList.map((guest) => (
      <div
        key={guest.userId}
        className="mb-2 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-3"
      >
        <span className="font-medium text-slate-700">
          {guest.name || "Guest"}
        </span>

        <div className="flex gap-2">
          <button
            onClick={() => admitGuest(guest.userId)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Admit
          </button>

          <button
            onClick={() => rejectGuest(guest.userId)}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Reject
          </button>
        </div>
      </div>
    ))}
  </div>
)}


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
  className="h-full w-full object-cover"
/>

            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0B2344]">
                <div className="w-16 h-16 rounded-full bg-[#1C4D7C] flex items-center justify-center text-xl font-semibold">
                  T
                </div>
              </div>
            )}

            <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-md bg-black/60 text-xs flex items-center gap-2">
            {!isMuted ? <FiMic size={13} /> : <FiMicOff size={13} />}
              You
            </div>

          </div>
        

       
 
{/* Actual Remote Participants */}
{Object.entries(remoteStreams).map(([peerId, remoteStream]) => {
  const participant = participants.find(
    (p) =>
      p.userId === peerId ||
      p.peerId === peerId
  );

  return (
    <div
      key={peerId}
      className="relative rounded-xl overflow-hidden bg-[#0B2344] border border-[#0B8FD8]/40 flex items-center justify-center min-h-[200px]"
    >
      <RemoteVideo stream={remoteStream} />

      <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-md bg-black/60 text-xs">
      {participant?.name ||
  participants.find(
    (p) => p.userId === peerId || p.peerId === peerId
  )?.name ||
  "Guest"}
      </div>
    </div>
  );
})}

{Object.keys(remoteStreams).length === 0 && (
  <div className="relative rounded-xl overflow-hidden bg-[#0B2344] border border-white/10 flex items-center justify-center min-h-[200px]">
    <div className="text-center">
      <div className="w-12 h-12 mx-auto rounded-full bg-[#12355B] flex items-center justify-center mb-3">
        <FiUsers size={20} />
      </div>
      <p className="text-sm text-white/60">
        Waiting for another participant...
      </p>
    </div>
  </div>
)}
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
      Participants ({participants.length})
    </h3>

    <div className="space-y-3 text-sm">
      {participants.map((participant) => (
        <div
          key={participant.userId}
          className="flex items-center justify-between gap-3"
        >
          <span className="truncate">
            {participant.name || "Guest"}
            {participant.userId === user?.id ? " (You)" : ""}
          </span>

          {participant.isMuted ? (
            <FiMicOff size={14} className="shrink-0 text-red-400" />
          ) : (
            <FiMic size={14} className="shrink-0 text-green-400" />
          )}
        </div>
      ))}

      {participants.length === 0 && (
        <p className="text-xs text-white/50">
          No participants yet.
        </p>
      )}
    </div>
  </div>
)}



      </main>

      {/* Bottom partt */}
      <footer className="h-20 border-t border-white/10 bg-[#071D38] flex items-center justify-center gap-3">

        <button
          onClick={toggleMic}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition ${
            !isMuted
              ? "bg-white/10 hover:bg-white/20"
              : "bg-red-500/80"
          }`}
          title={!isMuted ? "Mute microphone" : "Unmute microphone"}
        >
          {!isMuted ? <FiMic size={18} /> : <FiMicOff size={18} />}
        </button>

        <button
          onClick={toggleCamera}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition ${
            isVideoOff
              ? "bg-white/10 hover:bg-white/20"
              : "bg-red-500/80"
          }`}
          title={isVideoOff ? "Turn camera off" : "Turn camera on"}
        >
          {isVideoOff ? <FiVideoOff size={18} /> : <FiVideo size={18} />}
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
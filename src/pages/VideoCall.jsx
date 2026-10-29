import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import { useQuorumMeeting } from "../hooks/useQuorumMeeting";
import ConfirmDialog from "../components/ConfirmDialog";
import ParticipantPanel from "../components/ParticipantPanel";
import WhiteboardWorkspace from "../components/WhiteboardWorkspace";
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiMonitor,
  FiUsers,
  FiInfo,
  FiEdit3,
  FiPhoneOff,
} from "react-icons/fi";

function RemoteVideo({ stream }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream || null;
    }
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
  const organizationId = searchParams.get("organizationId");
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

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
    replaceVideoTrack,
    sendMessage,
    admitGuest,
    rejectGuest,
    leaveMeeting,
  } = useQuorumMeeting({ meetingCode, user, isHost });

  const videoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const screenTrackRef = useRef(null);
  const chatEndRef = useRef(null);

  const [screenSharing, setScreenSharing] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [activeSideTab, setActiveSideTab] = useState("participants");
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  async function stopScreenShare() {
    const screenTrack = screenTrackRef.current;
    const cameraTrack = localStream?.getVideoTracks()[0];

    try {
      if (cameraTrack) {
        await replaceVideoTrack(cameraTrack);
      }
    } catch (error) {
      console.error("Could not restore camera track:", error);
    }

    if (screenTrack) {
      screenTrack.onended = null;
      screenTrack.stop();
    }

    screenStreamRef.current = null;
    screenTrackRef.current = null;
    setScreenSharing(false);
  }

  async function toggleScreenShare() {
    if (screenSharing) {
      await stopScreenShare();
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      const screenTrack = screenStream.getVideoTracks()[0];

      if (!screenTrack) {
        screenStream.getTracks().forEach((track) => track.stop());
        return;
      }

      await replaceVideoTrack(screenTrack);

      screenStreamRef.current = screenStream;
      screenTrackRef.current = screenTrack;

      screenTrack.onended = () => {
        stopScreenShare();
      };

      setScreenSharing(true);
    } catch (error) {
      console.error("Screen sharing could not start:", error);
    }
  }

function leaveCall() {
  if (screenTrackRef.current) {
    screenTrackRef.current.onended = null;
    screenTrackRef.current.stop();
  }

  screenStreamRef.current?.getTracks().forEach((track) => {
    track.stop();
  });

  screenTrackRef.current = null;
  screenStreamRef.current = null;

  leaveMeeting();
}
function confirmLeaveMeeting() {
  setShowLeaveDialog(false);
  leaveCall();
}

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#06182F] text-white">
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#071D38] px-3 sm:px-6">
        <div>
          <h1 className="text-base font-semibold">Quorum Meeting</h1>

          <p className="text-xs text-white/50">{status}</p>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSidePanel((open) => !open)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${
              showSidePanel ? "bg-[#0066FF] hover:bg-[#0057DB]" : "bg-white/10 hover:bg-white/20"
            }`}
            title="Open participants and chat"
            aria-label="Open participants and chat"
            aria-expanded={showSidePanel}
          >
            <FiInfo size={19} />
          </button>

          {organizationId && (
            <button
              type="button"
              onClick={() => {
                setShowWhiteboard((open) => !open);
                setShowSidePanel(false);
              }}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${
                showWhiteboard ? "bg-[#0066FF] hover:bg-[#0057DB]" : "bg-white/10 hover:bg-white/20"
              }`}
              title={showWhiteboard ? "Back to video call" : "Open whiteboard"}
              aria-label={showWhiteboard ? "Back to video call" : "Open whiteboard"}
            >
              <FiEdit3 size={18} />
            </button>
          )}
        </div>
        </header>

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
                  type="button"
                  onClick={() => admitGuest(guest.userId)}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Admit
                </button>

                <button
                  type="button"
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

      <main className="relative min-h-0 flex-1 overflow-hidden p-2 sm:p-4 md:p-6">
        {showWhiteboard && organizationId ? (
          <WhiteboardWorkspace
            meetingCode={meetingCode}
            organizationId={organizationId}
            user={user}
            isHost={isHost}
            participants={participants}
            localStream={localStream}
            remoteStreams={remoteStreams}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            onClose={() => setShowWhiteboard(false)}
          />
        ) : (
        <>
                  <div className="relative flex h-full min-h-0 min-w-0 gap-3 overflow-hidden">
              <div
                className="grid h-full min-h-0 min-w-0 flex-1 gap-2 overflow-hidden sm:gap-3"
                style={{
                  gridTemplateColumns: `repeat(${Math.ceil(
                    Math.sqrt(Object.keys(remoteStreams).length + 1)
                  )}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${Math.ceil(
                    (Object.keys(remoteStreams).length + 1) /
                      Math.ceil(Math.sqrt(Object.keys(remoteStreams).length + 1))
                  )}, minmax(0, 1fr))`,
                }}
              >
                <div className="relative overflow-hidden rounded-xl border border-[#0B8FD8]/50 bg-[#0B2344]">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />

                  {isVideoOff && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0B2344]">
                      <span className="text-3xl font-semibold">
                        {(user?.name || user?.username || "You")
                          .trim()
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md bg-black/60 px-3 py-1.5 text-xs">
                    {!isMuted ? <FiMic size={13} /> : <FiMicOff size={13} />}
                    You
                  </div>
                </div>

                {Object.entries(remoteStreams).map(([peerId, remoteStream]) => {
                  const participant = participants.find(
                    (p) => p.userId === peerId || p.peerId === peerId
                  );

                  return (
                    <div
                      key={peerId}
                      className="relative flex min-h-[200px] items-center justify-center overflow-hidden rounded-xl border border-[#0B8FD8]/40 bg-[#0B2344]"
                    >
                      <RemoteVideo stream={remoteStream} />

                      {(participant?.isVideoOff || participant?.cameraOff) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#0B2344]">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1C4D7C] text-2xl font-semibold">
                            {(participant?.name || "Guest")
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        </div>
                      )}

                      <div className="absolute bottom-3 left-3 rounded-md bg-black/60 px-3 py-1.5 text-xs">
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
                  <div className="relative flex min-h-[200px] items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#0B2344]">
                    <div className="text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#12355B]">
                        <FiUsers size={20} />
                      </div>

                      <p className="text-sm text-white/60">
                        Waiting for another participant...
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <ParticipantPanel
                isOpen={showSidePanel}
                activeTab={activeSideTab}
                onTabChange={setActiveSideTab}
                onClose={() => setShowSidePanel(false)}
                participants={participants}
                messages={messages}
                user={user}
                isHost={isHost}
                chatInput={chatInput}
                setChatInput={setChatInput}
                onSendMessage={(content) => sendMessage(content)}
              />
            </div>
        </>
        )}
      </main>

      <footer className="flex h-20 shrink-0 items-center justify-center gap-2 border-t border-white/10 bg-[#071D38] px-2 sm:gap-3">
        <button
          type="button"
          onClick={toggleMic}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
          title={!isMuted ? "Mute microphone" : "Unmute microphone"}
          aria-label={!isMuted ? "Mute microphone" : "Unmute microphone"}
        >
          {!isMuted ? <FiMic size={18} /> : <FiMicOff size={18} />}
        </button>

        <button
          type="button"
          onClick={toggleCamera}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
          title={isVideoOff ? "Turn camera on" : "Turn camera off"}
          aria-label={isVideoOff ? "Turn camera on" : "Turn camera off"}
        >
          {isVideoOff ? <FiVideoOff size={18} /> : <FiVideo size={18} />}
        </button>

        <button
          type="button"
          onClick={toggleScreenShare}
          className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
            screenSharing
              ? "bg-[#0066FF] hover:bg-[#0055DD]"
              : "bg-white/10 hover:bg-white/20"
          }`}
          title={screenSharing ? "Stop sharing screen" : "Share screen"}
          aria-label={screenSharing ? "Stop sharing screen" : "Share screen"}
        >
          <FiMonitor size={18} />
        </button>



        <button
          type="button"
          onClick={() => setShowLeaveDialog(true)}
          className="ml-2 flex h-11 w-12 items-center justify-center rounded-full bg-red-500 transition hover:bg-red-600"
          title="Leave meeting"
          aria-label="Leave meeting"
        >
          <FiPhoneOff size={18} />
        </button>
      </footer>
      <ConfirmDialog
  open={showLeaveDialog}
  type="leave"
  title="Leave meeting?"
  message="Are you sure you want to leave this meeting?"
  confirmText="Leave meeting"
  cancelText="Stay in meeting"
  onConfirm={confirmLeaveMeeting}
  onCancel={() => setShowLeaveDialog(false)}
/>
    </div>
  );
}

export default VideoCall;
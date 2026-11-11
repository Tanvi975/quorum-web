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
  FiMessageCircle,
  FiEdit3,
  FiPhoneOff,
  FiSmile,
} from "react-icons/fi";

function RemoteVideo({ stream }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.srcObject = stream || null;

    if (stream) {
      const playPromise = video.play();
      if (playPromise?.catch) playPromise.catch(() => {});
    }

    return () => {
      if (video) video.srcObject = null;
    };
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
function getParticipantPhoto(person) {
  const photo =
    person?.profilePicture?.url ||
    person?.profilePicture ||
    person?.avatar?.url ||
    person?.avatar ||
    person?.avatarUrl ||
    person?.profileImage ||
    person?.profileImageUrl ||
    person?.imageUrl ||
    person?.photoUrl ||
    person?.photo;

  return typeof photo === "string" ? photo : "";
}
function VideoCall() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const meetingCode = searchParams.get("code");
  const meetingLink = window.location.href;
  const isHostFromUrl = searchParams.get("host") === "1";
  const organizationId = searchParams.get("organizationId");
  const whiteboardEnabled = searchParams.get("whiteboard") === "1";
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [activeSideTab, setActiveSideTab] = useState("participants");
  const [chatInput, setChatInput] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showPolls, setShowPolls] = useState(false);
const [pollQuestion, setPollQuestion] = useState("");
const [pollOptions, setPollOptions] = useState(["", ""]);

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
    reactions,
    isHandRaised,
    sendReaction,
    toggleHand,
    toggleMic,
    toggleCamera,
    replaceVideoTrack,
    sendMessage,
    admitGuest,
    rejectGuest,
    leaveMeeting,
    isHost,
    polls,
sendPollEvent,
  } = useQuorumMeeting({
    meetingCode,
    user,
    isHost: isHostFromUrl,
  });

  const videoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const screenTrackRef = useRef(null);
  const chatEndRef = useRef(null);
  const previousMessageCount = useRef(messages.length);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const added = Math.max(
      0,
      messages.length - previousMessageCount.current
    );

    previousMessageCount.current = messages.length;

    if (added && !(showSidePanel && activeSideTab === "chat")) {
      setUnreadMessages((count) => count + added);
    }
  }, [messages, showSidePanel, activeSideTab]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.srcObject = localStream || null;

    if (localStream) {
      const playPromise = video.play();
      if (playPromise?.catch) playPromise.catch(() => {});
    }
  }, [localStream, showWhiteboard]);

  useEffect(() => {
    return () => {
      if (screenTrackRef.current) {
        screenTrackRef.current.onended = null;
        screenTrackRef.current.stop();
      }

      screenStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      screenTrackRef.current = null;
      screenStreamRef.current = null;
    };
  }, []);

  function openMeetingPanel(tab) {
    setActiveSideTab(tab);
    setShowSidePanel(true);

    if (tab === "chat") {
      setUnreadMessages(0);
    }
  }

  async function stopScreenShare() {
    const screenTrack = screenTrackRef.current;
    const cameraTrack = localStream?.getVideoTracks()[0];

    if (!screenTrack && !screenSharing) return;

    screenTrackRef.current = null;
    screenStreamRef.current = null;
    setScreenSharing(false);

    if (screenTrack) {
      screenTrack.onended = null;
    }

    try {
      if (cameraTrack) {
        await replaceVideoTrack(cameraTrack);
      }
    } catch (error) {
      console.error("Could not restore camera track:", error);
    }

    if (screenTrack && screenTrack.readyState !== "ended") {
      screenTrack.stop();
    }
  }

  async function toggleScreenShare() {
    if (screenSharing) {
      await stopScreenShare();
      return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      console.error("Screen sharing is not supported in this browser.");
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

      try {
        await replaceVideoTrack(screenTrack);
      } catch (error) {
        screenStream.getTracks().forEach((track) => track.stop());
        throw error;
      }

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
  function createPoll() {
    const question = pollQuestion.trim();
    const options = pollOptions
        .map((option) => option.trim())
        .filter(Boolean);

    if (!question || options.length < 2) return;

    const poll = {
        id: `${user?.id || "user"}-${Date.now()}`,
        question,
        options,
        createdBy: user?.id,
        createdByName: user?.name || "Host",
        votes: {},
        closed: false,
    };

    sendPollEvent({ type: "create", poll });

    setPollQuestion("");
    setPollOptions(["", ""]);
}

function voteInPoll(poll, optionIndex) {
    if (
        poll.closed ||
        Object.prototype.hasOwnProperty.call(
            poll.votes || {},
            user?.id
        )
    ) return;

    sendPollEvent({
        type: "vote",
        pollId: poll.id,
        optionIndex,
    });
}

function closePoll(pollId) {
    sendPollEvent({
        type: "close",
        pollId,
    });
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
    setScreenSharing(false);

    leaveMeeting();
  }

  function confirmLeaveMeeting() {
    setShowLeaveDialog(false);
    leaveCall();
  }

  const remoteEntries = Object.entries(remoteStreams || {});
  const totalVideoTiles = remoteEntries.length + 1;
  const gridColumns = Math.ceil(Math.sqrt(totalVideoTiles));
  const gridRows = Math.ceil(totalVideoTiles / gridColumns);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#06182F] text-white">
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#071D38] px-3 sm:px-6">
        <div className="min-w-0">
          <h1 className="text-base font-semibold">Quorum Meeting</h1>
          <p className="text-xs text-white/50">{status}</p>

          {error && (
            <p className="max-w-[65vw] truncate text-xs text-red-400">
              {error}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSidePanel((open) => !open)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${
              showSidePanel
                ? "bg-[#0066FF] hover:bg-[#0057DB]"
                : "bg-white/10 hover:bg-white/20"
            }`}
            title="Open participants and chat"
            aria-label="Open participants and chat"
            aria-expanded={showSidePanel}
          >
            <FiInfo size={19} />
          </button>

          {meetingCode && whiteboardEnabled && (
  <button
    type="button"
    onClick={() => setShowWhiteboard((open) => !open)}
    className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${
      showWhiteboard
        ? "bg-[#0066FF] hover:bg-[#0057DB]"
        : "bg-white/10 hover:bg-white/20"
    }`}
    title={showWhiteboard ? "Back to video call" : "Open whiteboard"}
    aria-label={
      showWhiteboard ? "Back to video call" : "Open whiteboard"
    }
    aria-pressed={showWhiteboard}
  >
    <FiEdit3 size={18} />
  </button>
)}
        </div>
      </header>

      {isHost && waitingList.length > 0 && (
        <div className="mx-4 mt-4 max-h-48 shrink-0 overflow-y-auto rounded-xl border border-amber-200 bg-amber-50 p-4">
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

<main
  className={`relative min-h-0 flex-1 overflow-hidden ${
    showWhiteboard ? "p-1" : "p-2 sm:p-4 md:p-6"
  }`}
>
        {showWhiteboard && meetingCode ? (
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
          <div className="relative flex h-full min-h-0 min-w-0 gap-3 overflow-hidden">
            <div
              className="grid h-full min-h-0 min-w-0 flex-1 gap-2 overflow-hidden sm:gap-3"
              style={{
                gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`,
              }}
            >
              <div className="relative min-h-0 min-w-0 overflow-hidden rounded-xl border border-[#0B8FD8]/50 bg-[#0B2344]">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />
{isVideoOff && (
  <div className="absolute inset-0 flex items-center justify-center bg-[#0B2344]">
    {getParticipantPhoto(user) ? (
     <img
     src={getParticipantPhoto(user)}
     alt={user?.name || "Your profile"}
     className="h-28 w-28 rounded-full border-2 border-white/20 object-cover"
   />
    ) : (
      <span className="text-3xl font-semibold">
        {(user?.name || user?.username || "You")
          .trim()
          .charAt(0)
          .toUpperCase()}
      </span>
    )}
  </div>
)}

                <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md bg-black/60 px-3 py-1.5 text-xs">
                  {!isMuted ? <FiMic size={13} /> : <FiMicOff size={13} />}
                  You
                </div>
                {isHandRaised && (
    <div className="absolute right-3 top-3 rounded-full bg-amber-500 px-3 py-1 text-sm">
        ✋ Hand Raised
    </div>
)}

{reactions
    .filter((reaction) => String(reaction.userId) === String(user?.id))
    .map((reaction) => (
        <div
            key={reaction.id}
            className="pointer-events-none absolute right-1/2 top-1/3 z-20 text-5xl"
            style={{
                animation: "quorum-reaction-float 1.8s ease-out forwards",
            }}
        >
            {reaction.emoji}
        </div>
    ))}
              </div>

              {remoteEntries.map(([peerId, remoteStream]) => {
                const participant = participants.find(
                  (person) =>
                    person.userId === peerId || person.peerId === peerId
                );

                return (
                  <div
                    key={peerId}
                    className="relative flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-xl border border-[#0B8FD8]/40 bg-[#0B2344]"
                  >
                    <RemoteVideo stream={remoteStream} />
                    {(participant?.isVideoOff || participant?.cameraOff) && (
  <div className="absolute inset-0 flex items-center justify-center bg-[#0B2344]">
    {getParticipantPhoto(participant) ? (
      <img
  src={getParticipantPhoto(participant)}
  alt={participant?.name || "Participant"}
  className="h-28 w-28 rounded-full border-2 border-white/20 object-cover"
/>
    ) : (
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1C4D7C] text-2xl font-semibold">
        {(participant?.name || "Guest")
          .trim()
          .charAt(0)
          .toUpperCase()}
      </div>
    )}
  </div>
)}

                    <div className="absolute bottom-3 left-3 rounded-md bg-black/60 px-3 py-1.5 text-xs">
                      {participant?.name || "Guest"}
                    </div>
                    {participant?.isHandRaised && (
    <div className="absolute right-3 top-3 rounded-full bg-amber-500 px-3 py-1 text-sm">
        ✋ Hand Raised
    </div>
)}

{reactions
    .filter(
        (reaction) =>
            String(reaction.userId) === String(participant?.userId)
    )
    .map((reaction) => (
        <div
            key={reaction.id}
            className="pointer-events-none absolute right-1/2 top-1/3 z-20 text-5xl"
            style={{
                animation: "quorum-reaction-float 1.8s ease-out forwards",
            }}
        >
            {reaction.emoji}
        </div>
    ))}
                  </div>
                );
              })}

              {remoteEntries.length === 0 && (
                <div className="relative flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#0B2344]">
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
          </div>
        )}

        <div
          className={`absolute inset-y-2 right-2 z-40 sm:inset-y-4 sm:right-4 ${
            showSidePanel ? "block" : "hidden"
          }`}
        >
        <ParticipantPanel
  isOpen={showSidePanel}
  activeTab={activeSideTab}
  onTabChange={openMeetingPanel}
  onClose={() => setShowSidePanel(false)}
  participants={participants}
  messages={messages}
  user={user}
  isHost={isHost}
  chatInput={chatInput}
  setChatInput={setChatInput}
  onSendMessage={(content) => sendMessage(content)}
  meetingCode={meetingCode}
  meetingLink={meetingLink}
/>
        </div>
      </main>

      <footer className={`flex shrink-0 items-center justify-center gap-2 border-t border-white/10 bg-[#071D38] px-2 sm:gap-3 ${
  showWhiteboard ? "h-16" : "min-h-20 flex-wrap py-3"
}`}>
  <button
    type="button"
    onClick={() => setShowPolls(true)}
    className="relative flex h-11 items-center gap-2 rounded-full bg-white/10 px-4 text-sm hover:bg-white/20"
>
    <span>📊</span>

    {polls.length > 0 && (
        <span className="rounded-full bg-sky-500 px-2 py-0.5 text-xs">
            {polls.length}
        </span>
    )}
</button>
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
        <div className="relative">
    <button
        type="button"
        onClick={() => setShowReactions((previous) => !previous)}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl transition hover:bg-white/20"
        title="Reactions"
        aria-label="Open reactions"
    >
        <FiSmile size={22} />
    </button>

    {showReactions && (
        <div className="absolute bottom-14 left-1/2 z-50 flex -translate-x-1/2 gap-2 rounded-xl border border-white/20 bg-[#0B2344] p-3 shadow-xl">
            {["👍", "👏", "❤️", "🎉", "😂", "🔥"].map((emoji) => (
                <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                        sendReaction(emoji);
                        setShowReactions(false);
                    }}
                    className="rounded-lg p-2 text-2xl transition hover:bg-white/20"
                    aria-label={`Send ${emoji} reaction`}
                >
                    {emoji}
                </button>
            ))}
        </div>
    )}
</div>

<button
    type="button"
    onClick={toggleHand}
    className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
        isHandRaised
            ? "bg-amber-500 hover:bg-amber-600"
            : "bg-white/10 hover:bg-white/20"
    }`}
    title={isHandRaised ? "Lower hand" : "Raise hand"}
    aria-label={isHandRaised ? "Lower hand" : "Raise hand"}
    aria-pressed={isHandRaised}
>
    ✋
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
          aria-pressed={screenSharing}
        >
          <FiMonitor size={18} />
        </button>

        <button
          type="button"
          onClick={() => openMeetingPanel("participants")}
          className={`relative flex h-11 w-11 items-center justify-center rounded-full transition ${
            showSidePanel && activeSideTab === "participants"
              ? "bg-[#0066FF]"
              : "bg-white/10 hover:bg-white/20"
          }`}
          title="Participants"
          aria-label={`Participants, ${participants.length} in meeting`}
        >
          <FiUsers size={18} />
        </button>

        <button
          type="button"
          onClick={() => openMeetingPanel("chat")}
          className={`relative flex h-11 w-11 items-center justify-center rounded-full transition ${
            showSidePanel && activeSideTab === "chat"
              ? "bg-[#0066FF]"
              : "bg-white/10 hover:bg-white/20"
          }`}
          title="Meeting chat"
          aria-label={
            unreadMessages
              ? `Meeting chat, ${unreadMessages} unread messages`
              : "Meeting chat"
          }
        >
          <FiMessageCircle size={18} />

          {unreadMessages > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
              {unreadMessages > 99 ? "99+" : unreadMessages}
            </span>
          )}
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
      {showPolls && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
        <section className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 bg-[#0B2344] p-5 text-white shadow-2xl">

            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                    Live meeting polls
                </h2>

                <button
                    onClick={() => setShowPolls(false)}
                    className="rounded-lg px-3 py-1 text-white/70 hover:bg-white/10"
                >
                    ✕
                </button>
            </div>

            {isHost && (
                <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-4">
                    <h3 className="mb-3 text-sm font-semibold">
                        Create a poll
                    </h3>

                    <input
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        placeholder="Ask a question..."
                        className="mb-3 w-full rounded-lg border border-white/15 bg-[#071D38] px-3 py-2 text-sm"
                    />

                    {pollOptions.map((option, index) => (
                        <div key={index} className="mb-2 flex gap-2">
                            <input
                                value={option}
                                onChange={(e) =>
                                    setPollOptions((prev) =>
                                        prev.map((item, i) =>
                                            i === index ? e.target.value : item
                                        )
                                    )
                                }
                                placeholder={`Option ${index + 1}`}
                                className="min-w-0 flex-1 rounded-lg border border-white/15 bg-[#071D38] px-3 py-2 text-sm"
                            />

                            {pollOptions.length > 2 && (
                                <button
                                    onClick={() =>
                                        setPollOptions((prev) =>
                                            prev.filter((_, i) => i !== index)
                                        )
                                    }
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}

                    <div className="mt-3 flex flex-wrap gap-2">
                        <button
                            onClick={() =>
                                setPollOptions((prev) => [...prev, ""])
                            }
                            className="rounded-lg border border-white/20 px-3 py-2 text-xs"
                        >
                            + Add option
                        </button>

                        <button
                            onClick={createPoll}
                            disabled={
                                !pollQuestion.trim() ||
                                pollOptions.filter((x) => x.trim()).length < 2
                            }
                            className="ml-auto rounded-lg bg-sky-600 px-4 py-2 text-sm disabled:opacity-40"
                        >
                            Launch poll
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {polls.length === 0 ? (
                    <p className="py-6 text-center text-sm text-white/50">
                        No polls yet. The host can create the first poll.
                    </p>
                ) : (
                    polls.slice().reverse().map((poll) => {
                        const votes = poll.votes || {};
                        const voteCount = Object.keys(votes).length;
                        const myVote = votes[user?.id];

                        return (
                            <article
                                key={poll.id}
                                className="rounded-xl border border-white/10 bg-white/5 p-4"
                            >
                                <div className="mb-1 flex justify-between gap-3">
                                    <h3 className="font-medium">
                                        {poll.question}
                                    </h3>

                                    <span className="text-xs text-white/50">
                                        {poll.closed ? "Closed" : "Live"}
                                    </span>
                                </div>

                                <p className="mb-3 text-xs text-white/45">
                                    By {poll.createdByName || "Host"} · {voteCount} votes
                                </p>

                                <div className="space-y-2">
                                    {poll.options.map((option, index) => {
                                        const count = Object.values(votes)
                                            .filter((v) => v === index).length;

                                        const percent = voteCount
                                            ? Math.round((count / voteCount) * 100)
                                            : 0;

                                        return (
                                            <button
                                                key={index}
                                                disabled={
                                                    poll.closed ||
                                                    myVote !== undefined
                                                }
                                                onClick={() =>
                                                    voteInPoll(poll, index)
                                                }
                                                className="relative w-full overflow-hidden rounded-lg border border-white/10 px-3 py-2 text-left text-sm disabled:cursor-default"
                                            >
                                                <span
                                                    className="absolute inset-y-0 left-0 bg-sky-500/20"
                                                    style={{ width: `${percent}%` }}
                                                />

                                                <span className="relative flex justify-between">
                                                    <span>{option}</span>
                                                    <span>
                                                        {voteCount ? `${percent}%` : "Vote"}
                                                    </span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {isHost && !poll.closed && (
                                    <button
                                        onClick={() => closePoll(poll.id)}
                                        className="mt-3 text-xs text-rose-300"
                                    >
                                        Close poll
                                    </button>
                                )}
                            </article>
                        );
                    })
                )}
            </div>
        </section>
    </div>
)}
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
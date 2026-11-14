import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import { useQuorumMeeting } from "../hooks/useQuorumMeeting";
import ConfirmDialog from "../components/ConfirmDialog";
import ParticipantPanel from "../components/ParticipantPanel";
import WhiteboardWorkspace from "../components/WhiteboardWorkspace";
import {
  getRecordingUploadUrl,
  completeRecording,
} from "../services/recordingService";
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

function RemoteVideo({ stream, fit = "cover" }) {
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
      className={`h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"}`}
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
  const meetingLink = new URL(
    window.location.pathname + window.location.search,
    "https://meet.newquorum.me"
  ).toString();
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
    screenSharerPeerId,
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
    endMeeting,
    isHost,
    polls,
sendPollEvent,
emitMeetingEvent,
subscribeToRecordingStatus,
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
  const mediaRecorderRef = useRef(null);
const recordingChunksRef = useRef([]);
const recordingIdRef = useRef(null);
const recordingStartedAtRef = useRef(null);
const recordingOwnerRef = useRef(false);

const [isRecording, setIsRecording] = useState(false);
const [isUploadingRecording, setIsUploadingRecording] = useState(false);
const [recordingMessage, setRecordingMessage] = useState("");
useEffect(() => {
  const unsubscribe = subscribeToRecordingStatus((data) => {
    if (!data || data.meetingCode !== meetingCode) return;

    setIsRecording(Boolean(data.isRecording));

    if (data.isRecording) {
      setRecordingMessage(
        `${data.startedBy?.name || "A participant"} started recording.`
      );
    } else if (data.status === "PROCESSING") {
      setRecordingMessage("Recording stopped. Video is processing...");
    }
  });

  return unsubscribe;
}, [subscribeToRecordingStatus, meetingCode]);
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

    if (!window.isSecureContext) {
      window.alert("Screen sharing ke liye HTTPS connection zaroori hai.");
      return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      window.alert(
        "Is mobile browser mein website screen sharing supported nahi hai. Android par latest Chrome try karein; iPhone/iPad Safari mein browser screen capture available nahi hota."
      );
      return;
    }

    try {
      // Must run directly from the Share button click. Mobile browsers may show
      // their own OS-level screen/broadcast picker.
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 15, max: 30 } },
        audio: false,
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
      if (error?.name === "NotAllowedError") {
        window.alert("Screen sharing permission cancel ya deny ho gayi.");
      } else if (error?.name === "NotSupportedError" || error?.name === "AbortError") {
        window.alert("Is device/browser par screen sharing available nahi hai.");
      } else {
        window.alert(error?.message || "Screen sharing start nahi ho paayi.");
      }
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

function buildRecordingStream() {
  const tracks = [];
  const seenTrackIds = new Set();

  const addStream = (stream) => {
    if (!stream) return;

    stream.getTracks().forEach((track) => {
      if (track.readyState === "live" && !seenTrackIds.has(track.id)) {
        seenTrackIds.add(track.id);
        tracks.push(track);
      }
    });
  };

  addStream(localStream);

  Object.values(remoteStreams || {}).forEach(addStream);

  // Include the local screen share as well.
  addStream(screenStreamRef.current);

  if (!tracks.length) {
    throw new Error("No live audio/video tracks are available to record.");
  }

  return new MediaStream(tracks);
}

async function startCallRecording() {
  if (!isHost) {
    setRecordingMessage("Only the meeting host can start a recording.");
    return;
  }

  if (isRecording || mediaRecorderRef.current) return;

  try {
    if (!window.MediaRecorder) {
      throw new Error("Recording is not supported in this browser.");
    }

    const stream = buildRecordingStream();

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
      ? "video/webm;codecs=vp8,opus"
      : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "";

    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    // Backend currently presigns the upload for Content-Type video/mp4.
    // Keep the filename extension aligned with the actual WebM container.
    const extension = recorder.mimeType.includes("webm") ? "webm" : "mp4";

    const started = await emitMeetingEvent("meeting:start-recording");

    const newRecordingId = started?.id || started?.recordingId;

    if (!newRecordingId) {
      throw new Error("Backend did not return a recording ID.");
    }

    recordingIdRef.current = newRecordingId;
    recordingStartedAtRef.current = Date.now();
    recordingOwnerRef.current = true;
    recordingChunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordingChunksRef.current.push(event.data);
      }
    };

    recorder.onerror = (event) => {
      console.error("MediaRecorder error:", event.error);
      setRecordingMessage("Recording encountered an error.");
    };

    recorder.start(1000);
    mediaRecorderRef.current = recorder;

    setIsRecording(true);
    setRecordingMessage("Recording is live.");
  } catch (err) {
    console.error("Could not start recording:", err);
    setRecordingMessage(err.message || "Could not start recording.");
    recordingOwnerRef.current = false;
  }
}

async function stopCallRecording() {
  if (!recordingOwnerRef.current || !mediaRecorderRef.current) return;

  setIsUploadingRecording(true);
  setRecordingMessage("Finalizing recording...");

  try {
    const recorder = mediaRecorderRef.current;

    const videoBlob = await new Promise((resolve, reject) => {
      recorder.addEventListener(
        "stop",
        () => {
          const blob = new Blob(recordingChunksRef.current, {
            type: recorder.mimeType || "video/webm",
          });

          resolve(blob);
        },
        { once: true }
      );

      recorder.addEventListener(
        "error",
        (event) => reject(event.error || new Error("Recording failed.")),
        { once: true }
      );

      if (recorder.state !== "inactive") {
        recorder.stop();
      } else {
        resolve(
          new Blob(recordingChunksRef.current, {
            type: recorder.mimeType || "video/webm",
          })
        );
      }
    });

    mediaRecorderRef.current = null;

    if (!videoBlob.size) {
      throw new Error("The recording file is empty.");
    }

    const recordingId = recordingIdRef.current;

    if (!recordingId) {
      throw new Error("Recording ID is missing.");
    }

    // Tell the backend that the recording has stopped.
    await emitMeetingEvent("meeting:stop-recording");

    setIsRecording(false);
    setRecordingMessage("Uploading recording...");

    const extension = videoBlob.type.includes("webm") ? "webm" : "mp4";
    const fileName = `${meetingCode}-${Date.now()}.${extension}`;

    const uploadData = await getRecordingUploadUrl(meetingCode, fileName);

    if (!uploadData?.uploadUrl || !uploadData?.fileUrl) {
      throw new Error("Backend did not return a valid S3 upload URL.");
    }

    const uploadResponse = await fetch(uploadData.uploadUrl, {
      method: "PUT",
      headers: {
        // Required by the current backend's presigned URL signature.
        "Content-Type": "video/mp4",
      },
      body: videoBlob,
    });

    if (!uploadResponse.ok) {
      throw new Error(`S3 upload failed (${uploadResponse.status}).`);
    }

    const durationSeconds = Math.max(
      1,
      Math.round((Date.now() - recordingStartedAtRef.current) / 1000)
    );

    await completeRecording(recordingId, {
      fileUrl: uploadData.fileUrl,
      durationSeconds,
      fileSizeBytes: videoBlob.size,
    });

    setRecordingMessage("Recording uploaded successfully.");
  } catch (err) {
    console.error("Recording upload failed:", err);
    setRecordingMessage(
      err.response?.data?.message || err.message || "Recording upload failed."
    );
  } finally {
    recordingChunksRef.current = [];
    recordingIdRef.current = null;
    recordingStartedAtRef.current = null;
    recordingOwnerRef.current = false;
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setIsUploadingRecording(false);
  }
}

async function leaveCall() {
  if (recordingOwnerRef.current && mediaRecorderRef.current) {
    await stopCallRecording();
  }

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

async function confirmLeaveMeeting() {
  setShowLeaveDialog(false);
  await leaveCall();
}
async function confirmEndMeeting() {
  setShowLeaveDialog(false);

  if (recordingOwnerRef.current && mediaRecorderRef.current) {
    await stopCallRecording();
  }

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

  endMeeting();
}
  const remoteEntries = Object.entries(remoteStreams || {});
  const featuredPeerId = screenSharerPeerId;
  const isLocalScreenFeatured = Boolean(
    screenSharing && (!featuredPeerId || String(featuredPeerId) === String(user?.id))
  );
  const featuredRemoteStream = featuredPeerId && !isLocalScreenFeatured
    ? remoteStreams?.[featuredPeerId]
    : null;
  const hasFeaturedScreen = Boolean(
    (isLocalScreenFeatured && screenStreamRef.current) || featuredRemoteStream
  );
  const thumbnailEntries = remoteEntries.filter(
    ([peerId]) => !hasFeaturedScreen || String(peerId) !== String(featuredPeerId)
  );

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
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden">
            {hasFeaturedScreen ? (
              <>
                <section className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-xl border border-[#0B8FD8]/50 bg-black">
                  {isLocalScreenFeatured ? (
                    <video
                      key="local-featured-screen"
                      autoPlay
                      muted
                      playsInline
                      ref={(node) => {
                        if (node && screenStreamRef.current && node.srcObject !== screenStreamRef.current) {
                          node.srcObject = screenStreamRef.current;
                          node.play().catch(() => {});
                        }
                      }}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <RemoteVideo stream={featuredRemoteStream} fit="contain" />
                  )}
                  <div className="absolute bottom-3 left-3 rounded-md bg-black/70 px-3 py-1.5 text-xs">
                    {isLocalScreenFeatured ? "You · Presenting" : `${participants.find((p) => String(p.userId) === String(featuredPeerId) || String(p.peerId) === String(featuredPeerId))?.name || "Participant"} · Presenting`}
                  </div>
                  <div className="absolute right-3 top-3 rounded-full bg-[#0066FF] px-3 py-1 text-xs font-medium">
                    Screen sharing
                  </div>
                </section>

                <div className="flex h-24 shrink-0 gap-2 overflow-x-auto pb-1 sm:h-28">
                  <div className="relative h-full w-32 shrink-0 overflow-hidden rounded-lg border border-white/15 bg-[#0B2344] sm:w-40">
                    <video ref={(node) => {
                      if (node && localStream && node.srcObject !== localStream) {
                        node.srcObject = localStream;
                        node.play().catch(() => {});
                      }
                    }} autoPlay muted playsInline className="h-full w-full object-cover" />
                    <span className="absolute bottom-1 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px]">You</span>
                  </div>
                  {thumbnailEntries.map(([peerId, stream]) => {
                    const person = participants.find((p) => String(p.userId) === String(peerId) || String(p.peerId) === String(peerId));
                    return (
                      <div key={peerId} className="relative h-full w-32 shrink-0 overflow-hidden rounded-lg border border-white/15 bg-[#0B2344] sm:w-40">
                        <RemoteVideo stream={stream} />
                        <span className="absolute bottom-1 left-2 max-w-[90%] truncate rounded bg-black/60 px-2 py-0.5 text-[10px]">{person?.name || "Guest"}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div
                className="grid h-full min-h-0 min-w-0 flex-1 gap-2 overflow-hidden sm:gap-3"
                style={{
                  gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(remoteEntries.length + 1))}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${Math.ceil((remoteEntries.length + 1) / Math.ceil(Math.sqrt(remoteEntries.length + 1)))}, minmax(0, 1fr))`,
                }}
              >
                <div className="relative min-h-0 min-w-0 overflow-hidden rounded-xl border border-[#0B8FD8]/50 bg-[#0B2344]">
                  <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                  {isVideoOff && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0B2344]">
                      {getParticipantPhoto(user) ? (
                        <img src={getParticipantPhoto(user)} alt={user?.name || "Your profile"} className="h-28 w-28 rounded-full border-2 border-white/20 object-cover" />
                      ) : (
                        <span className="text-3xl font-semibold">{(user?.name || user?.username || "You").trim().charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md bg-black/60 px-3 py-1.5 text-xs">
                    {!isMuted ? <FiMic size={13} /> : <FiMicOff size={13} />} You
                  </div>
                  {isHandRaised && <div className="absolute right-3 top-3 rounded-full bg-amber-500 px-3 py-1 text-sm">✋ Hand Raised</div>}
                  {reactions.filter((r) => String(r.userId) === String(user?.id)).map((r) => (
                    <div key={r.id} className="pointer-events-none absolute right-1/2 top-1/3 z-20 text-5xl" style={{ animation: "quorum-reaction-float 1.8s ease-out forwards" }}>{r.emoji}</div>
                  ))}
                </div>
                {remoteEntries.map(([peerId, remoteStream]) => {
                  const participant = participants.find((person) => String(person.userId) === String(peerId) || String(person.peerId) === String(peerId));
                  return (
                    <div key={peerId} className="relative flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-xl border border-[#0B8FD8]/40 bg-[#0B2344]">
                      <RemoteVideo stream={remoteStream} />
                      {(participant?.isVideoOff || participant?.cameraOff) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#0B2344]">
                          {getParticipantPhoto(participant) ? (
                            <img src={getParticipantPhoto(participant)} alt={participant?.name || "Participant"} className="h-28 w-28 rounded-full border-2 border-white/20 object-cover" />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1C4D7C] text-2xl font-semibold">{(participant?.name || "Guest").trim().charAt(0).toUpperCase()}</div>
                          )}
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 rounded-md bg-black/60 px-3 py-1.5 text-xs">{participant?.name || "Guest"}</div>
                      {participant?.isHandRaised && <div className="absolute right-3 top-3 rounded-full bg-amber-500 px-3 py-1 text-sm">✋ Hand Raised</div>}
                      {reactions.filter((r) => String(r.userId) === String(participant?.userId)).map((r) => (
                        <div key={r.id} className="pointer-events-none absolute right-1/2 top-1/3 z-20 text-5xl" style={{ animation: "quorum-reaction-float 1.8s ease-out forwards" }}>{r.emoji}</div>
                      ))}
                    </div>
                  );
                })}
                {remoteEntries.length === 0 && (
                  <div className="relative flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#0B2344]">
                    <div className="text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#12355B]"><FiUsers size={20} /></div><p className="text-sm text-white/60">Waiting for another participant...</p></div>
                  </div>
                )}
              </div>
            )}
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

{isHost && (
  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
  
    <button
      type="button"
      onClick={isRecording ? stopCallRecording : startCallRecording}
      disabled={isUploadingRecording}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
      title={
        isUploadingRecording
          ? "Uploading recording..."
          : isRecording
            ? "Stop recording"
            : "Start recording"
      }
      aria-label={
        isUploadingRecording
          ? "Recording uploading"
          : isRecording
            ? "Stop recording"
            : "Start recording"
      }
      aria-pressed={isRecording}
    >
      <span
        className={`h-3 w-3 rounded-full ${
          isRecording
            ? "animate-pulse bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)]"
            : "bg-gray-400"
        }`}
      />
    </button>

    {(isRecording || isUploadingRecording || recordingMessage) && (
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-3 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#102A46] px-3 py-2 text-xs font-medium text-white shadow-xl">
        <span className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              isUploadingRecording
                ? "animate-pulse bg-blue-400"
                : "animate-pulse bg-red-500"
            }`}
          />
          {isUploadingRecording
            ? "Uploading recording..."
            : recordingMessage || "Recording is live"}
        </span>
      </div>
    )}
  </div>
)}

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
    title={isHost ? "Leave or end meeting?" : "Leave meeting?"}
    message={
        isHost
            ? "You can leave while the meeting continues for everyone else, or end the meeting for all participants."
            : "Are you sure you want to leave this meeting? The meeting will continue for everyone else."
    }
    confirmText="Leave Meet"
    cancelText="Stay Meet"
    onConfirm={confirmLeaveMeeting}
    onCancel={() => setShowLeaveDialog(false)}
    showOrganizerWarning={isHost}
    onEndForEveryone={confirmEndMeeting}
/>
    </div>
  );
}

export default VideoCall;
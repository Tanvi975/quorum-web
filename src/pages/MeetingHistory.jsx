
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMeetingHistory } from "../services/meetingHistoryService";
import {
  getMeetingRecordings,
  getRecordingDetails,
} from "../services/recordingService";

export default function MeetingHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const userId = user?.id || user?.userId || user?.sub || user?._id;

  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [selectedRecording, setSelectedRecording] = useState(null);

  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [loadingPlayback, setLoadingPlayback] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (userId) {
      setMeetings(getMeetingHistory(userId));
    }
  }, [userId]);

  const openMeeting = async (meeting) => {
    setSelectedMeeting(meeting);
    setRecordings([]);
    setSelectedRecording(null);
    setError("");
    setLoadingRecordings(true);

    try {
      const result = await getMeetingRecordings(meeting.code, 1, 20);
      const payload = result?.data || result;

      const list = Array.isArray(payload)
        ? payload
        : payload?.recordings ||
          payload?.items ||
          payload?.results ||
          [];

      setRecordings(list);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load recordings for this meeting."
      );
    } finally {
      setLoadingRecordings(false);
    }
  };

  const playRecording = async (recording) => {
    const recordingId = recording.id || recording._id;

    if (!recordingId) {
      setError("Recording ID is missing.");
      return;
    }

    setError("");
    setLoadingPlayback(true);
    setSelectedRecording(null);

    try {
      const response = await getRecordingDetails(recordingId);

      const details =
        response?.recording ||
        response?.data?.recording ||
        response?.data ||
        response;

      setSelectedRecording({
        ...details,
        id: details.id || details._id || recordingId,
        playbackUrl:
          details.playbackUrl ||
          details.signedPlaybackUrl ||
          details.url ||
          details.fileUrl ||
          "",
      });

      if (
        !details.playbackUrl &&
        !details.signedPlaybackUrl &&
        !details.url &&
        !details.fileUrl
      ) {
        setError("Playback URL is not available for this recording.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not open this recording."
      );
    } finally {
      setLoadingPlayback(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatDuration = (seconds = 0) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const glassCardStyle = {
    backgroundColor: "rgba(15, 42, 75, 0.30)",
    border: "1px solid rgba(255, 255, 255, 0.20)",
    boxShadow: "0 12px 32px rgba(10, 35, 65, 0.16)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  };

  return (
    <main
      className="min-h-screen w-full min-w-0 overflow-x-hidden px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8"
      style={{
        backgroundColor: "#062C5F",
        backgroundImage: `
          linear-gradient(
            to bottom,
            #213F70 0%,
            #315A8A 35%,
            #506D9A 65%,
            #7698C5 100%
          )
        `,
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 100%",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-7">
          <button
            onClick={() => navigate("/dashboard")}
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-white/75 transition hover:text-white"
          >
            ← Back to Dashboard
          </button>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Meeting History
          </h1>

          <p className="mt-2 text-sm text-white/75">
            View your previous meetings and their recordings.
          </p>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-2">

          {/* Previous Meetings */}
          <section
            className="min-w-0 rounded-2xl p-5 sm:p-6"
            style={glassCardStyle}
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">
                Previous Meetings
              </h2>

              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                {meetings.length} meetings
              </span>
            </div>

            {!meetings.length ? (
              <div className="rounded-xl border border-dashed border-white/25 bg-white/5 px-4 py-10 text-center">
                <p className="text-sm text-white/75">
                  No meeting history available yet.
                </p>
              </div>
            ) : (
              <div className="max-h-[650px] space-y-3 overflow-y-auto pr-1">
                {meetings.map((meeting) => (
                  <button
                    key={meeting.code}
                    onClick={() => openMeeting(meeting)}
                    className={`w-full rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                      selectedMeeting?.code === meeting.code
                        ? "border-blue-200 bg-white/20 shadow-lg shadow-blue-950/20"
                        : "border-white/15 bg-[#173B60]/30 hover:border-white/30 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-white">
                        {meeting.title || "Quorum Meeting"}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          meeting.status === "COMPLETED"
                            ? "bg-emerald-400/15 text-emerald-100"
                            : "bg-amber-300/15 text-amber-100"
                        }`}
                      >
                        {meeting.status === "COMPLETED"
                          ? "Completed"
                          : "In progress"}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-white/65">
                      Meeting code: {meeting.code}
                    </p>

                    <p className="mt-1.5 text-xs text-white/75">
                      {formatDate(meeting.startedAt)}
                    </p>

                    {meeting.durationSeconds > 0 && (
                      <p className="mt-1.5 text-xs text-white/75">
                        Duration: {formatDuration(meeting.durationSeconds)}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Recordings and Playback */}
          <section
            className="min-w-0 rounded-2xl p-5 sm:p-6"
            style={glassCardStyle}
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">
                Meeting Recordings
              </h2>

              {selectedMeeting && (
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/80">
                  {recordings.length} recordings
                </span>
              )}
            </div>

            {!selectedMeeting ? (
              <div className="rounded-xl border border-dashed border-white/25 bg-white/5 px-4 py-10 text-center">
                <p className="text-sm text-white/75">
                  Select a meeting to view its recordings.
                </p>
              </div>
            ) : loadingRecordings ? (
              <div className="rounded-xl bg-white/5 px-4 py-10 text-center">
                <p className="text-sm text-white/75">
                  Loading recordings...
                </p>
              </div>
            ) : recordings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/25 bg-white/5 px-4 py-10 text-center">
                <p className="text-sm text-white/75">
                  No recordings found for this meeting.
                </p>
              </div>
            ) : (
              <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
                {recordings.map((recording) => (
                  <button
                    key={recording.id || recording._id}
                    onClick={() => playRecording(recording)}
                    className={`w-full rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                      selectedRecording?.id ===
                      (recording.id || recording._id)
                        ? "border-blue-200 bg-white/20 shadow-lg"
                        : "border-white/15 bg-[#173B60]/30 hover:border-white/30 hover:bg-white/10"
                    }`}
                  >
                    <p className="font-medium text-white">
                      Recording{" "}
                      {formatDate(
                        recording.startedAt || recording.createdAt
                      )}
                    </p>

                    <p className="mt-2 text-xs text-white/70">
                      Duration: {formatDuration(recording.durationSeconds)}
                    </p>

                    <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-100">
                      <span>▶</span>
                      Play Recording
                    </p>
                  </button>
                ))}
              </div>
            )}

            {loadingPlayback && (
              <div className="mt-5 rounded-xl bg-white/5 p-4 text-sm text-white/75">
                Loading recording...
              </div>
            )}
          </section>
        </div>

{/* Full Width Recording Playback */}
{selectedRecording?.playbackUrl && (
  <section
    className="mt-5 w-full rounded-2xl p-5 sm:p-6"
    style={glassCardStyle}
  >
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold">
          Recording Playback
        </h2>
        <p className="mt-1 text-sm text-white/65">
          Watch your meeting recording
        </p>
      </div>

      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/80">
        Video
      </span>
    </div>

    <div className="w-full overflow-hidden rounded-xl border border-white/15 bg-black shadow-xl">
      <video
        src={selectedRecording.playbackUrl}
        controls
        playsInline
        className="block aspect-video max-h-[520px] w-full bg-black object-contain"
      />
    </div>
  </section>
)}

        {/* Error Message */}
        {error && (
          <p className="mt-5 rounded-xl border border-red-300/30 bg-red-500/15 p-3 text-sm text-red-100">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}

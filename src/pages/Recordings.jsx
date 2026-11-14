
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  getMeetingRecordings,
  getRecordingDetails,
  generateRecordingSummary,
  deleteRecording,
} from "../services/recordingService";

import ConfirmDialog from "../components/ConfirmDialog";

export default function Recordings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchText, setSearchText] = useState("");
  const [searchedCode, setSearchedCode] = useState("");

  const [recordings, setRecordings] = useState([]);
  const [selected, setSelected] = useState(null);

  const [summary, setSummary] = useState("");
  const [transcriptText, setTranscriptText] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch recordings using meeting code
  const loadRecordings = async (code) => {
    const meetingCode = code?.trim();

    if (!meetingCode) {
      setError("Please enter a meeting code.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setSelected(null);
    setSummary("");
    setTranscriptText("");

    try {
      const result = await getMeetingRecordings(meetingCode, 1, 20);

      const payload = result?.data || result;

      const list = Array.isArray(payload)
        ? payload
        : payload?.recordings ||
          payload?.items ||
          payload?.results ||
          [];

      setRecordings(list);
      setSearchedCode(meetingCode);

      if (!list.length) {
        setMessage("No recordings found for this meeting code.");
      }
    } catch (err) {
      setRecordings([]);
      setSearchedCode("");

      setError(
        err.response?.data?.message ||
          "Could not load recordings. Please check the meeting code."
      );
    } finally {
      setLoading(false);
    }
  };

  // Support meeting code from URL query parameter
  useEffect(() => {
    const codeFromUrl = searchParams.get("code");

    if (codeFromUrl) {
      setSearchText(codeFromUrl);
      loadRecordings(codeFromUrl);
    }
  }, []);

  // Open recording details
  const openRecording = async (id) => {
    if (!id) return;

    setError("");
    setSummary("");
    setTranscriptText("");
    setSelected(null);
    setLoading(true);

    try {
      const response = await getRecordingDetails(id);

      const details =
        response?.recording ||
        response?.data?.recording ||
        response?.data ||
        response;

      const recordingId = details.id || details._id || id;

      setSelected({
        ...details,
        id: recordingId,
        playbackUrl:
          details.playbackUrl ||
          details.signedPlaybackUrl ||
          details.url ||
          details.fileUrl ||
          "",
      });

      setSummary(
        typeof details.summary === "string"
          ? details.summary
          : details.summary?.text || ""
      );

      setTranscriptText(details.transcriptText || "");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load recording details."
      );
    } finally {
      setLoading(false);
    }
  };

  const createSummary = async () => {
    if (!selected?.id) return;

    if (!transcriptText.trim() && !selected.transcriptUrl) {
      setError(
        "Transcript is not available. Paste the meeting transcript below."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await generateRecordingSummary(
        selected.id,
        transcriptText
      );

      const generated =
        result?.data?.summary ||
        result?.summary ||
        "";

      setSummary(generated);

      setSelected((old) => ({
        ...old,
        summary: generated,
      }));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Summary could not be generated."
      );
    } finally {
      setLoading(false);
    }
  };

  // Delete recording after confirmation
  const removeRecording = async () => {
    if (!selected?.id) return;

    setLoading(true);
    setError("");

    try {
      await deleteRecording(selected.id);

      setSelected(null);
      setSummary("");
      setTranscriptText("");
      setDeleteDialogOpen(false);

      await loadRecordings(searchedCode);

      setMessage("Recording deleted successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not delete recording."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds = 0) => {
    const value = Number(seconds) || 0;
    const mins = Math.floor(value / 60);
    const secs = Math.floor(value % 60);

    return `${mins}m ${secs}s`;
  };

  return (
    <main
      className="min-h-screen px-4 py-8 text-white sm:px-8"
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
      }}
    >
      <div className="mx-auto max-w-5xl">

        <button
          onClick={() => navigate("/dashboard")}
          className="mb-6 text-sm text-[#8CC4FF] hover:text-white"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold">
          Meeting Recordings
        </h1>

        <p className="mt-2 text-sm text-[#C0D5E8]">
          Enter a meeting code to view its recordings.
        </p>

        {/* Meeting Code Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadRecordings(searchText);
          }}
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Enter meeting code..."
            className="min-w-0 flex-1 rounded-xl border border-[#32658F] bg-[#102A46] px-4 py-3 text-white outline-none focus:border-blue-400"
          />

          <button
            type="submit"
            disabled={loading || !searchText.trim()}
            className="rounded-xl bg-[#087BFF] px-6 py-3 font-semibold hover:bg-[#0069DF] disabled:opacity-50"
          >
            {loading ? "Loading..." : "Search"}
          </button>

          <button
            type="button"
            onClick={() => {
              setSearchText("");
              setSearchedCode("");
              setRecordings([]);
              setSelected(null);
              setSummary("");
              setTranscriptText("");
              setError("");
              setMessage("");
            }}
            className="rounded-xl border border-[#32658F] px-5 py-3 text-sm font-semibold hover:bg-white/10"
          >
            Clear
          </button>
        </form>

        {/* Messages */}
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300"
          >
            {error}
          </p>
        )}

        {message && (
          <p className="mt-4 text-sm text-[#A8C5DF]">
            {message}
          </p>
        )}

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.2fr]">

          {/* Recordings List */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                {searchedCode
                  ? `Recordings for ${searchedCode}`
                  : "Recordings"}
              </h2>

              <span className="text-xs text-[#8CC4FF]">
                {recordings.length} found
              </span>
            </div>

            {!searchedCode && !loading && (
              <p className="rounded-xl border border-dashed border-[#32658F] p-5 text-sm text-[#C0D5E8]">
                Search using a meeting code to see its recordings.
              </p>
            )}

            {recordings.map((recording) => {
              const recordingId =
                recording.id ||
                recording._id ||
                recording.recordingId;

              return (
                <button
                  key={recordingId}
                  type="button"
                  onClick={() => openRecording(recordingId)}
                  className="w-full rounded-xl border border-[#32658F] bg-[#1F4A70] p-4 text-left transition hover:bg-[#2A5A83]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">
                      {recording.meeting?.title ||
                        recording.title ||
                        recording.fileName ||
                        recording.name ||
                        "Meeting recording"}
                    </span>

                    <span className="text-xs text-[#8CC4FF]">
                      {recording.status || "UNKNOWN"}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-[#C0D5E8]">
                    Meeting Code:{" "}
                    {recording.meetingCode ||
                      recording.meeting?.code ||
                      searchedCode}
                  </p>

                  <p className="mt-2 text-xs text-[#C0D5E8]">
                    {recording.startedAt
                      ? new Date(recording.startedAt).toLocaleString()
                      : "Date unavailable"}
                  </p>

                  <p className="mt-1 text-xs text-[#C0D5E8]">
                    Duration:{" "}
                    {formatDuration(recording.durationSeconds)}
                  </p>
                </button>
              );
            })}
          </section>

          {/* Recording Details */}
          <section className="min-w-0 rounded-2xl border border-[#32658F] bg-[#102A46] p-4 sm:p-5">
            <h2 className="font-semibold">
              Recording Details
            </h2>

            {!selected ? (
              <p className="mt-4 text-sm text-[#C0D5E8]">
                Select a recording to view its video and summary.
              </p>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-[#8CC4FF]">
                    {selected.status}
                  </span>

                  <span className="text-xs text-[#C0D5E8]">
                    {formatDuration(selected.durationSeconds)}
                  </span>
                </div>

                {selected.playbackUrl ? (
                  <video
                    key={selected.playbackUrl}
                    src={selected.playbackUrl}
                    controls
                    playsInline
                    className="mt-4 w-full rounded-xl bg-black"
                  />
                ) : (
                  <p className="mt-4 text-sm text-amber-300">
                    Playback is not available yet. The recording may still be processing.
                  </p>
                )}

                {/* AI Summary */}
                <div className="mt-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-semibold">
                      AI Meeting Summary
                    </h3>

                    <button
                      type="button"
                      onClick={createSummary}
                      disabled={
                        loading ||
                        String(selected.status || "").toUpperCase() !==
                          "COMPLETED"
                      }
                      className="rounded-lg bg-[#087BFF] px-4 py-2 text-sm font-semibold disabled:opacity-40"
                    >
                      {loading ? "Generating..." : "Generate Summary"}
                    </button>
                  </div>

                  {!selected.transcriptUrl && (
                    <div className="mt-3">
                      <label className="mb-2 block text-xs text-[#C0D5E8]">
                        Transcript (required if backend has not saved transcriptUrl)
                      </label>

                      <textarea
                        value={transcriptText}
                        onChange={(e) => setTranscriptText(e.target.value)}
                        rows={5}
                        placeholder="Paste the meeting transcript here..."
                        className="w-full rounded-xl border border-[#32658F] bg-[#071D38] p-3 text-sm text-white outline-none focus:border-blue-400"
                      />
                    </div>
                  )}

                  {summary ? (
                    <pre className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-[#071D38] p-4 text-sm leading-6 text-[#DCEAF7]">
                      {typeof summary === "string"
                        ? summary
                        : JSON.stringify(summary, null, 2)}
                    </pre>
                  ) : (
                    <p className="mt-3 text-sm text-[#C0D5E8]">
                      Summary will appear here after generation.
                      A transcript or transcriptUrl is required.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={loading}
                  className="mt-5 rounded-lg border border-red-400/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-40"
                >
                  Delete Recording
                </button>
              </>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        type="delete"
        title="Delete recording?"
        message="This recording will be permanently deleted. This action cannot be undone."
        confirmText="Delete Recording"
        loading={loading}
        onConfirm={removeRecording}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </main>
  );
}

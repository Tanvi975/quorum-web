
import { useNavigate, useLocation } from "react-router-dom";

export default function MeetingRecording() {
  const navigate = useNavigate();
  const location = useLocation();
  const recordingUrl = location.state?.recordingUrl;

  return (
    <div className="min-h-screen bg-[#06182F] p-4 text-white">
      <button
        onClick={() => navigate(-1)}
        className="mb-5 rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20"
      >
        ← Back to Team Chat
      </button>

      {recordingUrl ? (
        <video
          src={recordingUrl}
          controls
          autoPlay
          className="mx-auto max-h-[80vh] w-full max-w-5xl rounded-xl bg-black"
        />
      ) : (
        <p>Recording URL not found.</p>
      )}
    </div>
  );
}

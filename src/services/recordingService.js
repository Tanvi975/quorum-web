import api from "./api";

export const getMeetingRecordings = async(meetingCode, page = 1, limit = 20) => {
    const response = await api.get(
        `/api/meetings/${encodeURIComponent(meetingCode)}/recordings`, { params: { page, limit } }
    );

    return response.data ?.data ?? response.data;
};

export const getRecordingDetails = async(recordingId) => {
    const response = await api.get(`/api/recordings/${recordingId}`);
    return response.data ?.data ?? response.data;
};

export const getRecordingUploadUrl = async(meetingCode, fileName) => {
    const response = await api.post(
        `/api/meetings/${encodeURIComponent(meetingCode)}/recording/upload-url`, { meetingCode, fileName }
    );

    return response.data ?.data ?? response.data;
};

export const completeRecording = async(recordingId, payload) => {
    const response = await api.post(
        `/api/recordings/${recordingId}/complete`,
        payload
    );

    return response.data ?.data ?? response.data;
};

export const generateRecordingSummary = async(recordingId, transcriptText = "") => {
    const payload = transcriptText.trim() ? { transcriptText: transcriptText.trim() } : {};
    const response = await api.post(
        `/api/recordings/${recordingId}/summarize`, payload
    );

    return response.data ?.data ?? response.data;
};

export const deleteRecording = async(recordingId) => {
    const response = await api.delete(`/api/recordings/${recordingId}`);
    return response.data;
};
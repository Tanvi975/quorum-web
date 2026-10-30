import api from "./api";

const unwrap = (response) => {
    if (response ?.data ?.data !== undefined) {
        return response.data.data;
    }

    if (response ?.data !== undefined) {
        return response.data;
    }

    return response;
};

const validateId = (value, fieldName) => {
    if (typeof value !== "string" || !value.trim()) {
        throw new Error(`${fieldName} is required.`);
    }
};

const validatePayload = (payload, message) => {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new Error(message);
    }
};

const validateBoardName = (payload) => {
    if (
        typeof payload.name !== "string" ||
        !payload.name.trim()
    ) {
        throw new Error("Whiteboard name is required.");
    }
};

const getBoardPath = (boardId) =>
    `/api/v1/whiteboards/${encodeURIComponent(boardId)}`;

const getMeetingBoardsPath = (meetingCode) => `/api/v1/whiteboards/meetings/${encodeURIComponent(meetingCode)}`;

export async function createWhiteboard(payload) {
    validatePayload(payload, "Whiteboard details are required.");
    validateBoardName(payload);

    const response = await api.post("/api/v1/whiteboards", payload);

    return unwrap(response);
}

export async function listWhiteboards({
    organizationId,
    page = 1,
    limit = 20,
    search = "",
} = {}) {
    const response = await api.get("/api/v1/whiteboards", {
        params: {
            ...(organizationId ? { organizationId } : {}),
            page,
            limit,
            search: search.trim(),
        },
    });

    return unwrap(response);
}

export async function getWhiteboard(boardId) {
    validateId(boardId, "Whiteboard ID");

    const response = await api.get(getBoardPath(boardId));

    return unwrap(response);
}

export async function updateWhiteboard(boardId, payload) {
    validateId(boardId, "Whiteboard ID");
    validatePayload(payload, "Whiteboard update details are required.");

    const response = await api.patch(
        getBoardPath(boardId),
        payload
    );

    return unwrap(response);
}

export async function deleteWhiteboard(boardId) {
    validateId(boardId, "Whiteboard ID");

    const response = await api.delete(getBoardPath(boardId));

    return unwrap(response);
}

export async function listMeetingWhiteboards(meetingCode) {
    validateId(meetingCode, "Meeting code");

    const response = await api.get(
        getMeetingBoardsPath(meetingCode)
    );

    return unwrap(response);
}

export async function createMeetingWhiteboard(meetingCode, payload) {
    validateId(meetingCode, "Meeting code");
    validatePayload(payload, "Whiteboard details are required.");
    validateBoardName(payload);

    const response = await api.post(
        getMeetingBoardsPath(meetingCode),
        payload
    );

    return unwrap(response);
}

export async function openMeetingWhiteboard(meetingCode, whiteboardId) {
    validateId(meetingCode, "Meeting code");
    validateId(whiteboardId, "Whiteboard ID");

    const response = await api.post(
        `/api/v1/whiteboards/${encodeURIComponent(whiteboardId)}/meetings/${encodeURIComponent(meetingCode)}/open`
    );

    return unwrap(response);
}
import api from "./api";

const unwrap = (response) =>
    response ?.data ?.data ?? response ?.data ?? response;

const getTeamPath = (teamId) => {
    if (!teamId) {
        throw new Error("Team ID is required.");
    }

    return `/api/office/${encodeURIComponent(teamId)}`;
};

export async function getOfficeFloor(teamId) {
    const response = await api.get(getTeamPath(teamId));
    return unwrap(response);
}

export async function joinOfficeFloor(teamId) {
    const response = await api.post(`${getTeamPath(teamId)}/join`, {});
    return unwrap(response);
}

export async function knockOnDesk(teamId, targetUserId, message = "") {
    if (!targetUserId) {
        throw new Error("Target user is required.");
    }

    const response = await api.post(`${getTeamPath(teamId)}/knock`, {
        targetUserId,
        message: message.trim(),
    });

    return unwrap(response);
}

export async function claimOfficeDesk(teamId, deskId) {
    if (!deskId) {
        throw new Error("Desk ID is required.");
    }

    const response = await api.post(`${getTeamPath(teamId)}/desk/claim`, {
        deskId,
    });

    return unwrap(response);
}

export async function changeOfficeZone(teamId, zoneId, deskId = null) {
    const validZones = [
        "WAR_ROOM",
        "OPEN_WORKSPACE",
        "COFFEE_LOUNGE",
        "FOCUS_POD",
    ];

    if (!validZones.includes(zoneId)) {
        throw new Error("Invalid office zone.");
    }

    const response = await api.post(`${getTeamPath(teamId)}/zone`, {
        zoneId,
        deskId,
    });

    return unwrap(response);
}

export async function startOfficeMeeting(teamId, meetingCode) {
    if (!meetingCode) {
        throw new Error("Meeting code is required.");
    }

    const response = await api.post(
        `${getTeamPath(teamId)}/meeting/start`, { meetingCode }
    );

    return unwrap(response);
}

export async function endOfficeMeeting(teamId) {
    const response = await api.post(`${getTeamPath(teamId)}/meeting/end`, {});
    return unwrap(response);
}

export async function leaveOfficeFloor(teamId) {
    const response = await api.post(`${getTeamPath(teamId)}/leave`, {});
    return unwrap(response);
}
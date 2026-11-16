const getStorageKey = (userId) =>
    `quorum_meeting_history_${userId}`;

export function getMeetingHistory(userId) {
    if (!userId) return [];

    try {
        return JSON.parse(
            localStorage.getItem(getStorageKey(userId)) || "[]"
        );
    } catch {
        return [];
    }
}

export function saveMeetingStart(userId, meeting) {
    if (!userId || !meeting?.code) return;

    const history = getMeetingHistory(userId);

    // Prevent duplicate entry for the same meeting
    const existing = history.find(
        (item) => item.code === meeting.code
    );

    if (existing) return;

    const entry = {
        code: meeting.code,
        title: meeting.title || "Quorum Meeting",
        startedAt: new Date().toISOString(),
        endedAt: null,
        durationSeconds: 0,
        status: "IN_PROGRESS",
    };

    localStorage.setItem(
        getStorageKey(userId),
        JSON.stringify([entry, ...history].slice(0, 30))
    );
}

export function saveMeetingEnd(userId, meetingCode) {
    if (!userId || !meetingCode) return;

    const history = getMeetingHistory(userId);

    const updated = history.map((meeting) => {
        if (
            meeting.code !== meetingCode ||
            meeting.status !== "IN_PROGRESS"
        ) {
            return meeting;
        }

        const endedAt = new Date().toISOString();

        const durationSeconds = Math.max(
            0,
            Math.floor(
                (new Date(endedAt) - new Date(meeting.startedAt)) / 1000
            )
        );

        return {
            ...meeting,
            endedAt,
            durationSeconds,
            status: "COMPLETED",
        };
    });

    localStorage.setItem(
        getStorageKey(userId),
        JSON.stringify(updated)
    );
}

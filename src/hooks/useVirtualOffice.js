import { useCallback, useEffect, useRef, useState } from "react";
import { getOfficeFloor } from "../services/virtualOfficeService";
import { getApiErrorMessage } from "../services/api";

const EMPTY_STATE = {
    teamId: null,
    organizationId: null,
    activeMeetingCode: null,
    counts: {
        warRoom: 0,
        openDesks: 0,
        coffeeLounge: 0,
        focusPods: 0,
        totalActive: 0,
    },
    members: {},
    desks: [],
};

const getErrorMessage = (error, fallback) => {
    if (typeof error === "string") return error;
    return error ?.message || fallback;
};

const updateMemberDesk = (desks, userId, deskId, member) => {
    return desks.map((desk) => {
        if (desk.occupiedByUserId === userId && desk.deskId !== deskId) {
            return {
                ...desk,
                status: "EMPTY",
                occupiedByUserId: null,
                occupiedByUserName: null,
                occupiedByUserAvatar: null,
            };
        }

        if (desk.deskId === deskId) {
            return {
                ...desk,
                status: member ?.presenceStatus || "AVAILABLE",
                occupiedByUserId: userId,
                occupiedByUserName: member ?.name || null,
                occupiedByUserAvatar: member ?.avatarUrl || null,
            };
        }

        return desk;
    });
};

const removeMemberFromDesks = (desks, userId) => {
    return desks.map((desk) => {
        if (desk.occupiedByUserId !== userId) return desk;

        return {
            ...desk,
            status: "EMPTY",
            occupiedByUserId: null,
            occupiedByUserName: null,
            occupiedByUserAvatar: null,
        };
    });
};

const normalizeFloorState = (state) => {
    if (!state || typeof state !== "object") {
        return EMPTY_STATE;
    }

    return {
        ...EMPTY_STATE,
        ...state,
        counts: {
            ...EMPTY_STATE.counts,
            ...(state.counts || {}),
        },
        members: state.members || {},
        desks: Array.isArray(state.desks) ? state.desks : [],
    };
};

const updateFloorFromZoneEvent = (previous, event) => {
    if (!previous || !event ?.userId) return previous;

    const existingMember = previous.members ?.[event.userId] || {};

    const updatedMember = {
        ...existingMember,
        userId: event.userId,
        name: event.name || existingMember.name,
        avatarUrl: event.avatarUrl || existingMember.avatarUrl,
        zoneId: event.newZoneId,
        deskId: event.newZoneId === "OPEN_WORKSPACE" ?
            event.deskId || null :
            null,
        presenceStatus: event.presenceStatus || existingMember.presenceStatus,
        isInMeeting: event.isInMeeting ?? existingMember.isInMeeting ?? false,
        statusMessage: event.statusMessage ?? null,
    };

    const updatedMembers = {
        ...previous.members,
        [event.userId]: updatedMember,
    };

    const updatedDesks = updateMemberDesk(
        previous.desks,
        event.userId,
        updatedMember.deskId,
        updatedMember
    );

    return {
        ...previous,
        members: updatedMembers,
        desks: updatedDesks,
    };
};

const emitWithAck = (socket, eventName, payload) => {
    return new Promise((resolve, reject) => {
        if (!socket || !socket.connected) {
            reject(new Error("Connection lost. Please try again."));
            return;
        }

        socket.timeout(8000).emit(
            eventName,
            payload,
            (timeoutError, response) => {
                if (timeoutError) {
                    reject(
                        new Error("Server did not respond. Please try again.")
                    );
                    return;
                }

                if (!response ?.success) {
                    reject(
                        new Error(
                            response ?.message ||
                            "Unable to complete this action."
                        )
                    );
                    return;
                }

                resolve(response);
            }
        );
    });
};

export default function useVirtualOffice({
    teamId,
    socket,
    connected,
    enabled = true,
}) {
    const [floorState, setFloorState] = useState(null);
    const [loading, setLoading] = useState(false);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState("");
    const [socketError, setSocketError] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [knockNotification, setKnockNotification] = useState(null);

    const mountedRef = useRef(false);
    const joinedRef = useRef(false);
    const joiningRef = useRef(false);
    const revisionRef = useRef(0);
    const teamIdRef = useRef(teamId);

    teamIdRef.current = teamId;

    const applyFloorState = useCallback((state) => {
        if (!state) return;

        revisionRef.current += 1;
        setFloorState(normalizeFloorState(state));
    }, []);

    const refreshFloor = useCallback(async() => {
        if (!teamId || !enabled) return null;

        const currentRevision = revisionRef.current;

        setLoading(true);
        setError("");

        try {
            const response = await getOfficeFloor(teamId);
            const state = response ?.state || response;

            if (!mountedRef.current ||
                teamIdRef.current !== teamId
            ) {
                return null;
            }

            if (revisionRef.current === currentRevision) {
                applyFloorState(state);
            }

            return state;
        } catch (requestError) {
            if (
                mountedRef.current &&
                teamIdRef.current === teamId
            ) {
                setError(
                    getApiErrorMessage(
                        requestError,
                        "Unable to load the virtual office."
                    )
                );
            }

            return null;
        } finally {
            if (
                mountedRef.current &&
                teamIdRef.current === teamId
            ) {
                setLoading(false);
            }
        }
    }, [teamId, enabled, applyFloorState]);

    const joinOffice = useCallback(async() => {
        if (!socket ||
            !socket.connected ||
            !teamId ||
            !enabled ||
            joiningRef.current ||
            joinedRef.current
        ) {
            return;
        }

        joiningRef.current = true;
        setJoining(true);
        setSocketError("");

        try {
            const response = await emitWithAck(
                socket,
                "office:join", { teamId }
            );

            if (!mountedRef.current ||
                teamIdRef.current !== teamId
            ) {
                return;
            }

            const state = response ?.data ?.state;

            if (state) {
                applyFloorState(state);
            }

            joinedRef.current = true;
        } catch (joinError) {
            if (mountedRef.current) {
                setSocketError(
                    getErrorMessage(
                        joinError,
                        "Unable to join the virtual office."
                    )
                );
            }
        } finally {
            joiningRef.current = false;

            if (mountedRef.current) {
                setJoining(false);
            }
        }
    }, [socket, teamId, enabled, applyFloorState]);

    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        joinedRef.current = false;
        joiningRef.current = false;
        revisionRef.current = 0;

        setFloorState(null);
        setError("");
        setSocketError("");
        setKnockNotification(null);

        if (!teamId || !enabled) {
            setLoading(false);
            return;
        }

        refreshFloor();
    }, [teamId, enabled, refreshFloor]);

    useEffect(() => {
        if (!socket || !teamId || !enabled) return;

        const handleConnect = () => {
            joinedRef.current = false;
            joiningRef.current = false;
            setSocketError("");
            joinOffice();
        };

        const handleDisconnect = () => {
            joinedRef.current = false;
            joiningRef.current = false;
            setSocketError("Connection lost. Reconnecting...");
        };

        const handleZoneChanged = (event) => {
            if (event ?.teamId !== teamId) return;

            revisionRef.current += 1;

            setFloorState((previous) =>
                updateFloorFromZoneEvent(previous, event)
            );
        };

        const handleUserJoined = (event) => {
            if (
                event ?.teamId !== teamId ||
                !event ?.member ?.userId
            ) {
                return;
            }

            revisionRef.current += 1;

            setFloorState((previous) => {
                if (!previous) return previous;

                return {
                    ...previous,
                    members: {
                        ...previous.members,
                        [event.member.userId]: event.member,
                    },
                };
            });
        };

        const handleUserLeft = (event) => {
            if (event ?.teamId !== teamId || !event ?.userId) {
                return;
            }

            revisionRef.current += 1;

            setFloorState((previous) => {
                if (!previous) return previous;

                const updatedMembers = {...previous.members };
                delete updatedMembers[event.userId];

                return {
                    ...previous,
                    members: updatedMembers,
                    desks: removeMemberFromDesks(
                        previous.desks,
                        event.userId
                    ),
                };
            });
        };

        const handleKnocked = (event) => {
            if (event ?.teamId !== teamId) return;

            setKnockNotification({
                ...event,
                receivedAt: Date.now(),
            });
        };

        const handleMeetingStarted = (event) => {
            if (event ?.teamId !== teamId) return;

            revisionRef.current += 1;

            setFloorState((previous) => {
                if (!previous) return previous;

                return {
                    ...previous,
                    activeMeetingCode: event.meetingCode || null,
                };
            });
        };

        const handleMeetingEnded = (event) => {
            if (event ?.teamId !== teamId) return;

            revisionRef.current += 1;

            setFloorState((previous) => {
                if (!previous) return previous;

                return {
                    ...previous,
                    activeMeetingCode: null,
                };
            });
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("office:zone-changed", handleZoneChanged);
        socket.on("office:user-joined", handleUserJoined);
        socket.on("office:user-left", handleUserLeft);
        socket.on("office:knocked", handleKnocked);
        socket.on("office:meeting-started", handleMeetingStarted);
        socket.on("office:meeting-ended", handleMeetingEnded);

        if (connected && socket.connected) {
            joinOffice();
        }

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("office:zone-changed", handleZoneChanged);
            socket.off("office:user-joined", handleUserJoined);
            socket.off("office:user-left", handleUserLeft);
            socket.off("office:knocked", handleKnocked);
            socket.off("office:meeting-started", handleMeetingStarted);
            socket.off("office:meeting-ended", handleMeetingEnded);

            if (joinedRef.current && socket.connected) {
                socket.emit("office:leave", { teamId });
            }

            joinedRef.current = false;
            joiningRef.current = false;
        };
    }, [socket, teamId, enabled, joinOffice]);

    const claimDesk = useCallback(
        async(deskId) => {
            if (!deskId || actionLoading) return false;

            setActionLoading(true);
            setError("");

            try {
                const response = await emitWithAck(
                    socket,
                    "office:change-zone", {
                        teamId,
                        newZoneId: "OPEN_WORKSPACE",
                        targetDeskId: deskId,
                    }
                );

                const state = response ?.data ?.state;

                if (state) {
                    applyFloorState(state);
                }

                return true;
            } catch (actionError) {
                const message = getErrorMessage(
                    actionError,
                    "Unable to claim this desk."
                );

                setError(message);

                if (message.toLowerCase().includes("occupied")) {
                    refreshFloor();
                }

                return false;
            } finally {
                setActionLoading(false);
            }
        }, [socket, teamId, actionLoading, applyFloorState, refreshFloor]
    );

    const changeZone = useCallback(
        async(zoneId, deskId = null) => {
            if (actionLoading) return false;

            setActionLoading(true);
            setError("");

            try {
                const response = await emitWithAck(
                    socket,
                    "office:change-zone", {
                        teamId,
                        newZoneId: zoneId,
                        ...(deskId ? { targetDeskId: deskId } : {}),
                    }
                );

                const state = response ?.data ?.state;

                if (state) {
                    applyFloorState(state);
                }

                return true;
            } catch (actionError) {
                setError(
                    getErrorMessage(
                        actionError,
                        "Unable to change your office location."
                    )
                );

                return false;
            } finally {
                setActionLoading(false);
            }
        }, [socket, teamId, actionLoading, applyFloorState]
    );

    const knockOnDesk = useCallback(
        async(targetUserId, message = "") => {
            if (!targetUserId || actionLoading) return false;

            setActionLoading(true);
            setError("");

            try {
                await emitWithAck(socket, "office:knock", {
                    teamId,
                    targetUserId,
                    message: message.trim(),
                });

                return true;
            } catch (actionError) {
                setError(
                    getErrorMessage(
                        actionError,
                        "Unable to knock on this desk."
                    )
                );

                return false;
            } finally {
                setActionLoading(false);
            }
        }, [socket, teamId, actionLoading]
    );

    const leaveOffice = useCallback(async() => {
        if (!socket ?.connected || !teamId) return false;

        try {
            await emitWithAck(socket, "office:leave", { teamId });
            joinedRef.current = false;
            return true;
        } catch (leaveError) {
            setError(
                getErrorMessage(
                    leaveError,
                    "Unable to leave the virtual office."
                )
            );

            return false;
        }
    }, [socket, teamId]);

    const dismissKnock = useCallback(() => {
        setKnockNotification(null);
    }, []);

    return {
        floorState,
        loading,
        joining,
        connected: Boolean(connected && socket ?.connected),
        error,
        socketError,
        actionLoading,
        knockNotification,
        refreshFloor,
        claimDesk,
        changeZone,
        knockOnDesk,
        leaveOffice,
        dismissKnock,
    };
}
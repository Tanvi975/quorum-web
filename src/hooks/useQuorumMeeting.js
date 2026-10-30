import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const STUN = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const getSocketUrl = () => {
    const configuredUrl =
        import.meta.env.VITE_API_URL;
    const baseUrl = configuredUrl || window.location.origin;
    const socketUrl = baseUrl.replace(/\/api(?:\/v\d+)?\/?$/, "");
    return socketUrl || window.location.origin;
};

export function useQuorumMeeting({ meetingCode, user, isHost }) {
    const socketRef = useRef(null);
    const localStreamRef = useRef(null);
    const publisherRef = useRef(null);
    const subscribersRef = useRef(new Map());
    const pendingIceRef = useRef(new Map());
    const remoteMediaRef = useRef(new Map());
    const startedRef = useRef(false);
    const sfuAccessDeniedRef = useRef(false);
    const mountedRef = useRef(false);

    const [status, setStatus] = useState("Connecting");
    const [isMeetingHost, setIsMeetingHost] = useState(false);
    const [error, setError] = useState("");
    const [participants, setParticipants] = useState([]);
    const [waitingList, setWaitingList] = useState([]);
    const [messages, setMessages] = useState([]);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState({});
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const flushPendingIce = useCallback(async(key, pc) => {
        if (!pc ?.remoteDescription) return;

        const pending = pendingIceRef.current.get(key) || [];
        pendingIceRef.current.delete(key);

        for (const candidate of pending) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
                console.error("Queued ICE candidate failed:", err);
            }
        }
    }, []);

    const queueIceCandidate = useCallback((key, candidate) => {
        const pending = pendingIceRef.current.get(key) || [];
        pending.push(candidate);
        pendingIceRef.current.set(key, pending);
    }, []);

    const stopMedia = useCallback(() => {
        const socket = socketRef.current;

        if (socket ?.connected && meetingCode) {
            socket.emit("sfu:leave", { roomCode: meetingCode });
        }

        publisherRef.current ?.close();
        publisherRef.current = null;

        subscribersRef.current.forEach((pc) => pc.close());
        subscribersRef.current.clear();

        pendingIceRef.current.clear();

        remoteMediaRef.current.forEach((stream) => {
            stream.getTracks().forEach((track) => track.stop());
        });
        remoteMediaRef.current.clear();

        localStreamRef.current ?.getTracks().forEach((track) => {
            track.stop();
        });

        localStreamRef.current = null;
        startedRef.current = false;

        if (mountedRef.current) {
            setLocalStream(null);
            setRemoteStreams({});
        }
    }, [meetingCode]);

    const startMedia = useCallback(async() => {
        const socket = socketRef.current;

        if (!socket ?.connected ||
            startedRef.current ||
            sfuAccessDeniedRef.current
        ) {
            return;
        }

        startedRef.current = true;

        let stream;

        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true,
            });

            if (!socket.connected ||
                socketRef.current !== socket ||
                sfuAccessDeniedRef.current
            ) {
                stream.getTracks().forEach((track) => track.stop());
                startedRef.current = false;
                return;
            }

            localStreamRef.current = stream;

            if (mountedRef.current) {
                setLocalStream(stream);
            }

            const pc = new RTCPeerConnection(STUN);
            publisherRef.current = pc;

            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream);
            });

            pc.oniceconnectionstatechange = () => {
                console.log("Publisher ICE:", pc.iceConnectionState);
            };

            pc.onicecandidate = ({ candidate }) => {
                if (candidate && socket.connected) {
                    socket.emit("sfu:ice-candidate", {
                        roomCode: meetingCode,
                        peerId: user.id,
                        target: "publisher",
                        candidate,
                    });
                }
            };

            socket.emit("sfu:join", {
                roomCode: meetingCode,
                peerId: user.id,
                name: user.name,
            });

            const offer = await pc.createOffer();

            if (
                sfuAccessDeniedRef.current ||
                !socket.connected ||
                socketRef.current !== socket
            ) {
                pc.close();
                publisherRef.current = null;
                stream.getTracks().forEach((track) => track.stop());
                localStreamRef.current = null;
                startedRef.current = false;

                if (mountedRef.current) {
                    setLocalStream(null);
                }

                return;
            }

            await pc.setLocalDescription(offer);

            socket.emit("sfu:offer", {
                roomCode: meetingCode,
                peerId: user.id,
                sdp: {
                    type: offer.type,
                    sdp: offer.sdp,
                },
            });
        } catch (err) {
            startedRef.current = false;

            if (stream && localStreamRef.current !== stream) {
                stream.getTracks().forEach((track) => track.stop());
            }

            console.error("Starting meeting media failed:", err);

            if (mountedRef.current) {
                setError(
                    "Camera/microphone or WebRTC setup failed. Check permissions and try again."
                );
            }
        }
    }, [meetingCode, user]);

    const replaceVideoTrack = useCallback(async(newTrack) => {
        const pc = publisherRef.current;

        if (!pc || !newTrack) {
            throw new Error("Publisher or video track is unavailable.");
        }

        const sender = pc.getSenders().find(
            (item) => item.track ?.kind === "video"
        );

        if (!sender) {
            throw new Error("Video sender was not found.");
        }

        await sender.replaceTrack(newTrack);
    }, []);

    const subscribeToTrack = useCallback(
        async(trackId, kind, peerId) => {
            const socket = socketRef.current;

            if (!socket ?.connected ||
                !trackId ||
                !kind ||
                !peerId ||
                subscribersRef.current.has(trackId)
            ) {
                return;
            }

            const pc = new RTCPeerConnection(STUN);
            subscribersRef.current.set(trackId, pc);

            pc.addTransceiver(kind, { direction: "recvonly" });

            pc.ontrack = (event) => {
                let stream = remoteMediaRef.current.get(peerId);

                if (!stream) {
                    stream = new MediaStream();
                    remoteMediaRef.current.set(peerId, stream);
                }

                const alreadyAdded = stream
                    .getTracks()
                    .some((track) => track.id === event.track.id);

                if (!alreadyAdded) {
                    stream.addTrack(event.track);
                }

                if (mountedRef.current) {
                    setRemoteStreams((previous) => ({
                        ...previous,
                        [peerId]: stream,
                    }));
                }
            };

            pc.onicecandidate = ({ candidate }) => {
                if (candidate && socket.connected) {
                    socket.emit("sfu:ice-candidate", {
                        roomCode: meetingCode,
                        peerId: user.id,
                        target: "subscriber",
                        trackId,
                        candidate,
                    });
                }
            };

            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                if (!socket.connected || socketRef.current !== socket) {
                    pc.close();
                    subscribersRef.current.delete(trackId);
                    return;
                }

                socket.emit("sfu:subscribe", {
                    roomCode: meetingCode,
                    subscriberPeerId: user.id,
                    trackId,
                    sdp: {
                        type: offer.type,
                        sdp: offer.sdp,
                    },
                });
            } catch (err) {
                pc.close();
                subscribersRef.current.delete(trackId);
                throw err;
            }
        }, [meetingCode, user]
    );

    useEffect(() => {
        mountedRef.current = true;

        if (!meetingCode || !user ?.id || !user ?.name) {
            setError("Meeting code or user details are missing.");
            setStatus("Unable to join");

            return () => {
                mountedRef.current = false;
            };
        }

        const socket = io(getSocketUrl(), {
            withCredentials: true,
            transports: ["websocket"],
            auth: {
                userId: user.id,
                name: user.name,
                role: isHost ? "host" : "participant",
            },
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            sfuAccessDeniedRef.current = false;
            setStatus("Joining meeting");
            setError("");

            socket.emit("meeting:join", { meetingCode }, (ack) => {
                if (!ack ?.success) {
                    setStatus("Unable to join");
                    setError(ack ?.message || "Meeting join failed.");
                    return;
                }

                if (ack.data ?.status === "waiting_room") {
                    setIsMeetingHost(false);
                    setStatus("Waiting for host approval");
                } else {
                    setIsMeetingHost(ack.data ?.role === "host");
                    setParticipants(ack.data ?.participants || []);
                    setStatus("In call");
                    startMedia();
                }
            });
        });

        socket.on("connect_error", (err) => {
            console.error("Socket connection error:", err.message);
            setStatus("Connection failed");
            setError(err.message || "Could not connect to meeting server.");
        });

        socket.on("meeting:error", ({ message } = {}) => {
            sfuAccessDeniedRef.current = true;
            setStatus("Unable to join");
            setError(
                message || "You do not have permission to join this meeting."
            );
            stopMedia();
        });

        socket.on("sfu:error", ({ message } = {}) => {
            sfuAccessDeniedRef.current = true;
            setStatus("Unable to join");
            setError(message || "Access denied to this meeting.");
            stopMedia();
        });

        socket.on("disconnect", (reason) => {
            if (reason !== "io client disconnect") {
                setStatus("Disconnected");
            }
        });

        socket.on("meeting:guest-waiting", ({ user: guest } = {}) => {
            if (!guest ?.userId) return;

            setWaitingList((previous) => [
                ...previous.filter((item) => item.userId !== guest.userId),
                guest,
            ]);
        });

        socket.on("meeting:admitted", () => {
            setStatus("In call");
            setError("");
            startMedia();
        });

        socket.on("meeting:rejected", ({ message } = {}) => {
            setStatus("Admission rejected");
            setError(message || "The host declined your request.");
        });

        socket.on("meeting:participant-joined", ({ participants: list } = {}) => {
            setParticipants(list || []);
        });

        socket.on(
            "meeting:participant-left",
            ({ userId, participants: list } = {}) => {
                setParticipants(list || []);

                const stream = remoteMediaRef.current.get(userId);

                if (stream) {
                    stream.getTracks().forEach((track) => track.stop());
                    remoteMediaRef.current.delete(userId);
                }

                if (mountedRef.current) {
                    setRemoteStreams((previous) => {
                        const next = {...previous };
                        delete next[userId];
                        return next;
                    });
                }
            }
        );

        socket.on("meeting:participant-mic-status", ({ userId, isMuted }) => {
            setParticipants((previous) =>
                previous.map((person) =>
                    person.userId === userId ? {...person, isMuted } : person
                )
            );
        });

        socket.on("meeting:participant-cam-status", ({ userId, isVideoOff }) => {
            setParticipants((previous) =>
                previous.map((person) =>
                    person.userId === userId ?
                    {...person, isVideoOff } :
                    person
                )
            );
        });

        socket.on("meeting:muted-by-host", () => {
            localStreamRef.current ?.getAudioTracks().forEach((track) => {
                track.enabled = false;
            });

            setIsMuted(true);
        });

        socket.on("meeting:new-message", (message) => {
            setMessages((previous) => [...previous, message]);
        });

        socket.on("meeting:ended", ({ message } = {}) => {
            setStatus("Meeting ended");
            setError(message || "");
            stopMedia();
        });

        socket.on("sfu:answer", async({ sdp } = {}) => {
            try {
                const pc = publisherRef.current;

                if (!pc || !sdp) return;

                await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                await flushPendingIce("publisher", pc);
            } catch (err) {
                console.error("Publisher answer failed:", err);
            }
        });

        socket.on("sfu:joined", ({ existingTracks = [] } = {}) => {
            existingTracks.forEach(({ trackId, kind, peerId }) => {
                if (peerId !== user.id) {
                    subscribeToTrack(trackId, kind, peerId).catch((err) => {
                        console.error("Subscribe to remote track failed:", err);
                    });
                }
            });
        });

        socket.on("sfu:new-producer", ({ trackId, kind, peerId } = {}) => {
            if (peerId !== user.id) {
                subscribeToTrack(trackId, kind, peerId).catch((err) => {
                    console.error("Subscribe to remote track failed:", err);
                });
            }
        });

        socket.on("sfu:subscribed", async({ trackId, sdp } = {}) => {
            try {
                const pc = subscribersRef.current.get(trackId);

                if (pc && sdp) {
                    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                    await flushPendingIce(`subscriber:${trackId}`, pc);
                }
            } catch (err) {
                console.error("Subscriber answer failed:", err);
            }
        });

        socket.on(
            "sfu:ice-candidate",
            async({ candidate, peerId, target, trackId } = {}) => {
                if (!candidate) return;

                let key;
                let pc;

                if (target === "publisher") {
                    key = "publisher";
                    pc = publisherRef.current;
                } else if (target === "subscriber" && trackId) {
                    key = `subscriber:${trackId}`;
                    pc = subscribersRef.current.get(trackId);
                } else {
                    return;
                }

                if (!pc || !pc.remoteDescription) {
                    queueIceCandidate(key, candidate);
                    return;
                }

                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error("Adding remote ICE candidate failed:", err);
                }
            }
        );

        return () => {
            mountedRef.current = false;

            if (socket.connected) {
                socket.emit("meeting:leave", { meetingCode });
            }

            socket.disconnect();

            if (socketRef.current === socket) {
                socketRef.current = null;
            }

            stopMedia();
        };
    }, [
        meetingCode,
        user ?.id,
        user ?.name,
        isHost,
        startMedia,
        subscribeToTrack,
        stopMedia,
        flushPendingIce,
        queueIceCandidate,
    ]);

    const toggleMic = () => {
        const next = !isMuted;

        localStreamRef.current ?.getAudioTracks().forEach((track) => {
            track.enabled = !next;
        });

        setIsMuted(next);

        socketRef.current ?.emit("meeting:toggle-mic", {
            meetingCode,
            isMuted: next,
        });
    };

    const toggleCamera = () => {
        const next = !isVideoOff;

        localStreamRef.current ?.getVideoTracks().forEach((track) => {
            track.enabled = !next;
        });

        setIsVideoOff(next);

        socketRef.current ?.emit("meeting:toggle-cam", {
            meetingCode,
            isVideoOff: next,
        });
    };

    const sendMessage = (content) => {
        if (typeof content !== "string" || !content.trim()) return;

        socketRef.current ?.emit("meeting:send-message", {
            meetingCode,
            content: content.trim(),
        });
    };

    const admitGuest = (userId) => {
        const socket = socketRef.current;

        if (!meetingCode || !userId || !socket ?.connected) {
            setError("Meeting connection or guest details are unavailable.");
            return;
        }

        socket.emit(
            "meeting:admit-participant", { meetingCode, targetUserId: userId },
            (ack) => {
                if (ack ?.success) {
                    setWaitingList((previous) =>
                        previous.filter((guest) => guest.userId !== userId)
                    );
                    setError("");
                } else {
                    setError(ack ?.message || "Could not admit participant.");
                }
            }
        );
    };

    const rejectGuest = (userId) => {
        if (!userId) return;

        socketRef.current ?.emit("meeting:reject-participant", {
            meetingCode,
            userId,
        });

        setWaitingList((previous) =>
            previous.filter((guest) => guest.userId !== userId)
        );
    };

    const leaveMeeting = () => {
        const socket = socketRef.current;

        if (socket ?.connected) {
            if (isMeetingHost) {
                socket.emit("meeting:end", { meetingCode });
            } else {
                socket.emit("meeting:leave", { meetingCode });
            }
        }

        stopMedia();
        socket ?.disconnect();
        socketRef.current = null;
        window.location.href = "/dashboard";
    };

    return {
        status,
        error,
        participants,
        waitingList,
        messages,
        localStream,
        remoteStreams,
        isMuted,
        isVideoOff,
        toggleMic,
        toggleCamera,
        replaceVideoTrack,
        sendMessage,
        admitGuest,
        rejectGuest,
        leaveMeeting,
        isHost: isMeetingHost,
    };
}
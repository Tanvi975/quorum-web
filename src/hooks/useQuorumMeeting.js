import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const STUN = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function useQuorumMeeting({ meetingCode, user, isHost }) {
    const socketRef = useRef(null);
    const localStreamRef = useRef(null);
    const publisherRef = useRef(null);
    const subscribersRef = useRef(new Map());
    const startedRef = useRef(false);

    const [status, setStatus] = useState("Connecting");
    const [error, setError] = useState("");
    const [participants, setParticipants] = useState([]);
    const [waitingList, setWaitingList] = useState([]);
    const [messages, setMessages] = useState([]);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState({});
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const stopMedia = useCallback(() => {
        publisherRef.current ?.close();
        publisherRef.current = null;

        subscribersRef.current.forEach((pc) => pc.close());
        subscribersRef.current.clear();

        localStreamRef.current ?.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
        setLocalStream(null);
        setRemoteStreams({});
        startedRef.current = false;
    }, []);

    const startMedia = useCallback(async() => {
        const socket = socketRef.current;

        if (!socket ?.connected || startedRef.current) return;

        startedRef.current = true;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true,
            });

            if (!socket.connected) {
                stream.getTracks().forEach((track) => track.stop());
                startedRef.current = false;
                return;
            }

            localStreamRef.current = stream;
            setLocalStream(stream);

            const pc = new RTCPeerConnection(STUN);
            pc.oniceconnectionstatechange = () => {
                console.log("Publisher ICE:", pc.iceConnectionState);
            };

            pc.onicegatheringstatechange = () => {
                console.log("Publisher ICE gathering:", pc.iceGatheringState);
            };
            publisherRef.current = pc;

            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream);
            });


            pc.onicecandidate = ({ candidate }) => {
                if (candidate && socket.connected) {
                    console.log("LOCAL ICE CANDIDATE:", candidate.candidate);

                    socket.emit("sfu:ice-candidate", {
                        roomCode: meetingCode,
                        peerId: user.id,
                        candidate,
                    });
                } else if (!candidate) {
                    console.log("LOCAL ICE GATHERING COMPLETE");
                }
            };


            socket.emit("sfu:join", {
                roomCode: meetingCode,
                peerId: user.id,
                name: user.name,
            });

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit("sfu:offer", {
                roomCode: meetingCode,
                peerId: user.id,
                sdp: { type: offer.type, sdp: offer.sdp },
            });
        } catch (err) {
            startedRef.current = false;
            console.error("Starting meeting media failed:", err);
            setError(
                "Camera/microphone or WebRTC setup failed. Check permissions and try again."
            );
        }
    }, [meetingCode, user]);

    const subscribeToTrack = useCallback(async(trackId, kind, peerId) => {
        const socket = socketRef.current;
        if (!socket ?.connected || subscribersRef.current.has(trackId)) return;

        const pc = new RTCPeerConnection(STUN);
        subscribersRef.current.set(trackId, pc);

        pc.addTransceiver(kind, { direction: "recvonly" });

        pc.ontrack = (event) => {
            const stream = event.streams[0] || new MediaStream([event.track]);

            setRemoteStreams((previous) => ({
                ...previous,
                [peerId]: stream,
            }));
        };

        pc.onicecandidate = ({ candidate }) => {
            if (candidate && socket.connected) {
                socket.emit("sfu:ice-candidate", {
                    roomCode: meetingCode,
                    peerId: user.id,
                    candidate,
                });
            }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("sfu:subscribe", {
            roomCode: meetingCode,
            subscriberPeerId: user.id,
            trackId,
            sdp: { type: offer.type, sdp: offer.sdp },
        });
    }, [meetingCode, user]);

    useEffect(() => {
        if (!meetingCode || !user ?.id || !user ?.name) {
            setError("Meeting code or user details are missing.");
            return;
        }

        const apiUrl =
            import.meta.env.VITE_API_URL;
        const socketUrl = apiUrl.replace(/\/api\/?$/, "");

        const token = localStorage.getItem("accessToken");

        const socket = io(socketUrl, {
            transports: ["websocket"],
            auth: {
                token,
                userId: user.id,
                name: user.name,
                role: isHost ? "host" : "participant",
            },
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            setStatus("Joining meeting");
            setError("");

            socket.emit("meeting:join", { meetingCode }, (ack) => {
                if (!ack ?.success) {
                    setStatus("Unable to join");
                    setError(ack ?.message || "Meeting join failed.");
                    return;
                }

                setParticipants(ack.data ?.participants || []);

                if (ack.data ?.status === "waiting_room") {
                    setStatus("Waiting for host approval");
                } else {
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

        socket.on("disconnect", (reason) => {
            console.log("Meeting socket disconnected:", reason);
            if (reason !== "io client disconnect") {
                setStatus("Disconnected");
            }
        });

        socket.on("meeting:guest-waiting", ({ user: guest }) => {
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

        socket.on("meeting:rejected", ({ message }) => {
            setStatus("Admission rejected");
            setError(message || "The host declined your request.");
        });

        socket.on("meeting:participant-joined", ({ participants: list }) => {
            setParticipants(list || []);
        });

        socket.on("meeting:participant-left", ({ userId, participants: list }) => {
            setParticipants(list || []);
            setRemoteStreams((previous) => {
                const next = {...previous };
                delete next[userId];
                return next;
            });
        });

        socket.on("meeting:participant-mic-status", ({ userId, isMuted }) => {
            setParticipants((previous) =>
                previous.map((p) => p.userId === userId ? {...p, isMuted } : p)
            );
        });

        socket.on("meeting:participant-cam-status", ({ userId, isVideoOff }) => {
            setParticipants((previous) =>
                previous.map((p) => p.userId === userId ? {...p, isVideoOff } : p)
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

        socket.on("meeting:ended", ({ message }) => {
            setStatus("Meeting ended");
            setError(message || "");
            stopMedia();
        });

        socket.on("sfu:answer", async({ sdp }) => {
            console.log("SFU ANSWER RECEIVED");
            try {
                if (publisherRef.current && sdp) {
                    await publisherRef.current.setRemoteDescription(
                        new RTCSessionDescription(sdp)
                    );
                    console.log(
                        "Publisher signaling state:",
                        publisherRef.current.signalingState,
                        "ICE state:",
                        publisherRef.current.iceConnectionState
                    );
                }
            } catch (err) {
                console.error("Publisher answer failed:", err);
            }
        });

        socket.on("sfu:joined", ({ existingTracks = [] }) => {


            socket.on("sfu:joined", ({ existingTracks = [] }) => {
                console.log("SFU JOINED - existing tracks:", existingTracks);

                existingTracks.forEach(({ trackId, kind, peerId }) => {
                    console.log("Remote track found:", { trackId, kind, peerId });

                    if (peerId !== user.id) {
                        subscribeToTrack(trackId, kind, peerId).catch((err) => {
                            console.error("Subscribe to remote track failed:", err);
                        });
                    }
                });
            });


            existingTracks.forEach(({ trackId, kind, peerId }) => {
                if (peerId !== user.id) {
                    subscribeToTrack(trackId, kind, peerId).catch(console.error);
                }
            });
        });

        socket.on("sfu:new-producer", ({ trackId, kind, peerId }) => {
            if (peerId !== user.id) {
                subscribeToTrack(trackId, kind, peerId).catch(console.error);
            }
        });

        socket.on("sfu:subscribed", async({ trackId, sdp }) => {
            try {
                const pc = subscribersRef.current.get(trackId);
                if (pc && sdp) {
                    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                }
            } catch (err) {
                console.error("Subscriber answer failed:", err);
            }
        });

        socket.on("sfu:ice-candidate", async({ candidate, peerId }) => {
            try {
                if (!candidate) return;

                console.log("REMOTE ICE CANDIDATE RECEIVED:", {
                    peerId,
                    candidate,
                });
            } catch (err) {
                console.error("ICE candidate handling failed:", err);
            }
        });

        return () => {
            socket.emit("meeting:leave", { meetingCode });
            socket.disconnect();
            socketRef.current = null;
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
        if (!content.trim()) return;

        socketRef.current ?.emit("meeting:send-message", {
            meetingCode,
            content: content.trim(),
        });
    };


    const admitGuest = (userId) => {
        const socket = socketRef.current;

        console.log("Admit debug:", {
            connected: socket ?.connected,
            meetingCode,
            userId,
        });

        if (!meetingCode || !userId) {
            setError("Meeting code or guest user ID is missing.");
            return;
        }

        socket ?.emit(
            "meeting:admit-participant", { meetingCode, targetUserId: userId },
            (ack) => {
                console.log("Admit response:", ack);

                if (ack ?.success) {
                    setWaitingList((previous) =>
                        previous.filter((guest) => guest.userId !== userId)
                    );
                    setError("");
                } else {
                    setError(
                        ack ?.message || "Could not admit participant."
                    );
                }
            }
        );
    };


    const rejectGuest = (userId) => {
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
            if (isHost) {
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
        sendMessage,
        admitGuest,
        rejectGuest,
        leaveMeeting,
    };
}
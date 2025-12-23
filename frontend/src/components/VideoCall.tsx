import React, { useEffect, useRef, useState, useCallback } from "react";
import Peer from "simple-peer";
import Whiteboard from "./Whiteboard";
import axios from 'axios';
import {
    SwitchCamera, Mic, MicOff, Video, VideoOff,
    MonitorUp, X, Phone, PenTool, MessageSquare, User, ArrowLeft
} from 'lucide-react';

interface VideoCallProps {
    socket: any;
    user: any;
    partnerId: string;
    onClose: () => void;
    isVoiceOnly?: boolean;
    meetingId?: string;
    partnerName?: string;
}

const VideoCall: React.FC<VideoCallProps> = ({ socket, user, partnerId, onClose, isVoiceOnly = false, meetingId, partnerName }) => {





    // ... Render ...
    // Add logic to render Modal if showReviewModal is true
    // I will do this in a separate replacement or if I can match the end of component.

    useEffect(() => {
        console.log("VideoCall Mounted. Partner:", partnerId, "Name:", partnerName);
    }, []);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    // Call Status
    const [receivingCall, setReceivingCall] = useState(false);
    const [isCalling, setIsCalling] = useState(false);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);

    // Call Metadata
    const [caller, setCaller] = useState("");
    const [callerName, setCallerName] = useState("");
    const [callerSignal, setCallerSignal] = useState<any>(null);

    // Features
    const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoStopped, setIsVideoStopped] = useState(isVoiceOnly);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isRemoteScreenSharing, setIsRemoteScreenSharing] = useState(false); // NEW
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [currentDeviceId, setCurrentDeviceId] = useState<string>('');

    // Refs
    const myVideo = useRef<HTMLVideoElement>(null);
    const partnerVideo = useRef<HTMLVideoElement>(null);
    const connectionRef = useRef<Peer.Instance | null>(null);
    const ringtoneRef = useRef<HTMLAudioElement | null>(null);
    const screenTrackRef = useRef<MediaStreamTrack | null>(null);

    // Draggable PiP State
    const [pipPos, setPipPos] = useState({ x: 16, y: 16 }); // Default top-left padding
    const isDragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    // --- Media & Connection Setup ---

    // 1. Get User Media on Mount
    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: !isVoiceOnly, audio: true })
            .then((currentStream) => {
                setStream(currentStream);
                if (myVideo.current) myVideo.current.srcObject = currentStream;
            })
            .catch((err) => {
                console.error("Media Error:", err);
                // Fallback to audio only
                navigator.mediaDevices.getUserMedia({ video: false, audio: true })
                    .then(audioStream => {
                        setStream(audioStream);
                        setIsVideoStopped(true);
                    });
            });

        // Get Video Devices
        navigator.mediaDevices.enumerateDevices().then(devices => {
            const inputs = devices.filter(d => d.kind === 'videoinput');
            setVideoDevices(inputs);
            if (inputs.length > 0) setCurrentDeviceId(inputs[0].deviceId);
        });

        // Initialize Ringtone
        ringtoneRef.current = new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_12b0c7443c.mp3?filename=rolling-tone-2-2021-08-04.mp3");
        ringtoneRef.current.loop = true;

        return () => {
            if (stream) stream.getTracks().forEach(t => t.stop());
            if (ringtoneRef.current) {
                ringtoneRef.current.pause();
                ringtoneRef.current = null;
            }
        };
    }, []);

    // 2. Main Socket Listeners (Single Effect)
    useEffect(() => {
        if (!socket) return;

        console.log("Setting up VideoCall socket listeners");

        const handleCallUser = (data: any) => {
            console.log("📞 Incoming Call from:", data.name, "ID:", data.from);
            setReceivingCall(true);
            setCaller(data.from);
            setCallerName(data.name);
            setCallerSignal(data.signal);
        };

        const handleCallAccepted = (signal: any) => {
            console.log("✅ Call Accepted by Partner. Signal received.");
            setCallAccepted(true);
            if (connectionRef.current && !connectionRef.current.destroyed) {
                try {
                    connectionRef.current.signal(signal);
                } catch (e) {
                    console.warn("⚠️ Signal error (redundant?):", e);
                }
            }
        };

        const handleCallEnded = () => {
            console.log("☎️ Call Ended by remote");
            leaveCall(false); // false = don't emit event back (avoid loop)
        };

        const handleToggleWhiteboard = (data: boolean | { isOpen: boolean }) => {
            // Server might send raw boolean OR object, handle both
            const isOpen = typeof data === 'object' ? data.isOpen : data;
            console.log("📝 Remote toggled whiteboard:", isOpen);
            setIsWhiteboardOpen(isOpen);
        };

        const handleToggleScreenShare = (data: boolean | { isSharing: boolean }) => {
            const isSharing = typeof data === 'object' ? data.isSharing : data;
            console.log("🖥️ Remote toggled screen share:", isSharing);
            setIsRemoteScreenSharing(isSharing);
        };

        socket.on("callUser", handleCallUser);
        socket.on("callAccepted", handleCallAccepted);
        socket.on("endCall", handleCallEnded); // CHANGED: matched server event 'endCall'
        socket.on("toggleWhiteboard", handleToggleWhiteboard);
        socket.on("toggleScreenShare", handleToggleScreenShare); // NEW LISTENER

        return () => {
            socket.off("callUser", handleCallUser);
            socket.off("callAccepted", handleCallAccepted);
            socket.off("endCall", handleCallEnded);
            socket.off("toggleWhiteboard", handleToggleWhiteboard);
            socket.off("toggleScreenShare", handleToggleScreenShare);
        };
    }, [socket, caller, partnerId]); // Added dependencies for correct ID usage

    // Ringtone Logic
    useEffect(() => {
        if (receivingCall && !callAccepted) {
            ringtoneRef.current?.play().catch((e) => console.log("Ringtone blocked:", e));
        } else {
            ringtoneRef.current?.pause();
            if (ringtoneRef.current) ringtoneRef.current.currentTime = 0;
        }
    }, [receivingCall, callAccepted]);

    // Video Stream Rendering (Fix for Black Screen Race Condition)
    useEffect(() => {
        if (partnerVideo.current && remoteStream) {
            console.log("🎥 Assigning remote stream to video element via Effect");
            partnerVideo.current.srcObject = remoteStream;
        }
    }, [remoteStream, callAccepted]);

    // Derived State for Whiteboard Receiver
    // If I am receiving a call, I send data to 'caller'.
    // If I initiated the call, I send data to 'partnerId'.
    const whiteboardReceiverId = receivingCall ? caller : partnerId;

    // --- Call Functions ---

    const callUser = () => {
        if (!stream) return alert("Camera not ready.");
        console.log("📞 Calling User:", partnerId);

        setIsCalling(true);

        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        });

        peer.on("signal", (data) => {
            console.log("📡 Generated Signal (Initiator)");
            socket.emit("callUser", {
                userToCall: partnerId,
                signalData: data,
                from: user._id,
                name: user.name
            });
        });

        peer.on("stream", (currentStream) => {
            console.log("🎥 Received Remote Stream");
            setRemoteStream(currentStream);
            if (partnerVideo.current) partnerVideo.current.srcObject = currentStream;
        });

        peer.on("error", (err) => console.error("❌ Peer Error (Initiator):", err));

        peer.on("connect", () => console.log("🤝 Peer Connected (Initiator)"));

        connectionRef.current = peer;
    };

    const answerCall = () => {
        console.log("📞 Answering Call from:", caller);
        setCallAccepted(true);

        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: stream || undefined,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        });

        peer.on("signal", (data) => {
            console.log("📡 Generated Signal (Answer)");
            socket.emit("answerCall", { signal: data, to: caller });
        });

        peer.on("stream", (currentStream) => {
            console.log("🎥 Received Remote Stream (Answerer)");
            setRemoteStream(currentStream);
            if (partnerVideo.current) partnerVideo.current.srcObject = currentStream;
        });

        peer.on("error", (err) => console.error("❌ Peer Answer Error:", err));

        peer.on("connect", () => console.log("🤝 Peer Connected (Answerer)"));

        peer.signal(callerSignal);
        connectionRef.current = peer;
    };

    const leaveCall = async (emitEvent = true) => {
        setCallEnded(true);
        if (connectionRef.current) connectionRef.current.destroy();

        if (emitEvent) {
            const target = whiteboardReceiverId; // Reuse this logic
            if (target) socket.emit("endCall", { to: target });
        }

        // Mark meeting as completed if meetingId is present
        // (Only if call was accepted or we were the caller, implying a "real" session)
        if (meetingId && (callAccepted || isCalling)) {
            try {
                await axios.put(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/meetings/${meetingId}/status`, {
                    status: 'completed'
                });
                const event = new CustomEvent('show-toast', {
                    detail: { message: 'Session marked as completed! ✅', type: 'success' }
                });
                window.dispatchEvent(event);
            } catch (err) {
                console.error("Error updating meeting status", err);
            }
        }

        onClose();
        window.location.reload(); // Temporary fix for stream cleanup
    };



    // --- Screen Share Logic ---
    const stopScreenShare = () => {
        if (screenTrackRef.current && stream && connectionRef.current && !connectionRef.current.destroyed) {
            const videoTrack = stream.getVideoTracks()[0]; // Back to camera
            try {
                connectionRef.current.replaceTrack(screenTrackRef.current, videoTrack, stream);
            } catch (e) {
                console.error("Failed to revert track:", e);
            }

            screenTrackRef.current.stop();
            screenTrackRef.current = null;

            // Revert local view
            if (myVideo.current) {
                myVideo.current.srcObject = stream;
            }
            setIsScreenSharing(false);

            // Notify partner
            const target = whiteboardReceiverId;
            if (target) socket.emit("toggleScreenShare", { to: target, isSharing: false });
        }
    };

    const handleScreenShare = async () => {
        if (isScreenSharing) {
            stopScreenShare();
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = screenStream.getVideoTracks()[0];

                screenTrackRef.current = screenTrack;

                if (connectionRef.current && stream && !connectionRef.current.destroyed) {
                    const currentVideoTrack = stream.getVideoTracks()[0];
                    // Replace camera track with screen track
                    connectionRef.current.replaceTrack(currentVideoTrack, screenTrack, stream);

                    // Show screen in local PiP to confirm
                    if (myVideo.current) {
                        myVideo.current.srcObject = screenStream;
                    }

                    // Notify partner
                    const target = whiteboardReceiverId;
                    if (target) socket.emit("toggleScreenShare", { to: target, isSharing: true });
                }

                // Handle system "Stop Sharing" floating bar
                screenTrack.onended = () => stopScreenShare();
                setIsScreenSharing(true);
            } catch (err) {
                console.error("Failed to share screen", err);
            }
        }
    };

    // --- Helper Features ---

    const toggleAudio = () => {
        setIsAudioMuted(!isAudioMuted);
        if (stream) stream.getAudioTracks().forEach(t => t.enabled = isAudioMuted); // Toggle back
    };

    const toggleVideo = () => {
        setIsVideoStopped(!isVideoStopped);
        if (stream) stream.getVideoTracks().forEach(t => t.enabled = isVideoStopped);
    };

    const switchCamera = async () => {
        if (videoDevices.length < 2) return;
        const idx = videoDevices.findIndex(d => d.deviceId === currentDeviceId);
        const nextDevice = videoDevices[(idx + 1) % videoDevices.length];

        const newStream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: nextDevice.deviceId } },
            audio: true
        });

        setStream(newStream);
        setCurrentDeviceId(nextDevice.deviceId);
        if (myVideo.current) myVideo.current.srcObject = newStream;

        // Replace track logic
        if (connectionRef.current) {
            const oldTrack = stream?.getVideoTracks()[0];
            const newTrack = newStream.getVideoTracks()[0];
            if (oldTrack && newTrack) {
                connectionRef.current.replaceTrack(oldTrack, newTrack, stream!);
            }
        }
    };

    // --- UI Drag Handlers ---
    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        isDragging.current = true;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        dragOffset.current = { x: clientX - pipPos.x, y: clientY - pipPos.y };
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging.current) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        // Boundaries
        const x = Math.min(Math.max(0, clientX - dragOffset.current.x), window.innerWidth - 100);
        const y = Math.min(Math.max(0, clientY - dragOffset.current.y), window.innerHeight - 150);

        setPipPos({ x, y });
    };

    const handleEnd = () => isDragging.current = false;

    // --- Render ---

    return (
        <div className="fixed inset-0 z-50 bg-black overflow-hidden font-sans">

            {/* 1. Partner Video (Full Screen Background) */}
            {callAccepted && !callEnded && remoteStream ? (
                <video
                    playsInline
                    ref={partnerVideo}
                    autoPlay
                    className={`absolute inset-0 w-full h-full ${isRemoteScreenSharing ? 'object-contain bg-black' : 'object-cover'}`}
                />
            ) : (
                // Placeholder Background (Dark Gradient)
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
                    <User className="w-32 h-32 text-gray-700 opacity-20" />
                </div>
            )}

            {/* 2. Overlays (Incoming / Outgoing) */}

            {/* INCOMING CALL */}
            {receivingCall && !callAccepted && (
                <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-md flex flex-col items-center justify-between py-20 z-50 animate-fadeIn">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
                            <span className="text-3xl text-white font-bold">{callerName.charAt(0)}</span>
                        </div>
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-white mb-2">{callerName}</h2>
                            <p className="text-indigo-400">Incoming Video Call...</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-12 w-full justify-center px-8">
                        {/* Decline */}
                        <div className="flex flex-col items-center gap-2">
                            <button
                                onClick={() => leaveCall(true)}
                                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-xl transition-transform active:scale-95"
                            >
                                <Phone className="w-8 h-8 transform rotate-[135deg]" />
                            </button>
                            <span className="text-gray-400 text-sm">Decline</span>
                        </div>

                        {/* Answer */}
                        <div className="flex flex-col items-center gap-2">
                            <button
                                onClick={answerCall}
                                className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-xl animate-bounce-slow"
                            >
                                <Phone className="w-10 h-10" />
                            </button>
                            <span className="text-gray-400 text-sm">Accept</span>
                        </div>
                    </div>
                </div>
            )}

            {/* OUTGOING CALL */}
            {isCalling && !callAccepted && (
                <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-md flex flex-col items-center justify-between py-20 z-50">
                    <div className="flex flex-col items-center gap-6 pt-10">
                        <div className="w-24 h-24 rounded-full bg-gray-700 border-4 border-indigo-500/30 flex items-center justify-center relative">
                            <div className="absolute inset-0 rounded-full animate-ping border border-indigo-500/50"></div>
                            <User className="w-10 h-10 text-gray-400" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-white mb-2">Calling...</h2>
                            <p className="text-gray-400">Waiting for {partnerName || partnerId || "Partner"}...</p>
                        </div>
                    </div>


                </div>
            )}

            {/* 3. My Video PiP (Draggable) */}
            {stream && (callAccepted || isCalling) && (
                <div
                    className="absolute z-40 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 touch-none"
                    style={{
                        width: '120px',
                        height: '160px',
                        left: pipPos.x,
                        top: pipPos.y,
                        cursor: 'move'
                    }}
                    onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd}
                    onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
                >
                    <video
                        playsInline muted ref={myVideo} autoPlay
                        className={`w-full h-full object-cover transform scale-x-[-1] bg-gray-800 ${isVideoStopped ? 'opacity-0' : 'opacity-100'}`}
                    />
                    {isVideoStopped && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                            <User className="w-8 h-8 text-gray-500" />
                        </div>
                    )}
                </div>
            )}


            {/* 4. Controls Bar (Floating Bottom) */}
            {(!receivingCall || callAccepted) && (
                <div className="absolute bottom-6 left-0 right-0 flex justify-center z-50 px-4">
                    <div className="bg-gray-900/40 backdrop-blur-xl border border-white/10 p-3 rounded-3xl flex items-center gap-4 shadow-2xl">

                        {/* Start Call Button (if Pre-call) */}
                        {!isCalling && !callAccepted && (
                            <button
                                onClick={callUser}
                                className="bg-green-500 hover:bg-green-600 text-white rounded-full px-6 py-3 font-semibold flex items-center gap-2"
                            >
                                <Phone className="w-5 h-5" /> Call Now
                            </button>
                        )}

                        {/* In-Call Controls */}
                        {(isCalling || callAccepted) && (
                            <>
                                <button onClick={toggleAudio} className={`p-4 rounded-full ${isAudioMuted ? 'bg-white text-black' : 'bg-gray-800/80 text-white'} transition-colors`}>
                                    {isAudioMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                                </button>

                                <button onClick={toggleVideo} className={`p-4 rounded-full ${isVideoStopped ? 'bg-white text-black' : 'bg-gray-800/80 text-white'} transition-colors`}>
                                    {isVideoStopped ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                                </button>

                                <button onClick={handleScreenShare} className={`p-4 rounded-full ${isScreenSharing ? 'bg-blue-500 text-white' : 'bg-gray-800/80 text-white'} transition-colors shadow-lg`}>
                                    <MonitorUp className="w-6 h-6" />
                                </button>

                                {videoDevices.length > 1 && (
                                    <button onClick={switchCamera} className="p-4 rounded-full bg-gray-800/80 text-white transition-colors">
                                        <SwitchCamera className="w-6 h-6" />
                                    </button>
                                )}

                                <div className="w-px h-8 bg-white/20 mx-1"></div>

                                <button onClick={() => {
                                    const newState = !isWhiteboardOpen;
                                    setIsWhiteboardOpen(newState);
                                    const targetId = whiteboardReceiverId;
                                    if (targetId) {
                                        console.log("🖊️ Toggling Whiteboard for:", targetId);
                                        socket.emit("toggleWhiteboard", { to: targetId, isOpen: newState });
                                    } else {
                                        console.warn("⚠️ No target ID for whiteboard toggle");
                                    }
                                }} className={`p-4 rounded-full ${isWhiteboardOpen ? 'bg-indigo-500 text-white' : 'bg-gray-800/80 text-white'} transition-colors`}>
                                    <PenTool className="w-6 h-6" />
                                </button>

                                <button onClick={() => leaveCall(true)} className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors">
                                    <Phone className="w-6 h-6 transform rotate-[135deg]" />
                                </button>
                            </>
                        )}

                        {/* Close button if not started */}
                        {!isCalling && !callAccepted && (
                            <button onClick={onClose} className="p-3 rounded-full bg-gray-800/80 text-white hover:bg-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        )}

                    </div>
                </div>
            )}

            {/* 5. Whiteboard Overlay */}
            {isWhiteboardOpen && (
                <div className="absolute inset-0 z-40 bg-white/95 animate-slideUp">
                    <button
                        onClick={() => setIsWhiteboardOpen(false)}
                        className="absolute top-4 left-4 z-50 bg-gray-100 p-2 rounded-full shadow-md text-black"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <Whiteboard
                        socket={socket}
                        user={user}
                        receiverId={whiteboardReceiverId || ""}
                        onClose={() => setIsWhiteboardOpen(false)}
                    />
                </div>
            )}

        </div>
    );
};

export default VideoCall;

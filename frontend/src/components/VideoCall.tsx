import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import Whiteboard from "./Whiteboard";
import {
    SwitchCamera, Mic, MicOff, Video, VideoOff,
    MonitorUp, X, Phone, PenTool, Layout, Maximize2, Minimize2
} from 'lucide-react';

interface VideoCallProps {
    socket: any;
    user: any;
    partnerId: string;
    onClose: () => void;
    isVoiceOnly?: boolean;
}

const VideoCall: React.FC<VideoCallProps> = ({ socket, user, partnerId, onClose, isVoiceOnly = false }) => {
    const [isVideoStopped, setIsVideoStopped] = useState(isVoiceOnly);
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [currentDeviceId, setCurrentDeviceId] = useState<string>('');

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [receivingCall, setReceivingCall] = useState(false);
    const [caller, setCaller] = useState("");
    const [callerSignal, setCallerSignal] = useState<any>(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState("");
    const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
    const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);

    // Draggable PiP Logic
    const [pipPosition, setPipPosition] = useState(() => {
        if (typeof window !== 'undefined') {
            const isMobile = window.innerWidth < 768;
            // Mobile: Top-Right (w-32 = 128px) | Desktop: Right (w-72 = 288px)
            return {
                x: isMobile ? window.innerWidth - 144 : window.innerWidth - 320,
                y: isMobile ? 80 : 100
            };
        }
        return { x: 800, y: 100 };
    });

    const isDragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        dragOffset.current = {
            x: e.clientX - pipPosition.x,
            y: e.clientY - pipPosition.y
        };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging.current) {
            setPipPosition({
                x: e.clientX - dragOffset.current.x,
                y: e.clientY - dragOffset.current.y
            });
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    // Add Touch Handlers for Mobile Dragging
    const handleTouchStart = (e: React.TouchEvent) => {
        isDragging.current = true;
        const touch = e.touches[0];
        dragOffset.current = {
            x: touch.clientX - pipPosition.x,
            y: touch.clientY - pipPosition.y
        };
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (isDragging.current) {
            const touch = e.touches[0];
            setPipPosition({
                x: touch.clientX - dragOffset.current.x,
                y: touch.clientY - dragOffset.current.y
            });
        }
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
    };


    const partnerVideo = useRef<HTMLVideoElement>(null);

    // Enumerating Devices
    useEffect(() => {
        const getDevices = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
                setVideoDevices(videoInputDevices);
                if (videoInputDevices.length > 0) {
                    const currentTrack = stream?.getVideoTracks()[0];
                    const currentLabel = currentTrack?.label;

                    if (currentLabel) {
                        const match = videoInputDevices.find(d => d.label === currentLabel);
                        if (match) setCurrentDeviceId(match.deviceId);
                        else setCurrentDeviceId(videoInputDevices[0].deviceId);
                    } else {
                        setCurrentDeviceId(videoInputDevices[0].deviceId);
                    }
                }
            } catch (error) {
                console.error('Error enumerating devices:', error);
            }
        };
        getDevices();
    }, [stream]);

    // Main Stage Effect
    useEffect(() => {
        const targetStream = localScreenStream || remoteStream;
        if (userVideo.current && targetStream) {
            userVideo.current.srcObject = targetStream;
            userVideo.current.play().catch(e => console.error("Main video play error:", e));
        }
    }, [remoteStream, localScreenStream, callAccepted, isWhiteboardOpen]);

    useEffect(() => {
        if (myVideo.current && stream) {
            myVideo.current.srcObject = stream;
        }
    }, [stream]);

    // Partner PiP Effect
    useEffect(() => {
        if (partnerVideo.current && remoteStream && (localScreenStream || isWhiteboardOpen)) {
            partnerVideo.current.srcObject = remoteStream;
            partnerVideo.current.play().catch(e => console.error("Partner PiP play error:", e));
        }
    }, [remoteStream, localScreenStream, isWhiteboardOpen]);

    const myVideo = useRef<HTMLVideoElement>(null);
    const userVideo = useRef<HTMLVideoElement>(null);
    const connectionRef = useRef<any>(null);

    // Audio Refs
    const ringtoneRef = useRef<HTMLAudioElement | null>(null);
    const dialtoneRef = useRef<HTMLAudioElement | null>(null);

    const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        let isMounted = true;
        console.log("VideoCall mounted for user:", user._id);

        ringtoneRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
        ringtoneRef.current.loop = true;

        dialtoneRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        dialtoneRef.current.loop = true;

        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            if (!isMounted) {
                stream.getTracks().forEach(track => track.stop());
                return;
            }

            setStream(stream);

            if (isVoiceOnly) {
                stream.getVideoTracks().forEach(track => {
                    track.enabled = false;
                });
            }

            streamRef.current = stream;
            if (myVideo.current) {
                myVideo.current.srcObject = stream;
            }
        }).catch((err) => {
            console.error("Failed to get stream:", err);
        });

        socket.on("callUser", (data: any) => {
            if (!isMounted) return;
            console.log("Received incoming call from:", data.from);
            setReceivingCall(true);
            setCaller(data.from);
            setName(data.name);
            setCallerSignal(data.signal);
            ringtoneRef.current?.play().catch(e => console.log("Audio play failed:", e));
        });

        socket.on("callAccepted", (signal: any) => {
            if (!isMounted) return;
            console.log("Call accepted signal received");
            setCallAccepted(true);
            stopSounds();

            if (connectionRef.current && !connectionRef.current.destroyed) {
                connectionRef.current.signal(signal);
            }
        });

        socket.on("endCall", () => {
            if (!isMounted) return;
            console.log("Partner ended the call");
            setCallEnded(true);
            stopSounds();

            if (connectionRef.current) {
                connectionRef.current.destroy();
                connectionRef.current = null;
            }
            onClose();
        });

        socket.on("toggleScreenShare", (isSharing: boolean) => {
            if (!isMounted) return;
            console.log("Partner toggled screen share via socket:", isSharing);
            setIsRemoteScreenSharing(isSharing);

            if (userVideo.current && remoteStream) {
                const currentStream = userVideo.current.srcObject;
                userVideo.current.srcObject = null;
                setTimeout(() => {
                    if (userVideo.current) {
                        userVideo.current.srcObject = remoteStream;
                        userVideo.current.play().catch(e => console.error("Refresh play error:", e));
                    }
                }, 100);
            }
        });

        socket.on("toggleWhiteboard", (isOpen: boolean) => {
            if (!isMounted) return;
            setIsWhiteboardOpen(isOpen);
        });

        return () => {
            socket.off("toggleWhiteboard");
            isMounted = false;
            socket.off("callUser");
            socket.off("callAccepted");
            socket.off("endCall");
            socket.off("toggleScreenShare");
            stopSounds();

            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        }
    }, [socket, remoteStream]);

    const stopSounds = () => {
        if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
        }
        if (dialtoneRef.current) {
            dialtoneRef.current.pause();
            dialtoneRef.current.currentTime = 0;
        }
    };

    const [isCalling, setIsCalling] = useState(false);

    const callUser = (id: string) => {
        setIsCalling(true);
        dialtoneRef.current?.play().catch(e => console.log("Audio play failed:", e));

        if (connectionRef.current) {
            connectionRef.current.destroy();
        }

        if (stream) {
            originalVideoTrackRef.current = stream.getVideoTracks()[0];
        }

        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream!,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        });

        peer.on("signal", (data) => {
            socket.emit("callUser", {
                userToCall: id,
                signalData: data,
                from: user._id,
                name: user.name,
            });
        });

        peer.on("stream", (stream) => {
            setRemoteStream(stream);
        });

        peer.on('error', (err) => {
            console.error("Peer error:", err);
        });

        connectionRef.current = peer;
    };

    const answerCall = () => {
        setCallAccepted(true);
        stopSounds();

        if (connectionRef.current) {
            connectionRef.current.destroy();
        }

        if (stream) {
            originalVideoTrackRef.current = stream.getVideoTracks()[0];
        } else {
            console.warn("Stream not ready for answering call.");
        }

        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: stream!,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        });

        peer.on("signal", (data) => {
            socket.emit("answerCall", { signal: data, to: caller });
        });

        peer.on("stream", (stream) => {
            setRemoteStream(stream);
        });

        peer.on('error', (err) => {
            console.error("Peer answer error:", err);
        });

        if (!peer.destroyed && callerSignal) {
            peer.signal(callerSignal);
        }

        connectionRef.current = peer;
    };

    const leaveCall = () => {
        setCallEnded(true);
        setIsCalling(false);
        stopSounds();

        const targetId = receivingCall ? caller : partnerId;
        if (targetId) {
            socket.emit("endCall", { to: targetId });
        }

        if (connectionRef.current) {
            connectionRef.current.destroy();
            connectionRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        stream?.getTracks().forEach(track => track.stop());
        onClose();
    };

    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const screenTrackRef = useRef<MediaStreamTrack | null>(null);
    const [isRemoteScreenSharing, setIsRemoteScreenSharing] = useState(false);

    const handleScreenShare = () => {
        if (isScreenSharing) {
            stopScreenShare();
        } else {
            navigator.mediaDevices.getDisplayMedia({ video: true }).then((screenStream) => {
                const screenTrack = screenStream.getVideoTracks()[0];
                screenTrackRef.current = screenTrack;

                setLocalScreenStream(screenStream);

                const activeStream = stream || streamRef.current;
                const activeConnection = connectionRef.current;

                if (activeConnection && activeStream) {
                    let currentWebcamTrack = activeStream.getVideoTracks()[0];

                    if (!currentWebcamTrack && originalVideoTrackRef.current) {
                        currentWebcamTrack = (originalVideoTrackRef.current as MediaStreamTrack);
                    }

                    if (currentWebcamTrack) {
                        originalVideoTrackRef.current = currentWebcamTrack;

                        try {
                            activeConnection.replaceTrack(currentWebcamTrack, screenTrack, activeStream);
                        } catch (e) {
                            console.error("[ScreenShare] replaceTrack failed:", e);
                        }
                    }
                }

                setIsScreenSharing(true);

                const targetId = receivingCall ? caller : partnerId;
                if (targetId) socket.emit("toggleScreenShare", { to: targetId, isSharing: true });

                screenTrack.onended = () => {
                    stopScreenShare();
                };
            }).catch(err => console.error("Failed to share screen", err));
        }
    };

    const stopScreenShare = () => {
        if (screenTrackRef.current) {
            screenTrackRef.current.stop();
        }

        if (connectionRef.current && stream && originalVideoTrackRef.current) {
            try {
                if (screenTrackRef.current) {
                    connectionRef.current.replaceTrack(screenTrackRef.current, originalVideoTrackRef.current, stream);
                }
            } catch (e) {
                console.error("Screen share stop error:", e);
            }
        }

        setLocalScreenStream(null);
        setIsScreenSharing(false);

        const targetId = receivingCall ? caller : partnerId;
        if (targetId) socket.emit("toggleScreenShare", { to: targetId, isSharing: false });

        screenTrackRef.current = null;
    };

    const [isAudioMuted, setIsAudioMuted] = useState(false);

    const toggleAudio = () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsAudioMuted(!isAudioMuted);
        }
    };

    const toggleVideo = () => {
        if (stream) {
            stream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoStopped(!isVideoStopped);
        }
    };

    const switchCamera = async () => {
        if (videoDevices.length < 2) return;

        const currentDeviceIndex = videoDevices.findIndex(device => device.deviceId === currentDeviceId);
        const effectiveIndex = currentDeviceIndex === -1 ? 0 : currentDeviceIndex;
        const nextDeviceIndex = (effectiveIndex + 1) % videoDevices.length;
        const nextDeviceId = videoDevices[nextDeviceIndex].deviceId;

        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: nextDeviceId } },
                audio: true
            });

            const newVideoTrack = newStream.getVideoTracks()[0];

            if (stream) {
                const oldVideoTrack = stream.getVideoTracks()[0];
                stream.removeTrack(oldVideoTrack);
                stream.addTrack(newVideoTrack);
                oldVideoTrack.stop();

                const newStreamObj = new MediaStream([newVideoTrack, ...stream.getAudioTracks()]);
                setStream(newStreamObj);
                streamRef.current = newStreamObj;
                newStream.getAudioTracks().forEach(t => t.stop());
            }

            if (connectionRef.current) {
                const senders = connectionRef.current.getSenders();
                const videoSender = senders.find((s: any) => s.track?.kind === 'video');
                if (videoSender) {
                    videoSender.replaceTrack(newVideoTrack);
                }
            }

            setCurrentDeviceId(nextDeviceId);

        } catch (error) {
            console.error('Error switching camera:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-0 md:p-4 transition-all duration-500">
            {/* Video Container */}
            <div className="relative w-full h-full md:h-auto md:max-w-6xl md:aspect-video bg-black rounded-none md:rounded-[2rem] overflow-hidden shadow-2xl ring-0 md:ring-1 md:ring-white/10 group">

                {/* Main Stage Video */}
                {callAccepted && !callEnded ? (
                    <video
                        playsInline
                        ref={userVideo}
                        autoPlay
                        className={`w-full h-full ${localScreenStream || isRemoteScreenSharing ? 'object-contain bg-gray-900' : 'object-cover'} ${isWhiteboardOpen ? 'invisible' : ''}`}
                    />
                ) : (
                    !isWhiteboardOpen && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-6">
                            <div className="relative">
                                <div className="w-24 h-24 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-16 h-16 bg-indigo-500/10 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                            <p className="text-xl font-medium tracking-wide animate-pulse">Waiting for partner...</p>
                        </div>
                    )
                )}

                {/* Calling Status Overlay */}
                {isCalling && !callAccepted && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-40 animate-in fade-in">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <Phone className="w-8 h-8 md:w-10 md:h-10 text-indigo-400 animate-bounce" />
                        </div>
                        <p className="text-xl md:text-2xl font-bold text-white tracking-wide">Calling...</p>
                        <p className="text-indigo-400 text-sm mt-2">Waiting for response</p>
                    </div>
                )}

                {/* Whiteboard Overlay */}
                {isWhiteboardOpen && (
                    <Whiteboard
                        socket={socket}
                        user={user}
                        receiverId={receivingCall ? caller : partnerId}
                        onClose={() => setIsWhiteboardOpen(false)}
                    />
                )}

                {/* My Video (PiP) */}
                {stream && (
                    <div className="absolute top-6 right-6 w-32 md:w-64 aspect-video bg-gray-900/90 rounded-2xl overflow-hidden shadow-2xl border border-white/20 transition-all duration-300 hover:scale-105 hover:border-indigo-500/50 hover:shadow-indigo-500/20 z-50 group/pip">
                        <video
                            playsInline
                            muted
                            ref={myVideo}
                            autoPlay
                            className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${isVideoStopped ? 'opacity-0' : 'opacity-100'}`}
                        />
                        {isVideoStopped && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-500">
                                <VideoOff className="w-8 h-8 opacity-50" />
                            </div>
                        )}
                        <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 flex items-center gap-1 md:gap-2 bg-black/60 px-2 py-0.5 md:px-3 md:py-1 rounded-full backdrop-blur-md border border-white/10">
                            <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full animate-pulse ${isAudioMuted ? 'bg-red-500' : 'bg-green-500'}`}></div>
                            <span className="text-[10px] md:text-xs text-white font-medium tracking-wide">You</span>
                        </div>
                    </div>
                )}

                {/* Partner Video PiP */}
                {(localScreenStream || isWhiteboardOpen) && remoteStream && (
                    <div
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        // Add touch listeners for mobile drag
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        style={{ left: pipPosition.x, top: pipPosition.y }}
                        className="fixed w-32 md:w-72 aspect-video bg-gray-900 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border-2 border-indigo-500/30 z-50 cursor-move hover:shadow-indigo-500/40 transition-shadow active:scale-95 duration-200"
                    >
                        <video
                            playsInline
                            ref={partnerVideo}
                            autoPlay
                            muted
                            className="w-full h-full object-cover pointer-events-none"
                        />
                        <div className="absolute top-1 right-1 md:top-2 md:right-2">
                            <span className="bg-indigo-600 text-white text-[8px] md:text-[10px] px-1.5 py-0.5 rounded shadow">Partner</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls Bar */}
            <div className="absolute bottom-0 left-0 w-full md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:w-max bg-gray-900/95 md:bg-gray-900/80 backdrop-blur-xl pt-6 pb-8 md:px-8 md:py-5 flex justify-evenly md:justify-center md:gap-4 items-center z-50 rounded-t-[2.5rem] md:rounded-full border-t border-white/10 md:border md:shadow-2xl transition-all">

                {/* Pre-Call Actions */}
                {!callAccepted && !receivingCall && !isCalling && (
                    <button
                        onClick={() => callUser(partnerId)}
                        className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-12 md:px-8 rounded-full transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 active:scale-95 mb-4 md:mb-0"
                    >
                        <Phone className="w-6 h-6" />
                        <span className="text-lg">Start Call</span>
                    </button>
                )}

                {/* Active Call Controls */}
                {(callAccepted || isCalling) && !callEnded && (
                    <>
                        <button
                            onClick={toggleAudio}
                            className={`p-4 rounded-full transition-all duration-200 shadow-lg active:scale-90 ${isAudioMuted
                                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                                : 'bg-gray-700 hover:bg-gray-600 text-white hover:text-indigo-400'
                                }`}
                            title={isAudioMuted ? "Unmute" : "Mute"}
                        >
                            {isAudioMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </button>

                        <button
                            onClick={toggleVideo}
                            className={`p-4 rounded-full transition-all duration-200 shadow-lg active:scale-90 ${isVideoStopped
                                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                                : 'bg-gray-700 hover:bg-gray-600 text-white hover:text-indigo-400'
                                }`}
                            title={isVideoStopped ? "Start Video" : "Stop Video"}
                        >
                            {isVideoStopped ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                        </button>

                        {videoDevices.length > 1 && !isVideoStopped && (
                            <button
                                onClick={switchCamera}
                                className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white hover:text-indigo-400 transition-all duration-200 shadow-lg active:scale-90"
                                title="Switch Camera"
                            >
                                <SwitchCamera className="w-6 h-6" />
                            </button>
                        )}

                        {callAccepted && (
                            <>
                                <div className="w-px h-8 bg-gray-700 mx-2"></div>

                                <button
                                    onClick={handleScreenShare}
                                    className={`p-4 rounded-full transition-all duration-200 shadow-lg active:scale-90 ${isScreenSharing
                                        ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30'
                                        : 'bg-gray-700 hover:bg-gray-600 text-white hover:text-indigo-400'
                                        }`}
                                    title="Screen Share"
                                >
                                    <MonitorUp className="w-6 h-6" />
                                </button>

                                <button
                                    onClick={() => {
                                        const newState = !isWhiteboardOpen;
                                        setIsWhiteboardOpen(newState);
                                        const targetId = receivingCall ? caller : partnerId;
                                        if (targetId) socket.emit("toggleWhiteboard", { to: targetId, isOpen: newState });
                                    }}
                                    className={`p-4 rounded-full transition-all duration-200 shadow-lg active:scale-90 ${isWhiteboardOpen
                                        ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/30'
                                        : 'bg-gray-700 hover:bg-gray-600 text-white hover:text-indigo-400'
                                        }`}
                                    title="Whiteboard"
                                >
                                    <PenTool className="w-6 h-6" />
                                </button>
                            </>
                        )}
                    </>
                )}

                {(callAccepted || isCalling) && (
                    <button
                        onClick={leaveCall}
                        className="ml-4 p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200 shadow-lg shadow-red-500/30 active:scale-90 hover:rotate-90"
                        title="End Call"
                    >
                        <Phone className="w-6 h-6 transform rotate-[135deg]" />
                    </button>
                )}

                {/* Fallback Close if not in call */}
                {!callAccepted && !receivingCall && !isCalling && (
                    <button
                        onClick={onClose}
                        className="p-4 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-all duration-200 active:scale-90"
                        title="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default VideoCall;

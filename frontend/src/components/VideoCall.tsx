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

    // Draggable Partner PiP Logic
    const [pipPosition, setPipPosition] = useState(() => {
        if (typeof window !== 'undefined') {
            const isMobile = window.innerWidth < 768;
            return {
                x: isMobile ? window.innerWidth - 144 : window.innerWidth - 320,
                y: isMobile ? 80 : 100
            };
        }
        return { x: 800, y: 100 };
    });

    // Draggable My Video Logic
    const [myPipPosition, setMyPipPosition] = useState(() => {
        if (typeof window !== 'undefined') {
            const isMobile = window.innerWidth < 768;
            return {
                x: isMobile ? window.innerWidth - 144 : window.innerWidth - 320,
                y: isMobile ? 200 : 320 // Place it below Partner PiP by default
            };
        }
        return { x: 800, y: 320 };
    });

    const isDragging = useRef(false); // Partner Drag
    const isDraggingMy = useRef(false); // My Video Drag
    const dragOffset = useRef({ x: 0, y: 0 });
    const dragOffsetMy = useRef({ x: 0, y: 0 });

    // --- Partner PiP Handlers ---
    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        dragOffset.current = { x: e.clientX - pipPosition.x, y: e.clientY - pipPosition.y };
    };
    const handleTouchStart = (e: React.TouchEvent) => {
        isDragging.current = true;
        const touch = e.touches[0];
        dragOffset.current = { x: touch.clientX - pipPosition.x, y: touch.clientY - pipPosition.y };
    };
    const handleMove = (clientX: number, clientY: number) => {
        if (isDragging.current) {
            setPipPosition({ x: clientX - dragOffset.current.x, y: clientY - dragOffset.current.y });
        }
    };
    const handleEnd = () => { isDragging.current = false; };

    // --- My PiP Handlers ---
    const handleMyMouseDown = (e: React.MouseEvent) => {
        isDraggingMy.current = true;
        dragOffsetMy.current = { x: e.clientX - myPipPosition.x, y: e.clientY - myPipPosition.y };
    };
    const handleMyTouchStart = (e: React.TouchEvent) => {
        isDraggingMy.current = true;
        const touch = e.touches[0];
        dragOffsetMy.current = { x: touch.clientX - myPipPosition.x, y: touch.clientY - myPipPosition.y };
    };
    const handleMyMove = (clientX: number, clientY: number) => {
        if (isDraggingMy.current) {
            setMyPipPosition({ x: clientX - dragOffsetMy.current.x, y: clientY - dragOffsetMy.current.y });
        }
    };
    const handleMyEnd = () => { isDraggingMy.current = false; };

    // Global Move/Up listeners (attached to PiPs directly for simplicity, or window if needed for smoother drag)
    // Using direct attachment here as per previous pattern.

    const onTouchMove = (e: React.TouchEvent) => {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
        handleMyMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onMouseMove = (e: React.MouseEvent) => {
        handleMove(e.clientX, e.clientY);
        handleMyMove(e.clientX, e.clientY);
    };
    const onEnd = () => {
        handleEnd();
        handleMyEnd();
    };

    // ... (rest of component logic)

    // Render Section Changes:
    // 1. My Video (PiP) -> Draggable & Responsive
    // 2. Partner PiP -> Responsive sizes update

    {/* My Video (PiP) */ }
    {
        stream && (
            <div
                onMouseDown={handleMyMouseDown}
                onTouchStart={handleMyTouchStart}
                // Use global move/end handlers attached here or to a wrapper?
                // Attaching move/up to window is better for dragging, but we'll attach to element for containment if sufficient,
                // or better yet, attach to the element but capture pointer capture if possible.
                // For simplicity in React, we'll attach move/up to the element itself, but dragging fast might lose it.
                // Let's stick to the previous pattern: move/up on element. 
                onMouseMove={onMouseMove}
                onTouchMove={onTouchMove}
                onMouseUp={onEnd}
                onTouchEnd={onEnd}
                onMouseLeave={onEnd}

                style={{ left: myPipPosition.x, top: myPipPosition.y }}
                className="fixed w-32 md:w-48 lg:w-64 aspect-video bg-gray-900/90 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border border-white/20 transition-all duration-300 hover:scale-105 hover:border-indigo-500/50 hover:shadow-indigo-500/20 z-[51] cursor-move group/pip"
            >
                <video
                    playsInline
                    muted
                    ref={myVideo}
                    autoPlay
                    className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${isVideoStopped ? 'opacity-0' : 'opacity-100'} pointer-events-none`}
                />
                {isVideoStopped && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-500 pointer-events-none">
                        <VideoOff className="w-8 h-8 opacity-50" />
                    </div>
                )}
                <div className="absolute bottom-2 left-2 flex items-center gap-1 md:gap-2 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-md border border-white/10 pointer-events-none">
                    <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full animate-pulse ${isAudioMuted ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <span className="text-[10px] md:text-xs text-white font-medium tracking-wide">You</span>
                </div>
            </div>
        )
    }

    {/* Partner Video PiP */ }
    {
        (localScreenStream || isWhiteboardOpen) && remoteStream && (
            <div
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onMouseMove={onMouseMove}
                onTouchMove={onTouchMove}
                onMouseUp={onEnd}
                onTouchEnd={onEnd}
                onMouseLeave={onEnd}

                style={{ left: pipPosition.x, top: pipPosition.y }}
                className="fixed w-32 md:w-48 lg:w-72 aspect-video bg-gray-900 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border-2 border-indigo-500/30 z-50 cursor-move hover:shadow-indigo-500/40 transition-shadow active:scale-95 duration-200"
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
        )
    }
            </div >

    {/* Controls Bar */ }
    < div className = "absolute bottom-0 left-0 w-full md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:w-max bg-gray-900/95 md:bg-gray-900/80 backdrop-blur-xl pt-6 pb-8 md:px-8 md:py-5 flex justify-evenly md:justify-center md:gap-4 items-center z-50 rounded-t-[2.5rem] md:rounded-full border-t border-white/10 md:border md:shadow-2xl transition-all" >

        {/* Pre-Call Actions */ }
{
    !callAccepted && !receivingCall && !isCalling && (
        <button
            onClick={() => callUser(partnerId)}
            className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-12 md:px-8 rounded-full transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 active:scale-95 mb-4 md:mb-0"
        >
            <Phone className="w-6 h-6" />
            <span className="text-lg">Start Call</span>
        </button>
    )
}

{/* Active Call Controls */ }
{
    (callAccepted || isCalling) && !callEnded && (
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
    )
}

{
    (callAccepted || isCalling) && (
        <button
            onClick={leaveCall}
            className="ml-4 p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200 shadow-lg shadow-red-500/30 active:scale-90 hover:rotate-90"
            title="End Call"
        >
            <Phone className="w-6 h-6 transform rotate-[135deg]" />
        </button>
    )
}

{/* Fallback Close if not in call */ }
{
    !callAccepted && !receivingCall && !isCalling && (
        <button
            onClick={onClose}
            className="p-4 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-all duration-200 active:scale-90"
            title="Close"
        >
            <X className="w-6 h-6" />
        </button>
    )
}
            </div >
        </div >
    );
};

export default VideoCall;

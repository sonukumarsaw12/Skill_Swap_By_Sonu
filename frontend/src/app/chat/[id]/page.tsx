"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import io, { Socket } from 'socket.io-client';
import axios from 'axios';
import {
    Send, Paperclip, Phone, Video, Calendar, Star, ArrowLeft,
    MoreVertical, Image as ImageIcon, Smile, Sun, Moon
} from 'lucide-react';

const MenuThemeToggle = ({ onClose }: { onClose: () => void }) => {
    const { theme, setTheme } = useTheme();
    return (
        <button
            onClick={() => {
                setTheme(theme === 'dark' ? 'light' : 'dark');
                onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
        >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-blue-500" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
    );
};

let socket: Socket;

import VideoCall from '@/components/VideoCall';
import ScheduleMeetingModal from '@/components/ScheduleMeetingModal';

import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/components/ThemeProvider';
import Toast from '@/components/Toast';

export default function Chat() {
    const [user, setUser] = useState<any>(null);
    const [partner, setPartner] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const router = useRouter();
    const { id } = useParams(); // Partner ID
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<any>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [partnerStatus, setPartnerStatus] = useState<'online' | 'offline'>('offline');
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Socket Ref
    const socketRef = useRef<any>(null);
    const [showVideoCall, setShowVideoCall] = useState(false);
    const [isVoiceOnlyCall, setIsVoiceOnlyCall] = useState(false);

    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    const fetchMessages = async (token: string) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/chat/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data);
        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.status === 401) {
                console.log("Session expired fetching messages");
                localStorage.removeItem('user');
                router.push('/login');
            }
        }
    };

    const fetchPartnerDetails = async (token: string) => {
        try {
            // Assuming this endpoint exists as per task list. 
            // If not, we might need to rely on passed data or create it.
            // Using a safe fallback if the dedicated endpoint isn't ready, 
            // but task.md said it IS ready.
            const res = await axios.get(`http://localhost:5000/api/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPartner(res.data);
        } catch (err) {
            console.error("Error fetching partner details:", err);
        }
    }

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        const userData = JSON.parse(storedUser);
        setUser(userData);

        // Fetch initial messages and partner details
        fetchMessages(userData.token);
        fetchPartnerDetails(userData.token);

        // Connect Socket
        socketInitializer(userData, id as string);

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [id, router]);

    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const uploadFileHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        setUploading(true);

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${user.token}`
                }
            }
            const { data } = await axios.post('http://localhost:5000/api/upload', formData, config);

            // Send message with file URL
            const msgData = {
                senderId: user._id,
                receiverId: id,
                message: file.name, // OR empty string if you prefer
                fileUrl: data // Path returned from backend
            };
            socketRef.current.emit('send_message', msgData);
            setUploading(false);

        } catch (error) {
            console.error(error);
            setUploading(false);
        }
    }

    const socketInitializer = async (userData: any, partnerId: string) => {
        socketRef.current = io('http://localhost:5000');

        socketRef.current.on('connect', () => {
            console.log('Connected to socket');
            socketRef.current.emit('join_room', userData._id);
            socketRef.current.emit('check_status', partnerId);
        });

        socketRef.current.on('user_status', (data: { userId: string, status: 'online' | 'offline' }) => {
            if (data.userId === partnerId) {
                setPartnerStatus(data.status);
            }
        });

        socketRef.current.on('receive_message', (msg: any) => {
            if (msg.sender === partnerId || msg.receiver === partnerId) {
                setMessages((prev) => [...prev, msg]);
                setIsTyping(false);
            }
        });

        socketRef.current.on('typing', (data: any) => {
            if (data.senderId === partnerId) setIsTyping(true);
        });

        socketRef.current.on('stop_typing', (data: any) => {
            if (data.senderId === partnerId) setIsTyping(false);
        });

        // Listen for incoming calls
        socketRef.current.on("callUser", (data: any) => {
            setShowVideoCall(true);
        });
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);

        if (!socketRef.current) return;

        socketRef.current.emit('typing', { senderId: user._id, receiverId: id });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            socketRef.current.emit('stop_typing', { senderId: user._id, receiverId: id });
        }, 2000);
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const msgData = {
            senderId: user._id,
            receiverId: id,
            message: newMessage
        };

        socketRef.current.emit('send_message', msgData);
        socketRef.current.emit('stop_typing', { senderId: user._id, receiverId: id });

        setNewMessage('');
    };

    const [showRatingModal, setShowRatingModal] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const submitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/reviews', {
                revieweeId: id,
                rating,
                comment
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setToast({ message: 'Review submitted successfully! ✅', type: 'success' });
            setShowRatingModal(false);
        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.status === 401) {
                setToast({ message: "Session expired. Please login again.", type: 'error' });
                localStorage.removeItem('user');
                router.push('/login');
            } else {
                setToast({ message: 'Error submitting review', type: 'error' });
            }
        }
    };

    if (!user) return (
        <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
            <p className="text-sm text-gray-400 font-mono animate-pulse">Connecting to encrypted channel...</p>
        </div>
    );

    return (
        <div className="flex flex-col h-[100dvh] bg-[#F3F4F6] dark:bg-[#0B0F19] transition-colors duration-500 relative overflow-hidden font-sans">

            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 dark:bg-purple-900/10 rounded-full blur-[120px] animate-blob"></div>
                <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-900/10 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-900/10 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
            </div>

            {/* Header */}
            <header className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl px-4 md:px-6 py-3 md:py-4 flex justify-between items-center z-20 border-b border-white/20 dark:border-white/5 sticky top-0 shadow-sm shrink-0">
                <div className="flex items-center gap-2 md:gap-4">

                    <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition">
                        <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-700 dark:text-gray-200" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg md:text-xl relative shadow-md overflow-hidden flex-shrink-0">
                            {partner?.profilePic ? (
                                <img src={partner.profilePic} alt={partner.name} className="w-full h-full object-cover" />
                            ) : (
                                <span>{partner?.name?.charAt(0).toUpperCase() || 'C'}</span>
                            )}
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-base md:text-lg font-bold text-gray-900 dark:text-white leading-tight truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
                                {partner?.name || 'Loading...'}
                            </h1>
                            <p className={`text-[10px] md:text-xs font-medium transition-colors ${isTyping ? 'text-indigo-500 animate-pulse' :
                                partnerStatus === 'online' ? 'text-green-500' : 'text-gray-400'
                                }`}>
                                {isTyping ? 'Typing...' : (partnerStatus === 'online' ? 'Online' : 'Offline')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 md:gap-3">
                    <button
                        onClick={() => {
                            setIsVoiceOnlyCall(true);
                            setShowVideoCall(true);
                        }}
                        className="p-2 md:p-3 bg-white/50 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-700 dark:text-gray-200 rounded-xl md:rounded-2xl transition border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800/50"
                        title="Voice Call"
                    >
                        <Phone className="w-5 h-5 md:w-5 md:h-5" />
                    </button>
                    <button
                        onClick={() => {
                            setIsVoiceOnlyCall(false);
                            setShowVideoCall(true);
                        }}
                        className="p-2 md:p-3 bg-white/50 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-700 dark:text-gray-200 rounded-xl md:rounded-2xl transition border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800/50"
                        title="Video Call"
                    >
                        <Video className="w-5 h-5 md:w-5 md:h-5" />
                    </button>

                    {/* Three-dot Menu */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 md:p-3 bg-white/50 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-700 dark:text-gray-200 rounded-xl md:rounded-2xl transition border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800/50 outline-none"
                        >
                            <MoreVertical className="w-5 h-5 md:w-5 md:h-5" />
                        </button>

                        {/* Dropdown */}
                        {showMenu && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#1A1F2E] border border-gray-100 dark:border-gray-800/50 rounded-2xl shadow-xl z-50 overflow-hidden transform origin-top-right animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-1.5 space-y-1">
                                    <button
                                        onClick={() => {
                                            setIsScheduleModalOpen(true);
                                            setShowMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                                    >
                                        <Calendar className="w-4 h-4 text-indigo-500" />
                                        Schedule Meeting
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowRatingModal(true);
                                            setShowMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                                    >
                                        <Star className="w-4 h-4 text-yellow-500" />
                                        Rate User
                                    </button>
                                    <div className="h-px bg-gray-100 dark:bg-gray-800 my-1"></div>
                                    <MenuThemeToggle onClose={() => setShowMenu(false)} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Video Call Modal */}
            {showVideoCall && socketRef.current && (
                <div className="fixed inset-0 z-50">
                    <VideoCall
                        socket={socketRef.current}
                        user={user}
                        partnerId={id as string}
                        isVoiceOnly={isVoiceOnlyCall}
                        onClose={() => {
                            setShowVideoCall(false);
                            setShowRatingModal(true);
                        }}
                    />
                </div>
            )}

            <ScheduleMeetingModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                organizerId={user._id}
                participantId={id as string}
            />

            {/* Rating Modal */}
            {showRatingModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-[2rem] shadow-2xl w-full max-w-sm md:max-w-md mx-4 border border-gray-100 dark:border-gray-800 transform scale-100 transition-all">
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 md:w-16 md:h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-500">
                                <Star className="w-7 h-7 md:w-8 md:h-8 fill-current" />
                            </div>
                            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Rate Session</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base mt-1">How was your experience?</p>
                        </div>

                        <form onSubmit={submitReview}>
                            <div className="mb-6 flex justify-center gap-2 md:gap-3">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className={`p-1.5 md:p-2 transition-transform hover:scale-110 focus:outline-none ${star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-700'}`}
                                    >
                                        <Star className="w-8 h-8 md:w-9 md:h-9 fill-current" />
                                    </button>
                                ))}
                            </div>

                            <div className="mb-6">
                                <textarea
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 ring-1 ring-inset ring-gray-200 dark:ring-gray-700/50 transition resize-none text-sm md:text-base"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Leave a comment (optional)..."
                                    rows={3}
                                ></textarea>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowRatingModal(false)}
                                    className="flex-1 py-3 px-6 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm md:text-base"
                                >
                                    Skip
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 px-6 rounded-xl bg-yellow-500 text-white font-bold hover:bg-yellow-600 shadow-lg shadow-yellow-500/30 transition text-sm md:text-base"
                                >
                                    Submit Review
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    isVisible={true}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-hide z-10 pb-32">
                {/* Date Separator (Mock) */}
                <div className="flex justify-center">
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-200/50 dark:bg-gray-800/50 px-3 py-1 rounded-full backdrop-blur-sm">Today</span>
                </div>

                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex w-full ${msg.sender === user._id ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] sm:max-w-[75%] md:max-w-[60%] px-4 py-2 relative group animate-in slide-in-from-bottom-2 duration-300 shadow-sm ${msg.sender === user._id
                                ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-[1.25rem] rounded-tr-none'
                                : 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-md text-gray-800 dark:text-gray-100 rounded-[1.25rem] rounded-tl-none border border-white/40 dark:border-gray-700/50'
                                }`}
                        >
                            {msg.fileUrl ? (
                                msg.fileUrl.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                                    <div className="mb-1 rounded-xl overflow-hidden border border-white/20">
                                        <img src={`http://localhost:5000${msg.fileUrl}`} alt="shared" className="max-w-full h-auto object-cover" />
                                    </div>
                                ) : (
                                    <a href={`http://localhost:5000${msg.fileUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-black/10 dark:bg-white/10 rounded-xl hover:bg-black/20 transition mb-1">
                                        <div className="p-2 bg-white dark:bg-gray-900 rounded-lg flex-shrink-0">
                                            <Paperclip className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <span className="text-sm font-medium underline decoration-dotted truncate underline-offset-2 break-all">{msg.message || 'Attached File'}</span>
                                    </a>
                                )
                            ) : (
                                <p className="text-sm md:text-[15px] leading-relaxed tracking-wide break-words whitespace-pre-wrap pr-4">{msg.message}</p>
                            )}

                            <div className={`text-[9px] md:text-[10px] font-medium mt-1 text-right ${msg.sender === user._id ? 'text-indigo-100/70' : 'text-gray-400'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-4 py-3 rounded-2xl rounded-tl-none text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            Typing...
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 w-full p-3 md:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] z-20 bg-gradient-to-t from-gray-100 via-gray-100/90 to-transparent dark:from-[#0B0F19] dark:via-[#0B0F19]/90 pt-8">
                <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex items-center gap-2 bg-white dark:bg-gray-900 p-1.5 md:p-2 rounded-[2rem] shadow-xl border border-gray-200 dark:border-gray-800 ring-1 ring-gray-100 dark:ring-gray-800/50">
                    <label className="cursor-pointer p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition text-gray-500 dark:text-gray-400 group">
                        <input
                            type="file"
                            className="hidden"
                            onChange={uploadFileHandler}
                            ref={fileInputRef}
                        />
                        <Paperclip className="w-5 h-5 group-hover:text-indigo-600 transition-colors" />
                    </label>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleInput}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 px-2 py-2 text-base"
                    />

                    {uploading && <span className="text-xs text-indigo-500 font-medium animate-pulse">Uploading...</span>}

                    <button
                        type="submit"
                        disabled={uploading || !newMessage.trim()}
                        className="p-2.5 md:p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:shadow-none transform active:scale-95 flex-shrink-0"
                    >
                        <Send className="w-5 h-5 ml-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { io } from 'socket.io-client';
import DashboardMeetings from '@/components/DashboardMeetings';
import VideoCall from '@/components/VideoCall';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Logo } from '@/components/Logo';
import { TypewriterEffect } from '@/components/TypewriterEffect';
import Toast from '@/components/Toast';
import { User, LogOut, Sparkles, MessageCircle, Clock, CheckCircle, ArrowRight } from 'lucide-react';

export default function Dashboard() {
    const [user, setUser] = useState<any>(null);
    const [socket, setSocket] = useState<any>(null);
    const [matches, setMatches] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [connections, setConnections] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeCall, setActiveCall] = useState<{
        partnerId: string;
        partnerName: string;
        meetingId?: string;
    } | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; isVisible: boolean }>({
        message: '',
        type: 'success',
        isVisible: false
    });
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
        } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);

            const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
            setSocket(newSocket);

            newSocket.emit('join_room', parsedUser._id);

            newSocket.on('new_request', (request: any) => {
                fetchRequests(parsedUser.token);
            });

            newSocket.on('request_accepted', (data: any) => {
                fetchConnections(parsedUser.token);
                fetchRequests(parsedUser.token);
            });

            newSocket.on('user_updated', (data: any) => {
                fetchMatches(parsedUser.token);
                fetchRequests(parsedUser.token);
                fetchConnections(parsedUser.token);
            });

            fetchMatches(parsedUser.token);
            fetchRequests(parsedUser.token);
            fetchConnections(parsedUser.token);

            return () => {
                newSocket.disconnect();
            };
        }
    }, [router]);

    // Listen for custom toast event
    useEffect(() => {
        const handleToastObj = (e: any) => {
            setToast({ message: e.detail.message, type: e.detail.type, isVisible: true });
        };
        window.addEventListener('show-toast', handleToastObj);
        return () => window.removeEventListener('show-toast', handleToastObj);
    }, []);

    const fetchMatches = async (token: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/matches`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setMatches(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async (token: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setRequests(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchConnections = async (token: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/requests/accepted`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setConnections(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleConnect = async (receiverId: string) => {
        setMatches(prev => prev.map(m =>
            m._id === receiverId ? { ...m, connectionStatus: 'pending' } : m
        ));

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({ receiverId })
            });

            if (!res.ok) {
                fetchMatches(user.token);
                setToast({ message: 'Failed to send request', type: 'error', isVisible: true });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAccept = async (requestId: string) => {
        const acceptedRequest = requests.find(r => r._id === requestId);
        setRequests(prev => prev.filter(req => req._id !== requestId));

        if (acceptedRequest) {
            setConnections(prev => [...prev, {
                _id: 'temp_' + Date.now(),
                sender: acceptedRequest.sender,
                receiver: user,
                status: 'accepted'
            }]);
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/requests/${requestId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({ status: 'accepted' })
            });

            if (res.ok) {
                fetchRequests(user.token);
                fetchConnections(user.token);
            } else {
                fetchRequests(user.token);
                setToast({ message: 'Failed to accept request', type: 'error', isVisible: true });
            }
        } catch (err) {
            console.error(err);
            fetchRequests(user.token);
        }
    };

    if (!user) return (
        <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col items-center justify-center space-y-4">
            <div className="animate-bounce">
                <Logo />
            </div>
            <div className="w-48 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="w-full h-full bg-indigo-500 origin-left animate-[progress_1s_ease-in-out_infinite]"></div>
            </div>
            <p className="text-sm text-gray-400 font-mono animate-pulse">Initializing...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#0B0F19] transition-colors duration-500 overflow-x-hidden relative font-sans">
            {/* Ambient Background Glows */}
            <div className="fixed top-0 left-0 w-screen h-screen overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/20 dark:bg-purple-900/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 dark:bg-blue-900/20 rounded-full blur-[100px] animate-pulse delay-700"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-indigo-500/20 dark:bg-indigo-900/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
            </div>

            <div className="max-w-7xl mx-auto space-y-8 relative z-10 p-4 md:p-8">
                {/* Navbar */}
                {/* Navbar */}
                <nav className="flex flex-row justify-between items-center bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl md:backdrop-blur-2xl px-4 md:px-6 py-3 md:py-4 rounded-2xl shadow-sm border border-white/40 dark:border-white/5 transition-all sticky top-2 md:top-4 z-50">
                    <div className="transform hover:scale-105 transition-transform duration-300 scale-90 md:scale-100 origin-left">
                        <Logo />
                    </div>

                    <div className="flex gap-2 md:gap-4 items-center">
                        <div className="scale-90 md:scale-100">
                            <ThemeToggle />
                        </div>

                        <div className="h-6 md:h-8 w-[1px] bg-gray-300 dark:bg-gray-700 mx-1 md:mx-2 hidden md:block"></div>

                        <Link href="/profile" className="flex items-center gap-2 md:gap-3 pl-1 pr-2 md:pr-4 py-1 bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 rounded-full hover:bg-white dark:hover:bg-gray-800 transition-all font-medium border border-gray-200 dark:border-gray-700 shadow-sm group">
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border border-gray-300 dark:border-gray-600 group-hover:border-indigo-500 transition-colors">
                                {user.profilePic ? (
                                    <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <User className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                            <span className="hidden md:inline text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Profile</span>
                        </Link>

                        <button
                            onClick={() => {
                                setToast({ message: 'Logging out...', type: 'success', isVisible: true });
                                setTimeout(() => {
                                    localStorage.removeItem('user');
                                    router.push('/');
                                }, 800);
                            }}
                            className="p-2 md:p-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-all shadow-sm group border border-transparent hover:border-red-200 dark:hover:border-red-800 active:scale-95"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </nav>

                {/* Hero Welcome Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-2 md:px-4 py-4 md:py-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-900 to-gray-900 dark:from-white dark:via-indigo-200 dark:to-white bg-clip-text text-transparent tracking-tight">
                                Hello, {user.name.split(' ')[0]}
                            </h1>
                            <span className="text-3xl sm:text-4xl md:text-5xl animate-bounce delay-1000 origin-bottom">👋</span>
                        </div>

                        <div className="h-8">
                            <TypewriterEffect
                                phrases={[
                                    "Ready to switch skills today?",
                                    "Learn something entirely new.",
                                    "Teach what you love.",
                                    "Connect with global experts."
                                ]}
                            />
                        </div>
                    </div>
                    <div className="mt-6 md:mt-0 text-left md:text-right">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-xl border border-white/20 dark:border-white/5 text-sm font-mono text-gray-500 dark:text-gray-400 shadow-sm hover:scale-105 transition-transform cursor-default">
                            <Clock className="w-4 h-4" />
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Left Sidebar - Profile & Schedule (Span 4) */}
                    <div className="md:col-span-4 space-y-6">

                        {/* Upcoming Meetings Card */}
                        <div className="group bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl p-1 rounded-[2rem] shadow-xl shadow-indigo-500/5 border border-white/60 dark:border-gray-700/60 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1">
                            <div className="bg-gradient-to-br from-white/50 to-white/20 dark:from-gray-800/50 dark:to-gray-800/20 p-6 rounded-[1.8rem] h-full">
                                <DashboardMeetings onJoinCall={(partnerId, meetingId, partnerName) => {
                                    setActiveCall({
                                        partnerId,
                                        meetingId,
                                        partnerName
                                    });
                                }} />
                            </div>
                        </div>

                        {/* My Skills Card */}
                        <div className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl shadow-purple-500/5 border border-white/60 dark:border-gray-700/60 transition-all hover:shadow-2xl hover:shadow-purple-500/10">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                                    <Sparkles className="w-5 h-5 text-yellow-500" /> My Skills
                                </h2>
                                <Link href="/profile" className="text-xs font-semibold px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition">
                                    EDIT
                                </Link>
                            </div>

                            <div className="space-y-6 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Teaching</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {user.skillsKnown && user.skillsKnown.length > 0 ? (
                                            user.skillsKnown.map((skill: string, index: number) => (
                                                <span key={index} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-semibold border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                                                    {skill}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">No skills listed yet.</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Learning</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {user.skillsToLearn && user.skillsToLearn.length > 0 ? (
                                            user.skillsToLearn.map((skill: string, index: number) => (
                                                <span key={index} className="px-3 py-1.5 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 rounded-lg text-sm font-semibold border border-purple-100 dark:border-purple-500/20 shadow-sm">
                                                    {skill}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">No interests listed yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* My Connections Minimal */}
                        <div className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl shadow-blue-500/5 border border-white/60 dark:border-gray-700/60 h-fit">
                            <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-blue-500" /> Connections
                            </h2>
                            {connections.length === 0 ? <p className="text-gray-400 text-sm">No connections yet.</p> : (
                                <ul className="space-y-3 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                                    {connections.map((conn) => {
                                        const partner = conn.sender._id === user._id ? conn.receiver : conn.sender;
                                        return (
                                            <li key={conn._id} className="flex justify-between items-center bg-white/40 dark:bg-gray-700/40 p-3 rounded-2xl border border-white/20 dark:border-white/5 hover:bg-white/80 dark:hover:bg-gray-700/60 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                        {partner.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{partner.name}</p>
                                                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Connected</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => router.push(`/chat/${partner._id}`)}
                                                    className="p-2 bg-indigo-100 dark:bg-indigo-600/80 text-indigo-700 dark:text-white rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-500 transition-colors shadow-sm"
                                                    title="Chat"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Recommendations & Requests (Span 8) */}
                    <div className="md:col-span-8 space-y-8">

                        {/* Interactive Requests Section */}
                        <div className="bg-gradient-to-r from-orange-50 to-rose-50 dark:from-orange-900/10 dark:to-rose-900/10 p-6 rounded-[2rem] border border-orange-100 dark:border-orange-500/20">
                            <h2 className="text-lg font-bold text-orange-800 dark:text-orange-200 mb-4 flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full bg-orange-500 ${requests.length > 0 ? 'animate-pulse' : ''}`}></div>
                                Pending Requests
                            </h2>

                            {requests.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[240px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-orange-200 dark:scrollbar-thumb-orange-800 scrollbar-track-transparent">
                                    {requests.map((req) => (
                                        <div key={req._id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">{req.sender.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Wants to learn: <span className="text-indigo-500">{req.sender.skillsToLearn.join(', ')}</span>
                                                </p>
                                            </div>
                                            {req.status === 'pending' ? (
                                                <button
                                                    onClick={() => handleAccept(req._id)}
                                                    className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold hover:scale-105 transition-transform"
                                                >
                                                    Accept
                                                </button>
                                            ) : (
                                                <span className="text-green-500 text-sm font-bold flex items-center gap-1">
                                                    <CheckCircle className="w-4 h-4" /> Accepted
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-400 dark:text-gray-500 text-sm italic">No pending requests at the moment.</p>
                                </div>
                            )}
                        </div>

                        {/* Recommendation Engine */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recommended for You</h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Based on your skills and interests</p>
                                </div>
                                <button
                                    onClick={() => fetchMatches(user.token)}
                                    className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition flex items-center gap-2 text-sm font-medium shadow-sm hover:shadow"
                                >
                                    <span className={loading ? 'animate-spin' : ''}>↻</span> Refresh
                                </button>
                            </div>

                            {loading ? (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700/60 relative overflow-hidden">
                                            <div className="animate-pulse flex gap-5">
                                                <div className="w-20 h-20 rounded-2xl bg-gray-200 dark:bg-gray-700"></div>
                                                <div className="flex-1 space-y-3 pt-2">
                                                    <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                                    <div className="flex gap-2">
                                                        <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                                                        <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-6 space-y-2 animate-pulse">
                                                <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                                <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                            </div>
                                            <div className="mt-5 grid grid-cols-2 gap-3 animate-pulse">
                                                <div className="h-16 bg-gray-100 dark:bg-gray-700/50 rounded-2xl"></div>
                                                <div className="h-16 bg-gray-100 dark:bg-gray-700/50 rounded-2xl"></div>
                                            </div>
                                            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 animate-pulse">
                                                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : matches.length === 0 ? (
                                <div className="text-center py-16 bg-white/50 dark:bg-gray-800/50 rounded-[3rem] border border-dashed border-gray-300 dark:border-gray-700">
                                    <p className="text-xl font-medium text-gray-500">No matches found right now.</p>
                                    <p className="text-sm text-gray-400 mt-2">Try updating your skills in profile!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    {matches.map((match) => (
                                        <div key={match._id} className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700/60 hover:shadow-xl dark:hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                                            {/* Decorative Gradient Blob */}
                                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-colors"></div>

                                            {match.isPerfectMatch && (
                                                <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-orange-500/30 z-10 flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3" /> Perfect Match
                                                </div>
                                            )}

                                            <div className="relative z-10 flex gap-5">
                                                {/* Avatar */}
                                                <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 overflow-hidden shadow-inner ring-1 ring-black/5 dark:ring-white/10 flex-shrink-0">
                                                    {match.profilePic ? (
                                                        <img src={match.profilePic} alt={match.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 text-gray-500 dark:text-gray-300 font-bold text-2xl">
                                                            {match.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info with padding-right to avoid badge overlap */}
                                                <div className="flex-1 pr-24 pt-1">
                                                    <h3 className="font-bold text-xl text-gray-900 dark:text-white leading-tight mb-1">
                                                        {match.name}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        {match.rating > 0 && (
                                                            <span className="flex items-center gap-1 text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-700/50">
                                                                ★ {match.rating.toFixed(1)}
                                                            </span>
                                                        )}
                                                        <span className="text-xs font-medium text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800/30">
                                                            {match.title || 'SkillSwap Member'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bio Preview */}
                                            {match.bio && (
                                                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed relative z-10 pl-1">
                                                    "{match.bio}"
                                                </p>
                                            )}

                                            {/* Skills Grid */}
                                            <div className="mt-5 grid grid-cols-2 gap-3 relative z-10">
                                                <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-3 rounded-2xl border border-emerald-100/50 dark:border-emerald-500/10">
                                                    <span className="block text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Teaches</span>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{match.skillsKnown.join(', ')}</p>
                                                </div>
                                                <div className="bg-purple-50/50 dark:bg-purple-900/10 p-3 rounded-2xl border border-purple-100/50 dark:border-purple-500/10">
                                                    <span className="block text-[10px] font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">Learns</span>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{match.skillsToLearn.join(', ')}</p>
                                                </div>
                                            </div>

                                            <div className="mt-6 border-t border-gray-100 dark:border-gray-700 pt-4">
                                                {match.connectionStatus === 'accepted' ? (
                                                    <button
                                                        onClick={() => router.push(`/chat/${match._id}`)}
                                                        className="w-full py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 font-medium"
                                                    >
                                                        <MessageCircle className="w-4 h-4" /> Message
                                                    </button>
                                                ) : match.connectionStatus === 'pending' ? (
                                                    <button disabled className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-400 rounded-xl font-medium cursor-not-allowed text-sm">
                                                        Request Sent
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleConnect(match._id)}
                                                        className="w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2 font-bold shadow-lg shadow-gray-900/10 dark:shadow-white/10 group-hover:shadow-indigo-500/30"
                                                    >
                                                        Connect <ArrowRight className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Call Overlay */}
            {activeCall && user && socket && (
                <VideoCall
                    socket={socket}
                    user={user}
                    partnerId={activeCall.partnerId}
                    meetingId={activeCall.meetingId}
                    partnerName={activeCall.partnerName}
                    onClose={() => setActiveCall(null)}
                />
            )}

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </div>
    );
}

import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Video } from 'lucide-react';
import axios from 'axios';

interface Meeting {
    _id: string;
    title: string;
    start: Date;
    description: string;
    organizer: { _id: string, name: string };
    participant: { _id: string, name: string };
    startTime: string;
    duration: number;
    status: string;
}

const DashboardMeetings: React.FC<{ onJoinCall?: (partnerId: string) => void }> = ({ onJoinCall }) => {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMeetings = async () => {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) return;
            const user = JSON.parse(storedUser);

            try {
                const { data } = await axios.get(`http://localhost:5000/api/meetings/user/${user._id}`);
                setMeetings(data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching meetings:", error);
                setLoading(false);
            }
        };

        fetchMeetings();
    }, []);

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    if (loading) return (
        <div className="space-y-4">
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700/50 rounded-lg animate-pulse mb-4"></div>
            {[1, 2].map((i) => (
                <div key={i} className="bg-white/50 dark:bg-gray-700/30 p-4 rounded-2xl border border-white/20 dark:border-white/5 shadow-sm space-y-3 animate-pulse">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                            <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-600/50 rounded-md"></div>
                            <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-600/50 rounded-md"></div>
                            <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-600/50 rounded-md mt-2"></div>
                        </div>
                        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-600/50 rounded-full"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    if (meetings.length === 0) {
        return (
            <div className="bg-transparent flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 py-6">
                <Calendar className="w-10 h-10 mb-2 opacity-30 text-indigo-400 dark:text-indigo-300" />
                <p className="text-sm">No upcoming sessions.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2 bg-gradient-to-r from-indigo-700 to-purple-700 dark:from-indigo-300 dark:to-purple-300 bg-clip-text text-transparent">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Upcoming Sessions
            </h3>
            <div className="grid gap-3">
                {meetings.map((meeting) => {
                    const storedUser = localStorage.getItem('user');
                    const currentUser = storedUser ? JSON.parse(storedUser) : null;
                    const partner = currentUser?._id === meeting.organizer._id ? meeting.participant : meeting.organizer;

                    return (
                        <div key={meeting._id} className="bg-white/50 dark:bg-gray-700/30 p-4 rounded-2xl shadow-sm border border-white/20 dark:border-white/5 hover:bg-white/80 dark:hover:bg-gray-700/50 transition-all flex justify-between items-center group backdrop-blur-sm">
                            <div>
                                <h4 className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">{meeting.title}</h4>
                                <p className="text-sm font-medium text-indigo-500 dark:text-indigo-400">with {partner?.name || 'User'}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    {formatDate(meeting.startTime)} ({meeting.duration} min)
                                </p>
                                {meeting.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic line-clamp-1">{meeting.description}</p>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                    ${meeting.status === 'confirmed' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' :
                                        meeting.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'}`}>
                                    {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                                </span>
                                {/* In a real app, this would link to the specific meeting room or chat */}
                                {['confirmed', 'pending'].includes(meeting.status) && (
                                    <button
                                        onClick={() => onJoinCall?.(partner?._id)}
                                        className="mt-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-500/30 flex items-center gap-1.5 transition-all transform translate-y-0 opacity-100 lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100"
                                    >
                                        <Video className="w-3 h-3" /> Join
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DashboardMeetings;

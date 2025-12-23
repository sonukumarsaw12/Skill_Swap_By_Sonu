import React, { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import Toast from './Toast';

interface ScheduleMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    organizerId: string;
    participantId: string;
}

const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
    isOpen,
    onClose,
    organizerId,
    participantId
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState(60);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; isVisible: boolean } | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Combine date and time
            const startDateTime = new Date(`${date}T${time}`);

            const res = await fetch('http://localhost:5000/api/meetings/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${token}` // If auth is needed later
                },
                body: JSON.stringify({
                    organizerId,
                    participantId,
                    title,
                    description,
                    startTime: startDateTime,
                    duration
                })
            });

            if (!res.ok) {
                throw new Error('Failed to schedule meeting');
            }

            setToast({ message: 'Meeting scheduled successfully!', type: 'success', isVisible: true });

            // Close after delay
            setTimeout(() => {
                onClose();
                setTitle('');
                setDescription('');
                setToast(null);
            }, 2000);

        } catch (error) {
            console.error(error);
            setToast({ message: 'Error scheduling meeting', type: 'error', isVisible: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    isVisible={toast.isVisible}
                    onClose={() => setToast(null)}
                />
            )}
            <div className="bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-xl rounded-[2rem] w-full max-w-md shadow-2xl border border-white/20 dark:border-white/10 ring-1 ring-black/5 overflow-hidden transform transition-all">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200/50 dark:border-white/5">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Schedule a Session
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Title
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200/50 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all"
                            placeholder="e.g. React Optimization Refactoring"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Date
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="date"
                                    required
                                    className="w-full pl-10 px-4 py-3 rounded-xl border border-gray-200/50 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all dark:calendar-invert"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Time
                            </label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="time"
                                    required
                                    className="w-full pl-10 px-4 py-3 rounded-xl border border-gray-200/50 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all dark:calendar-invert"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description (Optional)
                        </label>
                        <textarea
                            className="w-full px-4 py-3 rounded-xl border border-gray-200/50 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all resize-none"
                            rows={3}
                            placeholder="What do you want to cover?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-500/20 transform transition active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Scheduling...' : 'Confirm Meeting'}
                    </button>

                </form>
            </div>
        </div>
    );
};

export default ScheduleMeetingModal;

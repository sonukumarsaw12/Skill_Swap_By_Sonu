import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error';
    isVisible: boolean;
    onClose: () => void;
}

export default function Toast({ message, type = 'success', isVisible, onClose }: ToastProps) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000); // Auto close after 3 seconds
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed top-20 right-5 z-50 animate-in fade-in slide-in-from-top-5 duration-300">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${type === 'success'
                    ? 'bg-white/90 dark:bg-gray-800/90 border-green-500/20 text-green-800 dark:text-green-200'
                    : 'bg-white/90 dark:bg-gray-800/90 border-red-500/20 text-red-800 dark:text-red-200'
                }`}>
                <div className={`p-2 rounded-full ${type === 'success' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    {type === 'success' ? (
                        <CheckCircle className={`w-5 h-5 ${type === 'success' ? 'text-green-600 dark:text-green-400' : ''}`} />
                    ) : (
                        <XCircle className={`w-5 h-5 ${type === 'error' ? 'text-red-600 dark:text-red-400' : ''}`} />
                    )}
                </div>

                <div className="flex flex-col">
                    <span className="font-bold text-sm">{type === 'success' ? 'Success' : 'Error'}</span>
                    <span className="text-sm opacity-90">{message}</span>
                </div>

                <button onClick={onClose} className="ml-4 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition">
                    <X className="w-4 h-4 opacity-50" />
                </button>
            </div>
        </div>
    );
}

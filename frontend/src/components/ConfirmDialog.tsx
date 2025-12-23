"use client";

import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger'
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onCancel}
            ></div>

            {/* Dialog Content */}
            <div className="relative bg-gray-900/90 backdrop-blur-xl border border-gray-700 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 fade-in duration-200 scale-100">
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-2 ${type === 'danger' ? 'bg-red-500/20 text-red-500' :
                            type === 'warning' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'
                        }`}>
                        <AlertTriangle className="w-8 h-8" />
                    </div>

                    <h3 className="text-2xl font-bold text-white">{title}</h3>
                    <p className="text-gray-400 leading-relaxed">{message}</p>

                    <div className="flex gap-3 w-full mt-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-medium transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 px-4 py-3 text-white rounded-xl font-bold shadow-lg transition-all transform active:scale-95 ${type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' :
                                    type === 'warning' ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                                }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

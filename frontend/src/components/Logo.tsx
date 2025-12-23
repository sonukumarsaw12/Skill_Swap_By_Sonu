import React from 'react';
import { ArrowRightLeft, Sparkles } from 'lucide-react';

export const Logo = () => {
    return (
        <div className="flex items-center gap-2 group cursor-pointer">
            <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
                <ArrowRightLeft className="w-5 h-5 text-white transform group-hover:rotate-180 transition-transform duration-500" />
                <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent leading-none tracking-tight">
                    Skill<span className="text-indigo-600 dark:text-indigo-400">Swap</span>
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase">
                    Learn & Teach
                </span>
            </div>
        </div>
    );
};

'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-black/5 dark:hover:border-white/10 active:scale-90 active:rotate-12"
            title="Toggle Theme"
        >
            <div className="relative w-6 h-6">
                <Sun className={`absolute h-6 w-6 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${theme === 'dark' ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 text-amber-500'}`} />
                <Moon className={`absolute h-6 w-6 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${theme === 'dark' ? 'scale-100 rotate-0 text-blue-400' : 'scale-0 -rotate-90 opacity-0'}`} />
            </div>
            <span className="sr-only">Toggle theme</span>
        </button>
    );
}

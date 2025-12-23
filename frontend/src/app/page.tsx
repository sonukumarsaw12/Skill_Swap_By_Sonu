"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Code, Palette, BookOpen, Zap, Layers, Globe, Smartphone, Database, Menu, X } from 'lucide-react';
import { TypewriterEffect } from '@/components/TypewriterEffect';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGetStarted = () => {
    const user = localStorage.getItem('user');
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#0B0F19] overflow-hidden relative font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-500">

      {/* Animated Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/20 dark:bg-purple-900/20 rounded-full blur-[80px] md:blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 dark:bg-blue-900/20 rounded-full blur-[80px] md:blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-indigo-500/20 dark:bg-indigo-900/20 rounded-full blur-[80px] md:blur-[100px] animate-blob animation-delay-4000"></div>
      </div>

      {/* Navbar */}
      <nav className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-3 group cursor-pointer z-50" onClick={() => router.push('/')}>
          <div className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl blur opacity-75 group-hover:opacity-100 animate-pulse transition-opacity duration-500"></div>
            <div className="relative w-full h-full bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 transform group-hover:rotate-12 group-hover:scale-105 transition-all duration-300 border border-white/20 ring-1 ring-white/20">
              <Layers className="w-5 h-5 md:w-6 md:h-6 text-white transform group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white dark:border-black shadow-lg animate-bounce delay-700">
              <Zap className="w-1.5 h-1.5 md:w-2 md:h-2 text-white fill-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl md:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-indigo-800 to-gray-600 dark:from-white dark:via-indigo-200 dark:to-gray-400 tracking-tight leading-none">SkillSwap</span>
            <span className="hidden md:block text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-[0.2em] mt-0.5">Learn • Teach • Grow</span>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex gap-4 items-center">
          <ThemeToggle />
          <button onClick={() => router.push('/login')} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Login</button>
          <button onClick={() => router.push('/signup')} className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full text-sm font-bold hover:scale-105 transition-transform">Sign Up</button>
        </div>

        {/* Mobile Nav Toggle */}
        <div className="flex md:hidden items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-xl border border-gray-200 dark:border-gray-800"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-xl md:hidden pt-24 px-6 flex flex-col gap-6 animate-in slide-in-from-top-10 duration-200">
          <div className="flex flex-col gap-4">
            <button
              onClick={() => router.push('/login')}
              className="w-full py-4 text-center text-lg font-medium text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800"
            >
              Login
            </button>
            <button
              onClick={() => router.push('/signup')}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-lg font-bold shadow-lg shadow-indigo-500/20"
            >
              Sign Up Free
            </button>
          </div>

          <div className="mt-auto mb-10 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">SkillSwap Inc.</p>
          </div>
        </div>
      )}

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen w-full px-4 pt-32 pb-12 md:pt-40 md:pb-20 text-center">

        {/* 3D Floating Icons - Position optimized for mobile & tablet */}
        <div className="absolute top-[15%] left-4 md:left-[10%] lg:left-1/4 animate-bounce delay-100 opacity-20 dark:opacity-10 pointer-events-none scale-75 md:scale-90 lg:scale-100">
          <Code className="w-12 h-12 text-blue-500 rotate-12" />
        </div>
        <div className="absolute bottom-[10%] right-4 md:right-[10%] lg:right-1/4 animate-bounce delay-700 opacity-20 dark:opacity-10 pointer-events-none scale-75 md:scale-90 lg:scale-100">
          <Palette className="w-12 h-12 text-purple-500 -rotate-12" />
        </div>
        <div className="absolute top-[20%] right-6 md:right-[15%] animate-pulse delay-500 opacity-20 dark:opacity-10 pointer-events-none hidden md:block">
          <Globe className="w-10 h-10 text-emerald-500 rotate-6" />
        </div>
        <div className="absolute bottom-[20%] left-10 md:left-[15%] animate-pulse delay-300 opacity-20 dark:opacity-10 pointer-events-none hidden md:block">
          <Database className="w-10 h-10 text-orange-500 -rotate-6" />
        </div>

        {/* Hero Content */}
        <div className="max-w-5xl space-y-6 md:space-y-8 relative z-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Zap className="w-3 h-3" /> The Future of Learning
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-1000 px-2">
            Teach what you <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">love</span>.<br />
            <span className="relative inline-block mt-1 md:mt-2">
              Learn what you
              <span className="absolute -bottom-1 md:-bottom-3 left-0 w-full h-2 md:h-4 bg-yellow-300/30 dark:bg-yellow-600/20 -rotate-1 rounded-full"></span>
            </span>
          </h1>

          <div className="h-12 md:h-20 flex items-center justify-center text-lg sm:text-xl md:text-3xl font-medium text-gray-500 dark:text-gray-400 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200 px-4">
            {mounted && <TypewriterEffect
              phrases={[
                "Connect with peers.",
                "Share your expertise.",
                "Master new skills.",
                "Grow together."
              ]}
            />}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-6 md:mt-10 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500 w-full max-w-sm sm:max-w-none mx-auto">
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto group relative px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden"
            >
              <span className="relative z-10">Get Started Now</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-gray-100 dark:to-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            <button
              onClick={() => router.push('/about')}
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-white/5 backdrop-blur-sm text-gray-700 dark:text-gray-200 rounded-2xl font-bold text-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all flex items-center justify-center gap-2"
            >
              <BookOpen className="w-5 h-5" /> Learn More
            </button>
          </div>
        </div>

        {/* Glassmorphism Stats Card */}
        <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 w-full max-w-7xl px-2 md:px-0 animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-700">
          {[
            {
              icon: <Zap className="w-6 h-6 text-yellow-500" />,
              title: 'Smart Matching',
              desc: 'Our algorithm connects you with the perfect partner based on mutual skills and interests.'
            },
            {
              icon: <Layers className="w-6 h-6 text-blue-500" />,
              title: 'Real-time Connect',
              desc: 'Chat instantly, see live status updates, and manage requests without refreshing.'
            },
            {
              icon: <Palette className="w-6 h-6 text-purple-500" />,
              title: 'Premium Design',
              desc: 'Experience a stunning glassmorphism UI with smooth animations and dark mode.'
            },
            {
              icon: <Globe className="w-6 h-6 text-emerald-500" />,
              title: 'Global Community',
              desc: 'Join a worldwide network of learners sharing knowledge across borders.'
            }
          ].map((feature, i) => (
            <div key={i} className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-6 rounded-3xl border border-white/40 dark:border-white/5 text-left shadow-lg shadow-indigo-500/5 hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group">
              <div className="mb-4 p-3 bg-white/50 dark:bg-white/5 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}

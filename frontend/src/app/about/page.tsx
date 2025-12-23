"use client";

import Link from 'next/link';
import { TypewriterEffect } from '@/components/TypewriterEffect';
import { ArrowLeft, Users, Zap, Globe, Code, Target, Cpu, Puzzle, Rocket, Sparkles } from 'lucide-react';

export default function About() {
    return (
        <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#0B0F19] font-sans text-gray-900 dark:text-gray-100 overflow-hidden relative selection:bg-indigo-500 selection:text-white transition-colors duration-500">

            {/* Animated Background Blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 dark:bg-purple-900/10 rounded-full blur-[120px] animate-blob"></div>
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-900/10 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-900/10 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
            </div>

            {/* Floating 3D Icons */}
            <div className="absolute top-20 right-[10%] animate-bounce delay-700 opacity-20 dark:opacity-10 pointer-events-none hidden md:block">
                <Puzzle className="w-16 h-16 text-pink-500 rotate-12" />
            </div>
            <div className="absolute bottom-40 left-[5%] animate-pulse delay-500 opacity-20 dark:opacity-10 pointer-events-none hidden md:block">
                <Rocket className="w-12 h-12 text-orange-500 -rotate-45" />
            </div>
            <div className="absolute top-1/3 left-[15%] animate-bounce delay-200 opacity-10 dark:opacity-5 pointer-events-none hidden md:block">
                <Sparkles className="w-10 h-10 text-yellow-400" />
            </div>

            <nav className="relative z-50 p-6 flex items-center">
                <Link href="/" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
                </Link>
            </nav>

            <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 space-y-20">

                {/* Hero Section */}
                <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
                        <Target className="w-3 h-3" /> Our Mission
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                        Democratizing Education <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Through Connection</span>
                    </h1>

                    <div className="h-24 flex items-center justify-center">
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                            <TypewriterEffect
                                phrases={[
                                    "Breaking down barriers.",
                                    "Connecting curious minds.",
                                    "Learning without limits.",
                                    "SkillSwap is a movement."
                                ]}
                            />
                        </p>
                    </div>

                </div>

                {/* What is Skill Swap? */}
                <div className="text-center max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                    <div className="p-8 bg-white/40 dark:bg-gray-800/20 backdrop-blur-md rounded-[2.5rem] border border-white/40 dark:border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <h2 className="text-3xl font-bold mb-4">What is Skill Swap?</h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                            SkillSwap is a <span className="text-indigo-600 dark:text-indigo-400 font-bold">collaborative learning network</span> where money doesn't matter—only your knowledge does. It's a place where a developer teaches coding to a guitarist in exchange for music lessons. We believe everyone is an expert in something.
                        </p>
                    </div>
                </div>

                {/* How It Works - 3 Steps */}
                <div className="grid md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
                    {[
                        { title: '1. Discover', icon: <Target className="w-8 h-8 text-blue-500" />, desc: 'Browse profiles and find peers who have the skills you want to learn.' },
                        { title: '2. Connect', icon: <Users className="w-8 h-8 text-purple-500" />, desc: 'Send a request and chat instantly to align your goals and schedules.' },
                        { title: '3. Exchange', icon: <Puzzle className="w-8 h-8 text-pink-500" />, desc: 'Meet virtually, share your expertise, and grow together.' },
                    ].map((step, i) => (
                        <div key={i} className="bg-white/50 dark:bg-gray-800/30 backdrop-blur-md p-6 rounded-3xl border border-white/30 dark:border-white/5 text-center hover:scale-105 transition-transform duration-300 shadow-lg">
                            <div className="w-16 h-16 mx-auto bg-white dark:bg-gray-700/50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                                {step.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{step.desc}</p>
                        </div>
                    ))}
                </div>

                {/* The Problem & Solution Grid */}
                <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                    <div className="bg-white/60 dark:bg-gray-800/40 backdrop-blur-xl p-8 rounded-[2rem] border border-white/50 dark:border-white/5 shadow-xl shadow-red-500/5 hover:-translate-y-1 transition-transform">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-6 text-red-600 dark:text-red-400">
                            <Users className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">The Problem: Isolation</h2>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            Self-learning is lonely. Tutorials are passive. Learners often hit meaningful roadblocks without anyone to guide them, leading to frustration and abandonment of goals.
                        </p>
                    </div>

                    <div className="bg-white/60 dark:bg-gray-800/40 backdrop-blur-xl p-8 rounded-[2rem] border border-white/50 dark:border-white/5 shadow-xl shadow-emerald-500/5 hover:-translate-y-1 transition-transform">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
                            <Zap className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">The Solution: Connection</h2>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            We bridge the gap. By bartering skills—"I'll teach you coding if you teach me design"—we create a symbiotic ecosystem where knowledge flows freely and instantly.
                        </p>
                    </div>
                </div>

                {/* Tech Stack Section */}
                <div className="bg-gradient-to-br from-gray-900 to-black dark:from-white dark:to-gray-100 text-white dark:text-black rounded-[3rem] p-10 md:p-16 relative overflow-hidden animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-400 shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/30 rounded-full blur-[80px]"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="flex-1 space-y-6">
                            <h2 className="text-3xl font-bold flex items-center gap-3">
                                <Cpu className="w-8 h-8" /> Under the Hood
                            </h2>
                            <p className="text-gray-300 dark:text-gray-600 text-lg leading-relaxed">
                                Built with modern performance in mind. We utilize <strong>Socket.IO</strong> for real-time bi-directional events, ensuring that when you match or chat, it happens instantly—no refreshing required.
                            </p>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2"><div className="w-2 h-2 bg-green-400 rounded-full"></div> Real-time WebSocket Connections</li>
                                <li className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-400 rounded-full"></div> Next.js 14 App Router</li>
                                <li className="flex items-center gap-2"><div className="w-2 h-2 bg-purple-400 rounded-full"></div> MongoDB Aggregations</li>
                            </ul>
                        </div>
                        <div className="w-full md:w-auto flex justify-center">
                            <div className="w-32 h-32 md:w-40 md:h-40 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 flex items-center justify-center transform rotate-6 hover:rotate-12 transition-transform duration-500">
                                <Code className="w-16 h-16 text-indigo-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Call to Action */}
                <div className="text-center pb-20 pt-10 animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-500">
                    <h3 className="text-2xl font-bold mb-6">Ready to join the revolution?</h3>
                    <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-full font-bold text-lg hover:bg-indigo-700 hover:scale-105 transition-all shadow-lg shadow-indigo-500/30">
                        <Globe className="w-5 h-5" /> Start Swapping Skills
                    </Link>
                </div>
            </main>
        </div>
    );
}

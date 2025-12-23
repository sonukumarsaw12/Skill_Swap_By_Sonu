"use client";

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Code, BookOpen, ArrowRight, Loader2, Layers, Zap } from 'lucide-react';

export default function Signup() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        skillsKnown: '',
        skillsToLearn: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const { name, email, password, confirmPassword, skillsKnown, skillsToLearn } = formData;

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const userData = {
                name,
                email,
                password,
                skillsKnown: skillsKnown.split(',').map((skill) => skill.trim()),
                skillsToLearn: skillsToLearn.split(',').map((skill) => skill.trim())
            };

            const res = await axios.post('http://localhost:5000/api/auth/signup', userData);

            if (res.data) {
                localStorage.setItem('user', JSON.stringify(res.data));
                router.push('/dashboard');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Something went wrong');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 overflow-hidden relative font-sans transition-colors duration-500"
            style={{ backgroundImage: "url('/images/signup-bg.jpg')" }}>

            {/* Dark Overlay for contrast */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0"></div>

            <div className="relative w-full max-w-lg z-10">
                <div className="bg-white/10 dark:bg-black/50 backdrop-blur-md rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/40 dark:border-white/20 p-6 md:p-10 relative overflow-hidden ring-1 ring-white/10">

                    <div className="text-center mb-8">
                        <div className="relative w-20 h-20 mx-auto mb-6 group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 animate-pulse transition-opacity duration-500"></div>
                            <div className="relative w-full h-full bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 transform group-hover:rotate-12 transition-all duration-300 border border-white/20 ring-1 ring-white/20">
                                <Layers className="w-10 h-10 text-white transform group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white dark:border-black shadow-lg animate-bounce">
                                <Zap className="w-4 h-4 text-white fill-white" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Create Account</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Join the SkillSwap community today</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm mb-6 text-center animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-4">

                        <div className="relative group">
                            <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Full Name"
                                name="name"
                                value={name}
                                onChange={onChange}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                required
                            />
                        </div>

                        <div className="relative group">
                            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="email"
                                placeholder="Email Address"
                                name="email"
                                value={email}
                                onChange={onChange}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative group">
                                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    name="password"
                                    value={password}
                                    onChange={onChange}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                    required
                                />
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="password"
                                    placeholder="Confirm"
                                    name="confirmPassword"
                                    value={confirmPassword}
                                    onChange={onChange}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                    required
                                />
                            </div>
                        </div>

                        <div className="relative group">
                            <Code className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Skills You Have (e.g. Python, Java)"
                                name="skillsKnown"
                                value={skillsKnown}
                                onChange={onChange}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                            />
                        </div>

                        <div className="relative group">
                            <BookOpen className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Skills To Learn (e.g. React, Docker)"
                                name="skillsToLearn"
                                value={skillsToLearn}
                                onChange={onChange}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign Up <ArrowRight className="w-5 h-5" /></>}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Already have an account?{' '}
                            <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                                Log in
                            </Link>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}

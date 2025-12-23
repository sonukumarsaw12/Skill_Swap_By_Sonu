"use client";

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Loader2, Layers, Zap, ShieldCheck } from 'lucide-react';

export default function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const { email, password } = formData;

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/login`, formData);

            if (res.data) {
                localStorage.setItem('user', JSON.stringify(res.data));
                router.push('/dashboard');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Invalid credentials');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 overflow-hidden relative font-sans transition-colors duration-500"
            style={{ backgroundImage: "url('/images/signup-bg.jpg')" }}>

            {/* Dark Overlay for contrast */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0"></div>

            <div className="relative w-full max-w-md z-10">
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
                        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h2>
                        <p className="text-gray-400 text-sm">Sign in to continue your journey</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm mb-6 text-center animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-4">

                        <div className="relative group">
                            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Email Address"
                                name="email"
                                value={email}
                                onChange={onChange}
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all text-base text-white placeholder-gray-500"
                                required
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="password"
                                placeholder="Password"
                                name="password"
                                value={password}
                                onChange={onChange}
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all text-base text-white placeholder-gray-500"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Login <ArrowRight className="w-5 h-5" /></>}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-400 text-sm">
                            Don't have an account?{' '}
                            <Link href="/signup" className="text-blue-500 font-semibold hover:text-blue-400 transition-colors">
                                Sign up
                            </Link>
                        </p>
                    </div>

                    <div className="mt-6 flex justify-center">
                        <Link href="/admin/login" className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-300 transition-colors">
                            <ShieldCheck className="w-3 h-3" /> Admin Access
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}

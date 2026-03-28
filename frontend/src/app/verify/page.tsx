"use client";

import { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, Loader2, Layers, Zap, Mail, RefreshCcw } from 'lucide-react';

function VerifyContent() {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [timer, setTimer] = useState(60);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
        } else {
            router.push('/signup');
        }
    }, [searchParams, router]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (element: HTMLInputElement, index: number) => {
        if (isNaN(Number(element.value))) return false;

        setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

        // Focus next input
        if (element.nextSibling && element.value !== "") {
            (element.nextSibling as HTMLInputElement).focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace') {
            if (otp[index] === "" && e.currentTarget.previousSibling) {
                (e.currentTarget.previousSibling as HTMLInputElement).focus();
            }
        }
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        const otpValue = otp.join('');
        if (otpValue.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/verify-otp`, {
                email,
                otp: otpValue
            });

            if (res.data) {
                localStorage.setItem('user', JSON.stringify(res.data));
                setMessage('Email verified successfully! Redirecting...');
                setTimeout(() => {
                    router.push('/dashboard');
                }, 2000);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
            setLoading(false);
        }
    };

    const resendOtp = async () => {
        if (timer > 0) return;
        
        setResending(true);
        setError('');
        setMessage('');
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/resend-otp`, { email });
            setMessage('New OTP sent to your email');
            setTimer(60);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error resending OTP');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 overflow-hidden relative font-sans transition-colors duration-500"
            style={{ backgroundImage: "url('/images/signup-bg.jpg')" }}>

            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0"></div>

            <div className="relative w-full max-w-md z-10">
                <div className="bg-white/10 dark:bg-black/50 backdrop-blur-md rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/40 dark:border-white/20 p-6 md:p-10 relative overflow-hidden ring-1 ring-white/10">

                    <div className="text-center mb-8">
                        <div className="relative w-20 h-20 mx-auto mb-6 group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 animate-pulse transition-opacity duration-500"></div>
                            <div className="relative w-full h-full bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 transform group-hover:rotate-12 transition-all duration-300 border border-white/20 ring-1 ring-white/20">
                                <ShieldCheck className="w-10 h-10 text-white transform group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white dark:border-black shadow-lg animate-bounce">
                                <Zap className="w-4 h-4 text-white fill-white" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Verify Email</h2>
                        <p className="text-gray-400 text-sm">We've sent a code to <span className="text-blue-400 font-medium">{email}</span></p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm mb-6 text-center animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-3 rounded-xl text-sm mb-6 text-center animate-in fade-in slide-in-from-top-2">
                            {message}
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-8">
                        <div className="flex justify-between gap-1.5 sm:gap-2">
                            {otp.map((data, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    maxLength={1}
                                    value={data}
                                    onChange={(e) => handleChange(e.target, index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    onFocus={(e) => e.target.select()}
                                    className="w-10 h-10 sm:w-12 sm:h-14 md:w-14 md:h-16 text-center text-xl md:text-2xl font-bold bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all text-white"
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.join('').length !== 6}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify Account <ArrowRight className="w-5 h-5" /></>}
                        </button>
                    </form>

                    <div className="mt-8 text-center space-y-4">
                        <p className="text-gray-400 text-sm">
                            Didn't receive the code?{' '}
                            <button 
                                onClick={resendOtp}
                                disabled={resending || timer > 0}
                                className={`font-semibold transition-colors flex items-center gap-1 mx-auto mt-2 ${timer > 0 ? 'text-gray-600 cursor-not-allowed' : 'text-blue-500 hover:text-blue-400'}`}
                            >
                                {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                                {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                            </button>
                        </p>
                        <Link href="/signup" className="block text-gray-500 text-xs hover:text-white transition-colors">
                            Use a different email address
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default function Verify() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white font-bold">Loading...</div>}>
            <VerifyContent />
        </Suspense>
    );
}

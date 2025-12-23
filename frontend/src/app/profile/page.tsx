"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Upload, User as UserIcon, Award, Briefcase, BookOpen } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import Toast from '@/components/Toast';

export default function Profile() {
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; isVisible: boolean }>({
        message: '',
        type: 'success',
        isVisible: false
    });

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type, isVisible: true });
    };

    const [formData, setFormData] = useState({
        name: '',
        title: '',
        email: '',
        bio: '',
        profilePic: '',
        skillsKnown: '',
        skillsToLearn: '',
        achievements: ''
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
        } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setFormData({
                name: parsedUser.name || '',
                title: parsedUser.title || '',
                email: parsedUser.email || '',
                bio: parsedUser.bio || '',
                profilePic: parsedUser.profilePic || '',
                skillsKnown: parsedUser.skillsKnown ? parsedUser.skillsKnown.join(', ') : '',
                skillsToLearn: parsedUser.skillsToLearn ? parsedUser.skillsToLearn.join(', ') : '',
                achievements: parsedUser.achievements ? parsedUser.achievements.join('\n') : ''
            });
        }
    }, [router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const uploadFileHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            // NOTE: You might need to adjust the URL if your backend port is different
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
                body: uploadData,
            });

            if (res.ok) {
                const data = await res.text();
                // Check if backend returned a full Cloudinary URL or a local path
                const fullUrl = data.startsWith('http')
                    ? data
                    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${data}`;
                setFormData((prev) => ({ ...prev, profilePic: fullUrl }));
                showToast('Profile picture uploaded!', 'success');
            } else {
                showToast('Image upload failed', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Error uploading image', 'error');
        }
    };

    const handleImageClick = () => {
        document.getElementById('imageInput')?.click();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Process comma-separated skills into arrays
            const skillsKnownArray = formData.skillsKnown.split(',').map(s => s.trim()).filter(s => s);
            const skillsToLearnArray = formData.skillsToLearn.split(',').map(s => s.trim()).filter(s => s);

            // Process achievements (newline separated)
            const achievementsArray = formData.achievements.split('\n').map(s => s.trim()).filter(s => s);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    title: formData.title,
                    email: formData.email,
                    bio: formData.bio,
                    profilePic: formData.profilePic,
                    skillsKnown: skillsKnownArray,
                    skillsToLearn: skillsToLearnArray,
                    achievements: achievementsArray
                })
            });

            if (res.ok) {
                const updatedData = await res.json();
                // Update local storage
                const newUserData = { ...user, ...updatedData };
                localStorage.setItem('user', JSON.stringify(newUserData));
                setUser(newUserData);
                showToast('Profile updated successfully!', 'success');
                // Optional: Delay redirect to let user see toast
                setTimeout(() => router.push('/dashboard'), 1500);
            } else {
                showToast('Failed to update profile', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Error updating profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return (
        <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
            <p className="text-sm text-gray-400 font-mono animate-pulse">Loading Profile...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#0B0F19] transition-colors duration-500 overflow-x-hidden relative font-sans">
            {/* Ambient Background Glows */}
            <div className="fixed top-0 left-0 w-screen h-screen overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/20 dark:bg-purple-900/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 dark:bg-blue-900/20 rounded-full blur-[100px] animate-pulse delay-700"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-indigo-500/20 dark:bg-indigo-900/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
            </div>

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />

            <div className="max-w-4xl mx-auto space-y-8 relative z-10 p-4 md:p-8">
                {/* Navbar */}
                <nav className="flex justify-between items-center bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl px-6 py-4 rounded-2xl shadow-sm border border-white/40 dark:border-white/5 sticky top-4 z-50">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition group font-medium"
                    >
                        <div className="p-2 bg-white/50 dark:bg-gray-800/50 rounded-full group-hover:bg-white dark:group-hover:bg-gray-800 transition shadow-sm group-hover:shadow-md">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </div>
                        Back to Dashboard
                    </button>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                    </div>
                </nav>

                {/* Main Content Card */}
                {/* Main Content Card */}
                <div className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/60 dark:border-gray-700/60 overflow-hidden relative">
                    {/* Custom Image Banner */}
                    <div className="h-48 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('/banner.png')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>

                    <form onSubmit={handleSubmit} className="px-8 pb-12">
                        <div className="relative -mt-20 mb-10 flex flex-col md:flex-row md:flex-wrap items-center md:items-end gap-6 md:gap-x-8 md:gap-y-4">
                            {/* Profile Picture Upload */}
                            <div className="relative group cursor-pointer flex-shrink-0" onClick={handleImageClick}>
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] border-[6px] border-white dark:border-[#0B0F19] overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-2xl relative z-10 transition-transform group-hover:scale-[1.02]">
                                    {formData.profilePic ? (
                                        <img src={formData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-gray-800">
                                            <UserIcon className="w-16 h-16 opacity-50" />
                                        </div>
                                    )}
                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                        <Upload className="w-8 h-8 text-white drop-shadow-md" />
                                    </div>
                                </div>
                                <div className="absolute bottom-4 right-4 p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/40 z-20 group-hover:scale-110 transition-transform border-4 border-white dark:border-[#0B0F19]">
                                    <Upload className="w-4 h-4" />
                                </div>
                                <input type="file" id="imageInput" hidden accept="image/*" onChange={uploadFileHandler} />
                            </div>

                            {/* Name & Title */}
                            <div className="flex-1 pb-2 md:pb-4 text-center md:text-left">
                                <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-1 tracking-tight whitespace-nowrap">
                                    {formData.name || 'Your Name'}
                                </h1>
                                <p className="text-lg md:text-xl text-indigo-600 dark:text-indigo-400 font-medium flex items-center justify-center md:justify-start gap-2">
                                    <Briefcase className="w-5 h-5 flex-shrink-0" />
                                    {formData.title || 'Add a headline'}
                                </p>
                            </div>


                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                            {/* Left Column */}
                            <div className="space-y-8">
                                <div className="space-y-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/30 dark:border-gray-700/40 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                        <UserIcon className="w-5 h-5 text-indigo-500" /> Personal Info
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="w-full px-5 py-3 rounded-2xl border-2 border-transparent bg-white/50 dark:bg-gray-900/40 backdrop-blur-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:bg-white/70 dark:focus:bg-gray-900/60 focus:ring-0 transition-all font-medium shadow-sm placeholder-gray-500/70"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Headline</label>
                                            <input
                                                type="text"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleChange}
                                                placeholder="e.g. Senior React Developer"
                                                className="w-full px-5 py-3 rounded-2xl border-2 border-transparent bg-white/50 dark:bg-gray-900/40 backdrop-blur-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:bg-white/70 dark:focus:bg-gray-900/60 focus:ring-0 transition-all font-medium shadow-sm placeholder-gray-500/70"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Detailed Bio</label>
                                            <textarea
                                                name="bio"
                                                value={formData.bio}
                                                onChange={handleChange}
                                                rows={5}
                                                placeholder="Tell your story..."
                                                className="w-full px-5 py-3 rounded-2xl border-2 border-transparent bg-white/50 dark:bg-gray-900/40 backdrop-blur-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:bg-white/70 dark:focus:bg-gray-900/60 focus:ring-0 transition-all font-medium shadow-sm resize-none leading-relaxed placeholder-gray-500/70"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 opacity-70">Profile Picture URL (Backup)</label>
                                            <input
                                                type="text"
                                                name="profilePic"
                                                value={formData.profilePic}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 rounded-xl text-sm border-2 border-transparent bg-gray-50 dark:bg-gray-900/50 text-gray-500 focus:text-gray-900 dark:focus:text-white focus:border-indigo-300 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-8">
                                <div className="space-y-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/30 dark:border-gray-700/40 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                        <Award className="w-5 h-5 text-purple-500" /> Skills & Achievements
                                    </h3>

                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div> Skills You Teach
                                            </label>
                                            <input
                                                type="text"
                                                name="skillsKnown"
                                                value={formData.skillsKnown}
                                                onChange={handleChange}
                                                placeholder="React, Node.js, Design..."
                                                className="w-full px-5 py-3 rounded-2xl border-2 border-transparent bg-white/50 dark:bg-gray-900/40 backdrop-blur-sm text-gray-900 dark:text-white focus:border-green-500 focus:bg-white/70 dark:focus:bg-gray-900/60 focus:ring-0 transition-all font-medium shadow-sm"
                                            />
                                            <p className="text-[10px] text-gray-400 mt-1 pl-2">Comma separated values</p>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-purple-500"></div> Skills You Want to Learn
                                            </label>
                                            <input
                                                type="text"
                                                name="skillsToLearn"
                                                value={formData.skillsToLearn}
                                                onChange={handleChange}
                                                placeholder="Python, Public Speaking..."
                                                className="w-full px-5 py-3 rounded-2xl border-2 border-transparent bg-white/50 dark:bg-gray-900/40 backdrop-blur-sm text-gray-900 dark:text-white focus:border-purple-500 focus:bg-white/70 dark:focus:bg-gray-900/60 focus:ring-0 transition-all font-medium shadow-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-yellow-400"></div> Achievements
                                            </label>
                                            <textarea
                                                name="achievements"
                                                value={formData.achievements}
                                                onChange={handleChange}
                                                rows={5}
                                                placeholder="• Won State Hackathon&#10;• Certified AWS Developer"
                                                className="w-full px-5 py-3 rounded-2xl border-2 border-transparent bg-white/50 dark:bg-gray-900/40 backdrop-blur-sm text-gray-900 dark:text-white focus:border-yellow-400 focus:bg-white/70 dark:focus:bg-gray-900/60 focus:ring-0 transition-all font-medium shadow-sm resize-none"
                                            />
                                            <p className="text-[10px] text-gray-400 mt-1 pl-2">One achievement per line</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons (Bottom) */}
                        <div className="flex flex-col-reverse md:flex-row justify-end gap-3 mt-10 pt-6 border-t border-gray-200 dark:border-gray-700/50">
                            <button type="button" onClick={() => router.back()} className="px-6 py-3 rounded-2xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-700/50 transition bg-white dark:bg-gray-800">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/30 flex justify-center items-center gap-2 disabled:opacity-70 transform active:scale-95">
                                <Save className="w-5 h-5" /> {loading ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

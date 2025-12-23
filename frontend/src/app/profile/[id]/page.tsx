"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function PublicProfile() {
    const [profile, setProfile] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const params = useParams();
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
            fetchProfile(JSON.parse(storedUser).token);
        } else {
            router.push('/login');
        }
    }, []);

    const fetchProfile = async (token: string) => {
        try {
            const res = await fetch(`http://localhost:5000/api/users/${params.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
            } else {
                alert('User not found');
                router.push('/dashboard');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        if (!currentUser) return;
        try {
            const res = await fetch('http://localhost:5000/api/requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${currentUser.token}`
                },
                body: JSON.stringify({ receiverId: profile._id })
            });
            if (res.ok) {
                alert('Request sent!');
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to send request');
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
    if (!profile) return null;

    const isOwnProfile = currentUser?._id === profile._id;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b px-4 py-3 sticky top-0 z-10 flex items-center justify-between">
                <button onClick={() => router.back()} className="text-gray-600">
                    ← Back
                </button>
                <span className="font-bold text-lg">{profile.name}</span>
                <Link href="/dashboard" className="text-blue-500 font-semibold">Home</Link>
            </header>

            <div className="max-w-md mx-auto pt-6 px-4">
                {/* Profile Header */}
                <div className="flex items-center gap-6 mb-6">
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-500 p-[2px]">
                        <div className="w-full h-full rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-2xl text-gray-500 font-bold overflow-hidden">
                            {/* Placeholder or Image */}
                            {profile.name.charAt(0).toUpperCase()}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex-1 flex justify-around text-center">
                        <div>
                            <div className="font-bold text-lg">{profile.connectionsCount || 0}</div>
                            <div className="text-xs text-gray-500">Followers</div>
                        </div>
                        <div>
                            <div className="font-bold text-lg">{profile.rating ? profile.rating.toFixed(1) : 'N/A'}</div>
                            <div className="text-xs text-gray-500">Rating</div>
                        </div>
                        <div>
                            <div className="font-bold text-lg">{profile.skillsKnown?.length || 0}</div>
                            <div className="text-xs text-gray-500">Skills</div>
                        </div>
                    </div>
                </div>

                {/* Bio */}
                <div className="mb-6">
                    <h1 className="font-bold">{profile.name}</h1>
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                        {profile.bio || "No bio yet."}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mb-8">
                    {isOwnProfile ? (
                        <Link href="/profile" className="flex-1 bg-gray-200 text-gray-800 py-1.5 rounded-lg text-sm font-semibold text-center">
                            Edit Profile
                        </Link>
                    ) : (
                        <>
                            <button
                                onClick={handleConnect}
                                className="flex-1 bg-blue-500 text-white py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-600 transition"
                            >
                                Follow
                            </button>
                            <button
                                onClick={() => router.push(`/chat/${profile._id}`)}
                                className="flex-1 bg-gray-200 text-gray-800 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-300 transition"
                            >
                                Message
                            </button>
                        </>
                    )}
                </div>

                {/* Skills Tabs (represented as highlights/stories or just sections) */}
                <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4 text-center mb-4">
                        <span className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Teaching</span>
                        <span className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Learning</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            {profile.skillsKnown?.map((skill: string, i: number) => (
                                <div key={i} className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-medium border border-green-100 text-center">
                                    {skill}
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col gap-2">
                            {profile.skillsToLearn?.map((skill: string, i: number) => (
                                <div key={i} className="bg-purple-50 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium border border-purple-100 text-center">
                                    {skill}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

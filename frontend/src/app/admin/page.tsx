"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Users, Activity, Calendar, Shield, Trash2, Search, LogOut } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import Toast from '@/components/Toast';

export default function AdminDashboard() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; isVisible: boolean }>({
        message: '',
        type: 'success',
        isVisible: false
    });
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/admin/login');
            return;
        }
        const userData = JSON.parse(storedUser);
        if (!userData.isAdmin) {
            showToast("Not authorized as admin", 'error');
            setTimeout(() => router.push('/dashboard'), 2000);
            return;
        }

        fetchUsers(userData.token);
    }, [router]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type, isVisible: true });
    };

    const fetchUsers = async (token: string) => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            showToast('Failed to fetch users', 'error');
            setLoading(false);
        }
    };

    const initiateDelete = (id: string) => {
        setDeleteId(id);
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;
        const userData = JSON.parse(storedUser);

        try {
            await axios.delete(`http://localhost:5000/api/admin/users/${deleteId}`, {
                headers: { Authorization: `Bearer ${userData.token}` }
            });
            setUsers(users.filter(u => u._id !== deleteId));
            showToast('User deleted successfully', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to delete user', 'error');
        } finally {
            setIsConfirmOpen(false);
            setDeleteId(null);
        }
    };

    const handleLogout = () => {
        showToast("Logging out...", 'success');
        setTimeout(() => {
            localStorage.removeItem('user');
            router.push('/');
        }, 800);
    };

    // Derived Stats
    const totalUsers = users.length;
    const activeToday = users.filter(u => {
        if (!u.lastLogin) return false;
        const lastLogin = new Date(u.lastLogin);
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        return lastLogin > twoDaysAgo;
    }).length;

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-blue-500 selection:text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none"></div>
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto p-8 relative z-10">
                {/* Header */}
                <header className="flex justify-between items-center mb-10 pb-6 border-b border-gray-800">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Shield className="w-8 h-8 text-blue-500" />
                            Admin Command Center
                        </h1>
                        <p className="text-gray-400 mt-1">Overview of platform activity and user base.</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" /> Logout
                    </button>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-white">
                    <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 p-6 rounded-2xl flex items-center gap-4 hover:border-blue-500/50 transition-colors group">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm font-medium">Total Users</p>
                            <h2 className="text-3xl font-bold">{totalUsers}</h2>
                        </div>
                    </div>

                    <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 p-6 rounded-2xl flex items-center gap-4 hover:border-green-500/50 transition-colors group">
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm font-medium">Active Recently</p>
                            <h2 className="text-3xl font-bold">{activeToday}</h2>
                        </div>
                    </div>

                    <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 p-6 rounded-2xl flex items-center gap-4 hover:border-purple-500/50 transition-colors group">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm font-medium">System Status</p>
                            <h2 className="text-3xl font-bold text-green-400 text-lg">Operational</h2>
                        </div>
                    </div>
                </div>

                {/* User Table Card */}
                <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 className="text-xl font-bold text-white">Registered Users</h2>

                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-black/40 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-blue-500 outline-none w-full md:w-64 transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="p-5">User</th>
                                    <th className="p-5">Role</th>
                                    <th className="p-5">Joined</th>
                                    <th className="p-5">Last Active</th>
                                    <th className="p-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map(user => (
                                        <tr key={user._id} className="hover:bg-blue-500/5 transition-colors group">
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-sm font-bold text-white border border-gray-600">
                                                        {user.profilePic ? (
                                                            <img src={user.profilePic} alt="" className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            user.name.charAt(0)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-white">{user.name}</div>
                                                        <div className="text-xs text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                {user.isAdmin ? (
                                                    <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
                                                        Admin
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 rounded-full bg-gray-700/50 text-gray-300 text-xs font-bold border border-gray-600">
                                                        User
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-5 text-sm text-gray-400">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-5 text-sm">
                                                {user.lastLogin ? (
                                                    <span className="text-green-400 font-medium">{new Date(user.lastLogin).toLocaleString()}</span>
                                                ) : (
                                                    <span className="text-gray-600 italic">Never</span>
                                                )}
                                            </td>
                                            <td className="p-5 text-right">
                                                {!user.isAdmin && (
                                                    <button
                                                        onClick={() => initiateDelete(user._id)}
                                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete User"
                message="Are you sure you want to permanently delete this user? This action cannot be undone."
                onConfirm={confirmDelete}
                onCancel={() => setIsConfirmOpen(false)}
            />

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </div>
    );
}

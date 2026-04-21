import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // 1. IMPORTANT: Added this import
import api from '../api/axiosInstance';
import Layout from '../components/Layout';
import { UserPlus, Users, Search, Loader2, Check, Globe, UserMinus } from 'lucide-react';

const Network = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [myNetwork, setMyNetwork] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const loadData = async () => {
        try {
            setLoading(true);
            const [sugRes, invRes, netRes] = await Promise.all([
                api.get('/connections/suggestions'),
                api.get('/connections/pending'),
                api.get('/connections/my-network')
            ]);
            
            setSuggestions(sugRes.data);
            setInvitations(invRes.data);
            setMyNetwork(netRes.data);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleConnect = async (id) => {
        try {
            await api.post(`/connections/send/${id}`);
            setSuggestions(suggestions.filter(s => s.user_id !== id));
            alert("Request Sent!");
        } catch (err) {
            alert("Error sending request");
        }
    };

    const handleAccept = async (connectionId) => {
        try {
            await api.put(`/connections/accept/${connectionId}`);
            loadData(); 
            alert("Connection Accepted!");
        } catch (err) {
            alert("Error accepting request");
        }
    };

    const handleUnfollow = async (targetUserId) => {
        if (window.confirm("Are you sure you want to remove this connection?")) {
            try {
                await api.delete(`/connections/remove/${targetUserId}`);
                loadData(); 
                alert("Connection removed");
            } catch (err) {
                alert("Error removing connection");
            }
        }
    };

    const filteredSuggestions = suggestions.filter(u => 
        u.full_name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <Layout><div className="p-20 text-center"><Loader2 className="animate-spin inline" /> Loading...</div></Layout>;

    return (
        <Layout>
            <div className="md:col-span-12 p-6">
                
                {/* --- SECTION 1: INCOMING INVITATIONS --- */}
                {invitations.length > 0 && (
                    <div className="bg-white border rounded-2xl p-6 mb-8 shadow-sm border-blue-100">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-600">
                            Invitations ({invitations.length})
                        </h2>
                        <div className="divide-y">
                            {invitations.map(inv => (
                                <div key={inv.connection_id} className="flex items-center justify-between py-4">
                                    {/* Link added to invitation info */}
                                    <Link to={`/profile/${inv.user_id}`} className="flex items-center gap-3 hover:opacity-80 transition">
                                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                            {inv.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{inv.full_name}</p>
                                            <p className="text-xs text-gray-500">{inv.headline}</p>
                                        </div>
                                    </Link>
                                    <button 
                                        onClick={() => handleAccept(inv.connection_id)}
                                        className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1 hover:bg-blue-700 transition"
                                    >
                                        <Check size={14} /> Accept
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- SECTION 2: SEARCH & HEADER --- */}
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl border mb-8 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2"><Globe className="text-blue-600" /> Network Hub</h1>
                        <p className="text-sm text-gray-500 font-bold">Manage your professional circle</p>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            className="pl-10 pr-4 py-2 border rounded-xl w-64 md:w-80 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Search network..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* --- SECTION 3: MY CONNECTIONS --- */}
                {myNetwork.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-lg font-bold mb-4 text-gray-700 flex items-center gap-2">
                             <Users size={20} className="text-green-500"/> My Connections ({myNetwork.length})
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {myNetwork.map(user => (
                                <div key={user.user_id} className="relative bg-white border-t-4 border-green-500 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition group">
                                    
                                    <button 
                                        onClick={() => handleUnfollow(user.user_id)}
                                        className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 transition-colors z-10"
                                        title="Unfollow"
                                    >
                                        <UserMinus size={18} />
                                    </button>

                                    {/* Link wrapped around the Profile card content */}
                                    <Link to={`/profile/${user.user_id}`} className="block group">
                                        <div className="w-16 h-16 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold shadow-inner group-hover:bg-green-100 transition">
                                            {user.full_name?.charAt(0).toUpperCase()}
                                        </div>
                                        <h3 className="font-bold text-gray-800 group-hover:text-green-600 transition">{user.full_name}</h3>
                                        <p className="text-[11px] text-gray-400 mb-4 line-clamp-1">{user.headline || "Professional"}</p>
                                    </Link>
                                    
                                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 py-1.5 rounded-full uppercase tracking-wider">
                                        <Check size={12} /> Connected
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- SECTION 4: SUGGESTIONS GRID --- */}
                <h2 className="text-lg font-bold mb-4 text-gray-700">People You May Know</h2>
                {filteredSuggestions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredSuggestions.map(user => (
                            <div key={user.user_id} className="bg-white border rounded-2xl p-6 text-center hover:shadow-md transition">
                                <Link to={`/profile/${user.user_id}`} className="group block mb-3">
                                    <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold shadow-md group-hover:bg-blue-700 transition">
                                        {user.full_name?.charAt(0).toUpperCase()}
                                    </div>
                                    <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition">{user.full_name}</h3>
                                    <p className="text-xs text-gray-400 line-clamp-1">{user.headline || "New Member"}</p>
                                </Link>
                                
                                <button 
                                    onClick={() => handleConnect(user.user_id)}
                                    className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2 transition"
                                >
                                    <UserPlus size={16} /> Connect
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-gray-50 border-2 border-dashed rounded-3xl">
                        <p className="text-gray-400">No new suggestions at this time.</p>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Network;
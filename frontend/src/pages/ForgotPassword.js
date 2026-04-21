import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosInstance';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [step, setStep] = useState(1); // 1: Email Input, 2: OTP & New Password
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(""); // Added error state
    const navigate = useNavigate();

    // Step 1: Request OTP
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError(""); 
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email: email.toLowerCase().trim() });
            alert('✅ Verification code sent to your email.');
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.msg || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError("");

        // Final validation check before submission
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/reset-password', { email: email.toLowerCase().trim(), otp, newPassword });
            alert('✅ Password updated successfully! Please login with your new password.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.msg || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-[#f3f2ef]">
            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-200">
                <div className="flex flex-col items-center mb-6">
                    <h2 className="text-2xl font-bold text-[#0a66c2]">
                        {step === 1 ? "Forgot Password?" : "Reset Password"}
                    </h2>
                    <p className="text-sm text-gray-500 mt-2 text-center">
                        {step === 1 
                            ? "Enter your email to receive a 6-digit verification code." 
                            : "Enter the code sent to your email and choose a new password."}
                    </p>
                </div>

                {/* Error Message Display - Same style as Register.js */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 mb-4 text-sm rounded shadow-sm transition-all animate-pulse">
                        {error}
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleSendOTP} className="space-y-5">
                        <div>
                            <label className="text-xs font-semibold text-gray-600 ml-1">Email</label>
                            <input 
                                type="email" 
                                placeholder="email@example.com"
                                className="w-full p-3 border border-gray-400 rounded-lg outline-none focus:ring-2 focus:ring-[#0a66c2] transition"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                            />
                        </div>
                        <button 
                            disabled={loading}
                            type="submit"
                            className="w-full bg-[#0a66c2] text-white p-3 rounded-full font-bold hover:bg-[#004182] transition shadow-md disabled:bg-gray-400"
                        >
                            {loading ? "Sending..." : "Send Reset Code"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-5">
                        <div>
                            <label className="text-xs font-semibold text-gray-600 ml-1">6-Digit Code</label>
                            <input 
                                type="text" 
                                placeholder="123456"
                                className="w-full p-3 border border-gray-400 rounded-lg outline-none focus:ring-2 focus:ring-[#0a66c2] transition"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required 
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600 ml-1">New Password (6+ characters)</label>
                            <input 
                                type="password" 
                                placeholder="New Password"
                                // Dynamic border color based on length logic from Register.js
                                className={`w-full p-3 border rounded-lg focus:ring-2 outline-none transition-colors ${
                                    newPassword.length > 0 && newPassword.length < 6 
                                    ? 'border-red-500 ring-red-100' 
                                    : 'border-gray-400 focus:ring-[#0a66c2]'
                                }`}
                                value={newPassword}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setNewPassword(val);
                                    
                                    // Real-time validation logic
                                    if (val.length > 0 && val.length < 6) {
                                        setError("Keep going... Password must be at least 6 characters.");
                                    } else {
                                        setError(""); 
                                    }
                                }}
                                required 
                            />
                        </div>
                        <button 
                            disabled={loading}
                            type="submit"
                            className="w-full bg-[#0a66c2] text-white p-3 rounded-full font-bold hover:bg-[#004182] transition shadow-md disabled:bg-gray-400"
                        >
                            {loading ? "Updating..." : "Reset Password"}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <Link to="/login" onClick={() => setError("")} className="text-sm font-bold text-[#0a66c2] hover:underline">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
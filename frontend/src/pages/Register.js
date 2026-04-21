import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

const Register = () => {
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '' });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); 

  // --- RESEND OTP STATES ---
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  
  const navigate = useNavigate();

  // --- TIMER LOGIC ---
  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(""); 
    
    // Final check before submission
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const dataToSend = { ...formData, email: formData.email.toLowerCase().trim() };
      await api.post('/auth/register', dataToSend);
      setStep(2); 
      setTimer(30); 
      setCanResend(false);
    } catch (err) { 
      setError(err.response?.data?.msg || "Registration Failed"); 
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError("");
    try {
      const cleanEmail = formData.email.toLowerCase().trim();
      await api.post('/auth/resend-otp', { email: cleanEmail });
      alert("A new code has been sent to your email!");
      setTimer(60); 
      setCanResend(false);
      setOtp(''); 
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cleanEmail = formData.email.toLowerCase().trim();
      const res = await api.post('/auth/verify-otp', { email: cleanEmail, otp: otp.trim() });
      alert(res.data.msg || "Account verified!");
      navigate('/login');
    } catch (err) { 
      setOtp(''); // Clear OTP on error so they can re-type
      setError(err.response?.data?.msg || "Invalid OTP. Please check your email again."); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-bold text-center text-[#0a66c2] mb-6">
          {step === 1 ? 'Join LinkedIn' : 'Verify Email'}
        </h2>

        {/* Error Message Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 mb-4 text-sm rounded shadow-sm transition-all">
            {error}
          </div>
        )}
        
        {step === 1 ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 ml-1">Full Name</label>
              <input 
                type="text" 
                placeholder="John Doe" 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                onChange={e => setFormData({...formData, full_name: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 ml-1">Email</label>
              <input 
                type="email" 
                placeholder="email@example.com" 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 ml-1">Password (6+ characters)</label>
              <input 
                type="password" 
                placeholder="Password" 
                className={`w-full p-3 border rounded-lg focus:ring-2 outline-none transition-colors ${
                  formData.password.length > 0 && formData.password.length < 6 
                  ? 'border-red-500 ring-red-100' 
                  : 'focus:ring-blue-500'
                }`} 
                onChange={e => {
                  const val = e.target.value;
                  setFormData({...formData, password: val});
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
              className={`w-full bg-[#0a66c2] text-white p-3 rounded-full font-bold transition shadow-md active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#004182]'}`}
            >
              {loading ? "Sending OTP..." : "Agree & Join"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">We've sent a 6-digit code to</p>
                <p className="text-sm font-bold text-gray-800">{formData.email}</p>
              </div>
              <input 
                type="text" 
                placeholder="000000" 
                value={otp}
                maxLength="6"
                className="w-full p-3 border rounded-lg text-center text-3xl font-mono tracking-[0.5em] focus:ring-2 focus:ring-green-500 outline-none bg-gray-50" 
                onChange={e => setOtp(e.target.value)} 
                required 
              />
              <button 
                disabled={loading}
                className={`w-full bg-green-600 text-white p-3 rounded-full font-bold transition shadow-md active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-700'}`}
              >
                {loading ? "Verifying..." : "Verify Account"}
              </button>
            </form>

            <div className="text-center mt-4">
              {canResend ? (
                <button 
                  type="button" 
                  disabled={loading}
                  onClick={handleResend} 
                  className="text-[#0a66c2] font-bold hover:underline text-sm disabled:text-gray-400"
                >
                  {loading ? "Resending..." : "Resend Code"}
                </button>
              ) : (
                <p className="text-xs text-gray-500">
                  Resend available in <span className="font-mono font-bold">00:{timer < 10 ? `0${timer}` : timer}</span>
                </p>
              )}
            </div>

            <button type="button" onClick={() => { setStep(1); setError(""); }} className="w-full text-sm text-gray-500 hover:underline pt-2">
              Back to edit details
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
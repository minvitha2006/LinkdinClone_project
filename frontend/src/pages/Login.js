import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(""); // Added error state for in-form display
  const [loading, setLoading] = useState(false); // Added loading state for button feedback
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);

      const rawId = res.data.user?.id || res.data.userId || res.data.id || res.data.user_id;

      if (rawId) {
        localStorage.setItem('userId', String(rawId));
        console.log("✅ Identity Verified! Saved User ID:", rawId);
      }

      try {
        const profileRes = await api.get('/profiles/me');
        setUser(profileRes.data);
      } catch (profileErr) {
        setUser({ id: rawId, email }); 
      }
      
      // Removed browser alert for a smoother transition
      navigate('/');
      
    } catch (err) {
      // Set the error message to the state instead of using alert()
      const errorMsg = err.response?.data?.msg || err.response?.data?.message || "Invalid Email or Password";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-[#f3f2ef]">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-200">
        <div className="flex flex-col items-center mb-6">
           <h2 className="text-3xl font-bold text-[#0a66c2]">Sign in</h2>
           <p className="text-sm text-gray-500 mt-2">Stay updated on your professional world</p>
        </div>

        {/* --- DYNAMIC ERROR MESSAGE DISPLAY --- */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 mb-4 text-sm rounded shadow-sm transition-all animate-pulse">
            ❌ Login Failed: {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-gray-600 ml-1">Email</label>
            <input 
              type="email" 
              className="w-full p-3 border border-gray-400 rounded-lg outline-none focus:ring-2 focus:ring-[#0a66c2] transition"
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 ml-1">Password</label>
            <input 
              type="password" 
              className="w-full p-3 border border-gray-400 rounded-lg outline-none focus:ring-2 focus:ring-[#0a66c2] transition"
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <div className="flex justify-start">
            <Link 
              to="/forgot-password" 
              className="text-sm font-bold text-[#0a66c2] hover:underline hover:text-[#004182]"
            >
              Forgot password?
            </Link>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full bg-[#0a66c2] text-white p-3 rounded-full font-bold text-lg transition-all shadow-md active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#004182]'}`}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            New to LinkedIn? <Link to="/register" className="text-[#0a66c2] font-bold hover:underline">Join now</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
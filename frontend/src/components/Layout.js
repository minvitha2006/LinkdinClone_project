import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import api from '../api/axiosInstance';

const Layout = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profiles/me');
        setUserProfile(res.data);
      } catch (err) {
        console.error("Error fetching profile for layout:", err);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="min-h-screen bg-[#f3f2ef]">
      {/* We pass userProfile as a prop to Navbar so the dropdown can use it */}
      <Navbar userProfile={userProfile} />
      
      <main className="max-w-6xl mx-auto px-4 pt-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
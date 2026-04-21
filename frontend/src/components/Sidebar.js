import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Bookmark, MapPin } from 'lucide-react';
import axios from 'axios';

const Sidebar = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);

  // FETCH FRESH DATA: This ensures the location shows up after you update it
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/profiles/me', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        setProfile(res.data);
      } catch (err) {
        console.error("Sidebar fetch error", err);
      }
    };
    fetchProfile();
  }, []);

  // Use profile data if available, otherwise fallback to user context
  const displayName = profile?.full_name || user?.full_name || 'User Name';
  const displayHeadline = profile?.headline || user?.headline || 'Cyber Security Engineering Student';
  const displayPic = profile?.profile_pic || user?.profile_pic;

  return (
    <div className="bg-white rounded-lg border overflow-hidden shadow-sm sticky top-20">
      {/* Background Header */}
      <div className="h-14 bg-[#a0b4b7]"></div>
      
      <div className="p-4 text-center border-b">
        {/* Profile Picture Logic */}
        <div className="size-16 bg-white rounded-full mx-auto -mt-10 border-2 border-white overflow-hidden shadow-sm flex items-center justify-center">
          {displayPic ? (
            <img 
              src={`http://localhost:5000${displayPic}`} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="bg-gray-200 w-full h-full flex items-center justify-center text-xl font-bold text-gray-500">
              {displayName[0]}
            </div>
          )}
        </div>

        <h2 className="font-bold mt-3 hover:underline cursor-pointer">{displayName}</h2>
        
        {/* Fixed Headline Alignment */}
        <p className="text-xs text-gray-600 mt-2 leading-relaxed px-2">
          {displayHeadline}
        </p>

        {/* NEW: Location Section */}
        {profile?.location && (
          <div className="flex items-center justify-center gap-1 mt-2 text-gray-500">
            <MapPin size={12} />
            <span className="text-[10px]">{profile.location}</span>
          </div>
        )}
      </div>

      <div className="p-3 space-y-3">
        <div className="flex justify-between text-xs font-semibold text-gray-500 hover:bg-gray-100 p-2 rounded cursor-pointer transition-all">
          <span>Profile viewers</span>
          <span className="text-blue-600 font-bold">42</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs font-bold text-gray-600 pt-2 border-t cursor-pointer hover:bg-gray-100 p-2 rounded transition-all">
          <Bookmark size={14} className="fill-gray-600"/> My Items
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
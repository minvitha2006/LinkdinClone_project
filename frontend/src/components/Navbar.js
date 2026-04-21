import React, { useState, useRef, useEffect } from 'react';
import { Home, Users, Briefcase, LogOut, UserX, ChevronDown } from 'lucide-react'; 
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

// Receive userProfile as a prop from Layout.js
const Navbar = ({ userProfile }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Use the prop data for the display logic
  const profilePic = userProfile?.profile_pic;
  const fullName = userProfile?.full_name || "User";
  const firstNameInitial = userProfile?.full_name?.charAt(0) || 'V';
  const BASE_URL = "http://localhost:5000";

  useEffect(() => {
    // Click outside logic to close the menu
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("PERMANENT DELETE: Are you sure? This cannot be undone.");
    if (confirmDelete) {
      try {
        await api.delete('/auth/delete-account');
        localStorage.clear();
        navigate('/login');
      } catch (err) {
        alert("Action failed. Please try again.");
      }
    }
  };

  return (
    <nav className="bg-white border-b sticky top-0 z-50 h-16 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-end h-full">
        
        <div className="flex items-center gap-4 md:gap-8 text-gray-500 text-[10px] font-medium">
          
          <Link to="/" className="flex flex-col items-center">
             <div className="bg-[#0a66c2] text-white rounded-md font-bold w-8 h-8 flex items-center justify-center text-xl leading-none">in</div>
             <div className="h-3 md:block hidden"></div> 
          </Link>

          <Link to="/" className="flex flex-col items-center hover:text-black">
            <Home size={22}/>
            <span className="hidden md:block">Home</span>
          </Link>
          <Link to="/network" className="flex flex-col items-center hover:text-black">
            <Users size={22}/>
            <span className="hidden md:block">Network</span>
          </Link>
          <Link to="/projects" className="flex flex-col items-center hover:text-black">
            <Briefcase size={22}/>
            <span className="hidden md:block">Projects</span>
          </Link>

          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="flex flex-col items-center hover:text-black transition"
            >
              {/* Profile icon logic */}
              <div className="size-[24px] rounded-full overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-400">
                {profilePic ? (
                  <img 
                    src={`${BASE_URL}${profilePic}`} 
                    alt="Me" 
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-bold text-white uppercase">
                    {firstNameInitial}
                  </span>
                )}
              </div>
              
              <span className="hidden md:flex items-center gap-0.5 mt-0.5">
                Me <ChevronDown size={12} />
              </span>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-xl py-2 z-[60]">
                
                {/* Dropdown Header showing Name and Photo */}
                <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-3">
                  <div className="size-10 rounded-full overflow-hidden flex items-center justify-center bg-[#0a66c2] text-white">
                    {profilePic ? (
                      <img src={`${BASE_URL}${profilePic}`} className="size-full object-cover" alt="" />
                    ) : (
                      <span className="font-bold uppercase text-lg">{firstNameInitial}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-black font-bold text-sm truncate w-28">
                      {fullName}
                    </p>
                    <p className="text-gray-500 text-[11px]">Account</p>
                  </div>
                </div>

                <div className="px-4 py-2">
                  <Link 
                    to="/profile" 
                    onClick={() => setShowMenu(false)}
                    className="block text-center border border-blue-600 text-blue-600 rounded-full py-1 text-xs font-semibold hover:bg-blue-50 transition"
                  >
                    View Profile
                  </Link>
                </div>

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-black transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>

                <button 
                  onClick={handleDeleteAccount}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <UserX size={16} />
                  Delete Account
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
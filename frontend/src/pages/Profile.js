import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import { Camera, Trash2, Plus, Award, Briefcase, GraduationCap, Loader2, MapPin, AlertTriangle } from 'lucide-react';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext); // Assuming logout is in your AuthContext

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    full_name: '', 
    headline: '', 
    profile_pic: '', 
    skills: [], 
    education: [], 
    experience: [], 
    certifications: [], 
    location: ''
  });

  const isOwnProfile = !id;

  const syncNavbar = (updatedFields) => {
    const storedUser = JSON.parse(localStorage.getItem('user')) || {};
    const newUserObj = { ...storedUser, ...updatedFields };
    localStorage.setItem('user', JSON.stringify(newUserObj));
    window.dispatchEvent(new Event("storage"));
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const endpoint = id ? `/profiles/${id}` : '/profiles/me';
        const res = await api.get(endpoint);
        const data = res.data;
        setProfile({
          ...data,
          skills: data.skills || [],
          education: data.education || [],
          experience: data.experience || [],
          certifications: data.certifications || []
        });
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('profilePic', file);
    try {
      const res = await api.post('/profiles/upload-pic', fd);
      const newUrl = res.data.imageUrl;
      setProfile(prev => ({ ...prev, profile_pic: newUrl }));
      syncNavbar({ profile_pic: newUrl });
    } catch (err) { 
      alert("Upload failed."); 
    }
  };

  const handleSave = async () => {
    try {
      await api.put('/profiles/me', profile);
      setIsEditing(false);
      syncNavbar({ 
        full_name: profile.full_name, 
        profile_pic: profile.profile_pic 
      });
      alert("Profile updated successfully!");
    } catch (err) { 
      alert("Failed to save changes."); 
    }
  };

  const handleDeletePic = async () => {
    try {
      await api.delete('/profiles/upload-pic');
      setProfile(prev => ({ ...prev, profile_pic: '' }));
      syncNavbar({ profile_pic: '' });
    } catch (err) {
      alert("Failed to delete photo");
    }
  };

  // --- NEW: DELETE ACCOUNT FUNCTION ---
  const handleDeleteAccount = async () => {
    const confirmFirst = window.confirm("WARNING: Are you sure you want to delete your account? This will remove all your posts and profile data permanently.");
    if (!confirmFirst) return;

    const confirmSecond = window.confirm("This action CANNOT be undone. Proceed with account deletion?");
    if (!confirmSecond) return;

    try {
      await api.delete('/auth/delete-account'); // Ensure this route exists on your backend
      alert("Account deleted successfully.");
      logout(); // Clear context and local storage
      navigate('/login');
    } catch (err) {
      console.error(err);
      alert("Failed to delete account. Please try again later.");
    }
  };

  if (loading) return (
    <Layout>
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6 pb-20 pt-6 px-4">
        
        {/* HEADER CARD */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="h-32 md:h-48 bg-gradient-to-r from-blue-700 to-cyan-500"></div>
          <div className="p-6 -mt-16 flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="flex flex-col md:flex-row items-end gap-4 w-full">
              <div className="relative group size-32 md:size-40 shrink-0">
                <div className="size-full bg-white rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                  {profile.profile_pic ? (
                    <img src={`http://localhost:5000${profile.profile_pic}`} className="size-full object-cover" alt="Avatar" />
                  ) : (
                    <div className="size-full bg-gray-200 flex items-center justify-center text-gray-400 text-4xl font-bold">
                      {profile.full_name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                
                {isEditing && isOwnProfile && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                    <label className="cursor-pointer text-white">
                      <Camera size={24}/>
                      <input type="file" className="hidden" onChange={handleUpload}/>
                    </label>
                    <button onClick={handleDeletePic} className="text-white hover:text-red-400">
                      <Trash2 size={20}/>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 pb-2">
                {isEditing ? (
                  <div className="flex flex-col gap-2 w-full max-w-md">
                    <input 
                      className="text-2xl font-bold border-b-2 border-blue-500 outline-none p-1" 
                      value={profile.full_name} 
                      onChange={e => setProfile({...profile, full_name: e.target.value})} 
                      placeholder="Your Full Name" 
                    />
                    <input 
                      className="text-gray-600 border-b border-gray-300 outline-none p-1" 
                      value={profile.headline} 
                      onChange={e => setProfile({...profile, headline: e.target.value})} 
                      placeholder="Headline" 
                    />
                    <input 
                      className="text-gray-500 border-b border-gray-300 outline-none p-1" 
                      value={profile.location} 
                      onChange={e => setProfile({...profile, location: e.target.value})} 
                      placeholder="Location" 
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-gray-900">{profile.full_name || "New User"}</h1>
                    <p className="text-gray-700 leading-tight">{profile.headline || "Add a headline"}</p>
                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                      <MapPin size={14}/>
                      <span>{profile.location || "Add Location"}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {isOwnProfile && (
              <button 
                onClick={() => isEditing ? handleSave() : setIsEditing(true)} 
                className={`shrink-0 px-6 py-1.5 rounded-full font-bold transition-all ${isEditing ? 'bg-green-600 hover:bg-green-700 text-white' : 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'}`}
              >
                {isEditing ? "Save Changes" : "Edit Profile"}
              </button>
            )}
          </div>
        </div>

        {/* REARRANGED SECTION CARDS */}
        <div className="grid grid-cols-1 gap-6">
          {/* 1. Education */}
          <DataList title="Education" items={profile.education} type="education" profile={profile} setProfile={setProfile} fields={['School', 'Degree', 'Year']} icon={<GraduationCap size={20}/>} isOwnProfile={isOwnProfile} />
          
          {/* 2. Skills */}
          <DataList title="Skills" items={profile.skills} type="skills" profile={profile} setProfile={setProfile} fields={['Skill Name']} icon={<Plus size={20}/>} isOwnProfile={isOwnProfile} isSkillType={true} />
          
          {/* 3. Experience/Internship */}
          <DataList title="Experience / Internship" items={profile.experience} type="experience" profile={profile} setProfile={setProfile} fields={['Company', 'Role', 'Duration']} icon={<Briefcase size={20}/>} isOwnProfile={isOwnProfile} />
          
          {/* 4. Certifications */}
          <DataList title="Certifications" items={profile.certifications} type="certifications" profile={profile} setProfile={setProfile} fields={['Name', 'Organization', 'Date']} icon={<Award size={20}/>} isOwnProfile={isOwnProfile} />
        </div>

        {/* DANGER ZONE: DELETE ACCOUNT */}
        {isOwnProfile && (
          <div className="mt-12 p-6 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-red-600" size={24} />
              <h2 className="text-xl font-bold text-red-900">Danger Zone</h2>
            </div>
            <p className="text-sm text-red-700 mb-4">
              Deleting your account is permanent. Once deleted, your posts, profile, and connections cannot be recovered.
            </p>
            <button 
              onClick={handleDeleteAccount}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold transition-colors"
            >
              <Trash2 size={18} /> Delete Account
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

function DataList({ title, items, type, profile, setProfile, fields, icon, isOwnProfile, isSkillType }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({});

  const handleAdd = () => {
    let entry;
    if (isSkillType) {
      entry = form[fields[0].toLowerCase()] || '';
    } else {
      entry = {};
      fields.forEach((f) => {
        entry[f.toLowerCase()] = form[f.toLowerCase()] || '';
      });
    }
    
    setProfile({ ...profile, [type]: [...(profile[type] || []), entry] });
    setForm({});
    setShow(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">{icon} {title}</h2>
        {isOwnProfile && (
          <button onClick={() => setShow(true)} className="text-blue-600 hover:bg-blue-50 p-1 rounded-full transition-colors">
            <Plus size={24}/>
          </button>
        )}
      </div>
      
      {show && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-blue-100 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fields.map(f => (
              <input 
                key={f} 
                placeholder={f} 
                className="p-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                onChange={e => setForm({...form, [f.toLowerCase()]: e.target.value})} 
              />
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-blue-700">Add</button>
            <button onClick={() => setShow(false)} className="text-gray-500 text-xs hover:underline">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {items?.map((it, i) => (
          <div key={i} className="flex justify-between items-start group">
            <div className="flex gap-3">
              <div className="size-10 bg-gray-50 rounded flex items-center justify-center text-gray-400 border">{icon}</div>
              {isSkillType ? (
                <p className="font-semibold text-gray-800 self-center">{it}</p>
              ) : (
                <div>
                  <p className="font-bold text-gray-800">{it[fields[0].toLowerCase()]}</p>
                  <p className="text-sm text-gray-600">{it[fields[1].toLowerCase()]}</p>
                  <p className="text-xs text-gray-400">{it[fields[2].toLowerCase()]}</p>
                </div>
              )}
            </div>
            {isOwnProfile && (
              <button 
                onClick={() => setProfile({...profile, [type]: items.filter((_, idx) => idx !== i)})} 
                className="text-gray-300 hover:text-red-500 transition-opacity opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={18}/>
              </button>
            )}
          </div>
        ))}
        {(!items || items.length === 0) && (
          <p className="text-sm text-gray-400 italic">No {title.toLowerCase()} added yet.</p>
        )}
      </div>
    </div>
  );
}
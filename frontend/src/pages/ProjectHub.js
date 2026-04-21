import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import Layout from '../components/Layout';
import { Rocket, X, Plus, ExternalLink, Trash2, User, Search, Github, Link as LinkIcon } from 'lucide-react';

const ProjectHub = () => {
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', link: '', tech_stack: '' });

  const currentUserId = String(localStorage.getItem('userId') || ""); 

  useEffect(() => { 
    fetchProjects(); 
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) { 
      console.error("Fetch Error:", err); 
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await api.delete(`/projects/${projectId}`);
      setProjects((prev) => prev.filter(p => p.id !== projectId));
    } catch (err) {
      alert("Delete failed.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const techArray = formData.tech_stack ? formData.tech_stack.split(',').map(s => s.trim()) : [];
      await api.post('/projects', { ...formData, tech_stack: techArray });
      setShowModal(false);
      setFormData({ title: '', description: '', link: '', tech_stack: '' });
      fetchProjects();
    } catch (err) { 
      alert("Error publishing"); 
    }
  };

  const filteredProjects = projects.filter(project => {
    const titleMatch = project.title.toLowerCase().includes(searchQuery.toLowerCase());
    const techMatch = project.tech_stack?.some(tech => 
      tech.toLowerCase().includes(searchQuery.toLowerCase())
    );
    // Also allows searching by owner name
    const ownerMatch = project.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || techMatch || ownerMatch;
  });

  return (
    <Layout>
      <div className="md:col-span-12 p-4">
        
        {/* --- CONSOLIDATED HEADER & SEARCH --- */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-2xl border shadow-sm gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-lg text-white shadow-lg">
              <Rocket size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-blue-900 tracking-tight">Innovation Hub</h1>
              <p className="text-sm font-medium text-blue-600">Showcase your technical projects</p>
            </div>
          </div>

          {/* This is now your ONLY search bar for this page */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search by title, tech, or owner..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button 
            onClick={() => setShowModal(true)} 
            className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold hover:bg-blue-700 transition flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={20} /> Post Innovation
          </button>
        </div>

        {/* --- PROJECTS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => {
              const ownerId = String(project.user_id || project.project_owner_id || "");
              const isOwner = currentUserId !== "" && ownerId !== "" && currentUserId === ownerId;

              return (
                <div key={project.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col h-full relative group">
                  
                  {isOwner && (
                    <button 
                      onClick={() => handleDelete(project.id)} 
                      className="absolute top-4 right-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all z-30"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}

                  <div className="p-6 flex-1">
                    <h3 className="font-bold text-xl text-blue-900 capitalize mb-2">{project.title}</h3>
                    <p className="text-gray-600 text-sm mb-5 leading-relaxed line-clamp-3">{project.description}</p>
                    <div className="flex flex-wrap gap-2 mt-auto">
                      {project.tech_stack?.map((skill, index) => (
                        <span key={index} className="bg-slate-100 text-slate-700 text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                           {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 border-t border-slate-100 rounded-b-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white">
                         {project.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[12px] font-bold text-gray-700">{project.full_name}</span>
                    </div>

                    {project.link ? (
                      <a 
                        href={project.link.startsWith('http') ? project.link : `https://${project.link}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-[11px] font-bold hover:bg-slate-900 hover:text-white px-3 py-2 rounded-lg transition-all shadow-sm"
                      >
                        {project.link.includes('github.com') ? <Github size={14}/> : <ExternalLink size={14} />}
                        View Source
                      </a>
                    ) : (
                      isOwner && <span className="text-[10px] text-blue-500 font-bold uppercase">Your Project</span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-20">
              <p className="text-gray-400 text-lg font-medium">No results for "{searchQuery}"</p>
            </div>
          )}
        </div>

        {/* --- MODAL --- */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-800">Post New Innovation</h2>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24}/>
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 ml-1 mb-1 block uppercase">Title</label>
                    <input 
                      required 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="e.g. CyberDefense Scanner" 
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 ml-1 mb-1 block uppercase">Description</label>
                    <textarea 
                      required 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 h-24 outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
                      placeholder="What does this innovation do?" 
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 ml-1 mb-1 block uppercase">Tech Stack</label>
                    <input 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="e.g. Python, Kali, React" 
                      value={formData.tech_stack} 
                      onChange={e => setFormData({...formData, tech_stack: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 ml-1 mb-1 block uppercase">GitHub / Project URL</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-3 text-slate-400" size={16} />
                      <input 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="github.com/your-username/repo" 
                        value={formData.link} 
                        onChange={e => setFormData({...formData, link: e.target.value})} 
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 mt-2"
                  >
                    Publish Project
                  </button>
                </form>
             </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProjectHub;
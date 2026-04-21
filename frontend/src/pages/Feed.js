import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axiosInstance';
import Layout from '../components/Layout';
import { ThumbsUp, MessageCircle, Image as ImageIcon, Trash2 } from 'lucide-react';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [profileRes, feedRes] = await Promise.all([
        api.get('/profiles/me'),
        api.get('/posts/feed')
      ]);
      setUserProfile(profileRes.data);
      setPosts(Array.isArray(feedRes.data) ? feedRes.data : []);
    } catch (err) { 
      console.error("Feed loading error", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim() && !selectedImage) return;
    try {
      const formData = new FormData();
      formData.append('content', content);
      if (selectedImage) formData.append('postImage', selectedImage);
      
      const res = await api.post('/posts', formData);
      setPosts([res.data, ...posts]);
      setContent('');
      setSelectedImage(null);
    } catch (err) { 
      alert("Post failed."); 
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500 font-medium">Loading Feed...</div>;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Sidebar */}
        <div className="hidden md:block md:col-span-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden sticky top-20">
            <div className="h-28 bg-slate-400"></div>
            <div className="p-6 -mt-14 text-center">
              <div className="size-28 bg-white border-4 border-white rounded-full mx-auto shadow-md flex items-center justify-center font-bold text-blue-600 text-3xl overflow-hidden mb-4">
                {userProfile?.profile_pic ? (
                  <img src={`http://localhost:5000${userProfile.profile_pic}`} className="size-full object-cover" alt="" />
                ) : (
                  <span className="uppercase">{userProfile?.full_name?.charAt(0) || 'U'}</span>
                )}
              </div>
              <h2 className="font-bold text-gray-900 text-xl">{userProfile?.full_name || 'User'}</h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed px-4">
                {userProfile?.headline || 'Computer Science Student'}
              </p>
            </div>
          </div>
        </div>

        {/* Main Feed */}
        <div className="col-span-1 md:col-span-8 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <form onSubmit={handlePost}>
              <div className="flex gap-3">
                <div className="size-12 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden border">
                   {userProfile?.profile_pic ? (
                    <img src={`http://localhost:5000${userProfile.profile_pic}`} className="size-full object-cover" alt="" />
                  ) : ( <span className="flex items-center justify-center h-full font-bold text-gray-500">{userProfile?.full_name?.charAt(0)}</span> )}
                </div>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl py-3 px-4 text-sm outline-none transition focus:bg-white focus:border-blue-500 min-h-[64px]"
                  placeholder="Start a post..."
                />
              </div>
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">
                <button type="button" onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 text-gray-500 font-bold text-sm hover:bg-gray-100 px-4 py-2 rounded-lg">
                  <ImageIcon size={20} className="text-blue-500"/> Media
                  <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setSelectedImage(e.target.files[0])} accept="image/*" />
                </button>
                <button type="submit" className="bg-[#0a66c2] text-white px-10 py-2 rounded-full font-bold text-sm hover:bg-[#004182]">
                  Post
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-3">
            {posts.map(post => (
              <PostItem 
                key={post.post_id} 
                post={post} 
                setPosts={setPosts} 
                userProfile={userProfile} 
              />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function PostItem({ post, setPosts, userProfile }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState([]);
  
  const currentUserId = userProfile?.user_id;
  const isPostOwner = Number(post.user_id) === Number(currentUserId);
  const postId = post.post_id;

  useEffect(() => {
    if (showComments) {
      api.get(`/posts/comments/${postId}`)
        .then(res => setCommentsList(res.data))
        .catch(err => console.error("Fetch comments error:", err));
    }
  }, [showComments, postId]);

  const handleLike = async () => {
    try {
      const res = await api.post(`/posts/like/${postId}`);
      setPosts(prev => prev.map(p => 
        p.post_id === postId 
          ? { ...p, is_liked: res.data.isLiked, likes_count: res.data.isLiked ? parseInt(p.likes_count) + 1 : parseInt(p.likes_count) - 1 } 
          : p
      ));
    } catch (err) { console.error(err); }
  };

  const handleCommentSubmit = async (e) => {
    if (e.key === 'Enter' && commentText.trim()) {
      try {
        const res = await api.post(`/posts/comment/${postId}`, { comment_text: commentText });
        setCommentsList([...commentsList, res.data]);
        setCommentText('');
        setPosts(prev => prev.map(p => 
          p.post_id === postId ? { ...p, comments_count: parseInt(p.comments_count || 0) + 1 } : p
        ));
      } catch (err) { alert("Comment failed"); }
    }
  };

  const handleDeleteComment = async (idToDelete) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      // Logic check: ensuring ID exists before sending
      if (!idToDelete) return console.error("No comment ID found");

      await api.delete(`/posts/comment/${idToDelete}`);
      
      // Update UI: Filter out the deleted comment
      setCommentsList(prev => prev.filter(c => (c.comment_id || c.id) !== idToDelete));
      
      // Update Feed: Lower comment count
      setPosts(prev => prev.map(p => 
        p.post_id === postId ? { ...p, comments_count: Math.max(0, parseInt(p.comments_count) - 1) } : p
      ));
    } catch (err) { 
      console.error("Delete Error details:", err.response || err);
      alert("Delete failed. Check console for details."); 
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Delete post?")) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts(prev => prev.filter(p => p.post_id !== postId));
    } catch (err) { alert("Delete failed"); }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="p-4">
        <div className="flex justify-between">
          <div className="flex gap-3">
            <div className="size-12 bg-[#0a66c2] text-white flex items-center justify-center rounded-full font-bold uppercase">
              {post.full_name?.charAt(0)}
            </div>
            <div>
              <h3 className="text-sm font-bold">{post.full_name}</h3>
              <p className="text-[10px] text-gray-500">{post.headline}</p>
            </div>
          </div>
          {isPostOwner && (
            <button onClick={handleDeletePost} className="text-gray-400 hover:text-red-600"><Trash2 size={18}/></button>
          )}
        </div>
        <p className="text-sm mt-4">{post.content}</p>
        {post.image_url && <img src={`http://localhost:5000${post.image_url}`} className="mt-3 w-full rounded-lg" alt="" />}
      </div>

      <div className="px-4 py-2 flex justify-between text-[11px] text-gray-500 border-b border-gray-50">
          <span>{post.likes_count || 0} Likes</span>
          <span className="cursor-pointer hover:underline" onClick={() => setShowComments(!showComments)}>
            {post.comments_count || 0} comments
          </span>
      </div>

      <div className="flex py-1">
        <button onClick={handleLike} className={`flex-1 py-2 text-sm flex items-center justify-center gap-2 ${post.is_liked ? 'text-blue-600' : 'text-gray-500'}`}>
          <ThumbsUp size={18} /> Like
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex-1 py-2 text-sm text-gray-500 flex items-center justify-center gap-2">
          <MessageCircle size={18} /> Comment
        </button>
      </div>

      {showComments && (
        <div className="p-3 bg-gray-50 border-t">
          <div className="flex gap-2 mb-4">
             <input 
              type="text" 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={handleCommentSubmit}
              placeholder="Add a comment..." 
              className="w-full text-sm p-2 border border-gray-300 rounded-full outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-3">
            {commentsList.map(comment => {
               // Fallback check for comment ID
               const cID = comment.comment_id || comment.id;
               return (
                <div key={cID} className="flex gap-2">
                  <div className="size-8 bg-[#0a66c2] rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {comment.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 bg-white p-2 rounded-xl border relative">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold">{comment.full_name}</p>
                      {Number(comment.user_id) === Number(currentUserId) && (
                        <button 
                          onClick={() => handleDeleteComment(cID)}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{comment.comment_text}</p>
                  </div>
                </div>
               );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
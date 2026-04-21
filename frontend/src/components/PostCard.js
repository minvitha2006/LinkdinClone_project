import React from 'react';
import { ThumbsUp, MessageCircle, Share2 } from 'lucide-react';
import api from '../api/axiosInstance';

const PostCard = ({ post }) => {
  const handleLike = async () => {
    try {
      await api.post(`/posts/like/${post.id}`);
      // In a real app, you'd update the local state here
    } catch (err) {
      console.error("Like failed", err);
    }
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm mb-4">
      <div className="p-4 flex gap-3">
        <img 
          src={post.profile_picture_url || 'https://via.placeholder.com/150'} 
          className="size-12 rounded-full object-cover bg-gray-200" 
          alt={post.full_name} 
        />
        <div>
          <h3 className="text-sm font-bold hover:underline cursor-pointer">{post.full_name}</h3>
          <p className="text-xs text-gray-500">{post.headline}</p>
        </div>
      </div>
      <div className="px-4 pb-3 text-sm text-gray-800 whitespace-pre-wrap">
        {post.content}
      </div>
      {post.image_url && (
        <img src={post.image_url} className="w-full border-y" alt="Post content" />
      )}
      <div className="flex border-t mx-2 py-1 text-gray-600 font-semibold text-sm">
        <button onClick={handleLike} className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-gray-100 rounded">
          <ThumbsUp size={18} /> Like
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-gray-100 rounded">
          <MessageCircle size={18} /> Comment
        </button>
      </div>
    </div>
  );
};

export default PostCard;
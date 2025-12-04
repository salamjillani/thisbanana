import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MyBlogPosts = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, draft, published, archived

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/blog?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          params,
        }
      );

      setPosts(response.data.posts);
      setError('');
      setLoading(false);

    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setError('Failed to load blog posts');
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) {
      return;
    }

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/blog/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      alert('Blog post deleted successfully');
      fetchPosts();

    } catch (err) {
      console.error('Failed to delete post:', err);
      alert('Failed to delete blog post');
    }
  };

  const handleViewPost = (postId) => {
    navigate(`/blog/${postId}`);
  };

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <header className="bg-card border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-doodle text-banana">My Blog Posts</h1>
            <button
              onClick={() => navigate('/blog-generator')}
              className="bg-banana text-gray-900 px-6 py-2 rounded-lg font-bold hover:opacity-90"
            >
              + Create New Post
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Filter Buttons */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-banana text-gray-900'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            All Posts ({posts.length})
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'draft'
                ? 'bg-banana text-gray-900'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            Drafts
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'published'
                ? 'bg-banana text-gray-900'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            Published
          </button>
          <button
            onClick={() => setFilter('archived')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'archived'
                ? 'bg-banana text-gray-900'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            Archived
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="spinner"></div>
            <p className="text-gray-400 mt-4">Loading your blog posts...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && posts.length === 0 && (
          <div className="text-center py-16 bg-card rounded-xl border border-gray-700">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-2xl font-bold mb-2">No Blog Posts Yet</h3>
            <p className="text-gray-400 mb-6">
              You haven't created any blog posts yet. Start creating your first one!
            </p>
            <button
              onClick={() => navigate('/blog-generator')}
              className="bg-banana text-gray-900 px-8 py-3 rounded-lg font-bold hover:opacity-90"
            >
              Create Your First Blog Post
            </button>
          </div>
        )}

        {/* Blog Posts List */}
        {!loading && posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-card p-6 rounded-xl border border-gray-700 hover:border-banana transition-colors"
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      post.status === 'draft'
                        ? 'bg-gray-600 text-gray-200'
                        : post.status === 'published'
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-gray-500/20 text-gray-300'
                    }`}
                  >
                    {post.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold mb-2 line-clamp-2">
                  {post.title}
                </h3>

                {/* Keyword */}
                {post.targetKeyword && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 mb-1">Target Keyword:</p>
                    <p className="text-sm text-banana">
                      {post.targetKeyword}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => handleViewPost(post.id)}
                    className="flex-1 bg-banana text-gray-900 px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-all"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="flex-1 bg-red-500/20 text-red-300 px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-500/30 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBlogPosts;
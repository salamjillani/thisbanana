import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const BlogPostDetail = () => {
  const { postId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState('draft');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/blog/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      setPost(response.data.post);
      setEditTitle(response.data.post.title);
      setEditStatus(response.data.post.status);
      setLoading(false);

    } catch (err) {
      console.error('Failed to fetch post:', err);
      setError('Failed to load blog post');
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/blog/${postId}`,
        {
          title: editTitle,
          status: editStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      setPost(response.data.post);
      setEditing(false);
      alert('Changes saved successfully!');

    } catch (err) {
      console.error('Failed to save changes:', err);
      alert('Failed to save changes');
    }
  };

  const handleDownload = () => {
    if (!post) return;

    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(post.content)
    );
    element.setAttribute('download', `${post.title}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyToClipboard = () => {
    if (!post) return;

    navigator.clipboard.writeText(post.content).then(() => {
      alert('Blog post copied to clipboard!');
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">{error || 'Blog post not found'}</p>
          <button
            onClick={() => navigate('/my-blog-posts')}
            className="bg-banana text-gray-900 px-6 py-3 rounded-lg font-bold"
          >
            Back to Posts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <header className="bg-card border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/my-blog-posts')}
              className="text-banana hover:underline"
            >
              ← Back to Posts
            </button>
            <h1 className="text-3xl font-doodle text-banana">Blog Post Editor</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-card p-8 rounded-xl border border-gray-700">
              {/* Title Section */}
              <div className="mb-8">
                {editing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-4xl font-bold bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-banana"
                  />
                ) : (
                  <h2 className="text-4xl font-bold">{post.title}</h2>
                )}

                <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
                  <span>
                    Created: {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                  <span>
                    Updated: {new Date(post.updatedAt).toLocaleDateString()}
                  </span>
                  {post.targetKeyword && (
                    <span>Keyword: {post.targetKeyword}</span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="prose prose-invert max-w-none mb-8">
                <div className="text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-900 p-4 rounded-lg max-h-96 overflow-y-auto">
                  {post.content}
                </div>
              </div>

              {/* Full Content Toggle */}
              <details className="mb-8 bg-gray-800 p-4 rounded-lg cursor-pointer">
                <summary className="font-bold text-banana">
                  📄 View Full Content
                </summary>
                <div className="mt-4 text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </div>
              </details>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-card p-6 rounded-xl border border-gray-700">
              <h3 className="font-bold text-lg mb-4">Status</h3>

              {editing ? (
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-banana"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              ) : (
                <span
                  className={`text-sm font-bold px-3 py-1 rounded-full inline-block ${
                    post.status === 'draft'
                      ? 'bg-gray-600 text-gray-200'
                      : post.status === 'published'
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-gray-500/20 text-gray-300'
                  }`}
                >
                  {post.status.toUpperCase()}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="bg-card p-6 rounded-xl border border-gray-700 space-y-3">
              <h3 className="font-bold text-lg mb-4">Actions</h3>

              {editing ? (
                <>
                  <button
                    onClick={handleSaveChanges}
                    className="w-full bg-banana text-gray-900 font-bold py-3 rounded-lg hover:opacity-90 transition-all"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="w-full bg-gray-700 text-white font-bold py-3 rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-all"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={handleDownload}
                    className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-all"
                  >
                    📥 Download
                  </button>
                  <button
                    onClick={handleCopyToClipboard}
                    className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 transition-all"
                  >
                    📋 Copy Content
                  </button>
                </>
              )}
            </div>

            {/* Info Card */}
            <div className="bg-card p-6 rounded-xl border border-gray-700">
              <h3 className="font-bold text-lg mb-4">Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Target Keyword</p>
                  <p className="text-banana font-medium">
                    {post.targetKeyword || 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">SEO Optimized</p>
                  <p className="text-white font-medium">
                    {post.seoOptimized ? '✅ Yes' : '❌ No'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPostDetail;
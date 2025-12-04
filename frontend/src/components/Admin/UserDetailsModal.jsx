import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const UserDetailsModal = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState('');
  const [impersonationToken, setImpersonationToken] = useState('');
  const adminSecret = localStorage.getItem('adminSecret');

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const headers = { 'x-admin-secret': adminSecret };
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/user/${userId}`,
        { headers }
      );
      setUser(response.data.user);
      setTier(response.data.user.tier);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setLoading(false);
    }
  };

  const handleTierChange = async (newTier) => {
    try {
      const headers = { 'x-admin-secret': adminSecret };
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/user/${userId}/tier`,
        { tier: newTier },
        { headers }
      );
      setTier(newTier);
      alert(`User upgraded to ${newTier}`);
      fetchUser();
    } catch (error) {
      console.error('Failed to update tier:', error);
      alert('Failed to update user tier');
    }
  };

  const handleImpersonate = async () => {
    try {
      const headers = { 'x-admin-secret': adminSecret };
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/user/${userId}/impersonate`,
        {},
        { headers }
      );
      setImpersonationToken(response.data.impersonationToken);
      alert('Impersonation token generated. You can now login as this user.');
    } catch (error) {
      console.error('Failed to impersonate:', error);
      alert('Failed to generate impersonation token');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <header className="bg-card border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="text-banana hover:underline"
          >
            ← Back to Admin
          </button>
          <h1 className="text-3xl font-doodle text-banana">User Details</h1>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Info */}
          <div className="md:col-span-2 bg-card p-6 rounded-xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-6">User Information</h2>

            <div className="space-y-4 mb-8">
              <div>
                <p className="text-sm text-gray-400 mb-1">Full Name</p>
                <p className="text-lg font-medium">{user.fullName}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">Company</p>
                <p className="text-lg font-medium">{user.company}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">Subscription Tier</p>
                <p className="text-lg font-medium capitalize">{user.tier}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">Member Since</p>
                <p className="text-lg font-medium">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <hr className="border-gray-700 my-6" />

            <h3 className="text-xl font-bold mb-4">User Stats</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Scans</p>
                <p className="text-2xl font-bold text-banana">{user.stats.scans}</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Blog Posts</p>
                <p className="text-2xl font-bold text-banana">{user.stats.blogPosts}</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Competitors</p>
                <p className="text-2xl font-bold text-banana">{user.stats.competitors}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {/* Change Tier */}
            <div className="bg-card p-6 rounded-xl border border-gray-700">
              <h3 className="text-lg font-bold mb-4">Change Tier (Demo)</h3>
              <div className="space-y-2">
                {['free', 'peel', 'bunch', 'top_banana'].map(t => (
                  <button
                    key={t}
                    onClick={() => handleTierChange(t)}
                    className={`w-full p-3 rounded-lg text-sm font-medium transition-colors ${
                      tier === t
                        ? 'bg-banana text-gray-900'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    {t === 'top_banana' ? 'Top Banana' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Impersonate */}
            <div className="bg-card p-6 rounded-xl border border-gray-700">
              <h3 className="text-lg font-bold mb-4">Impersonate User</h3>
              <button
                onClick={handleImpersonate}
                className="w-full bg-banana text-gray-900 px-4 py-3 rounded-lg font-bold hover:opacity-90"
              >
                Generate Token
              </button>
              {impersonationToken && (
                <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400 mb-2">Token:</p>
                  <code className="text-xs text-banana break-all">
                    {impersonationToken.substring(0, 50)}...
                  </code>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
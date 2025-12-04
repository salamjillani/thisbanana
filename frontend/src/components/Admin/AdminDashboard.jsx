import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminSecret, setAdminSecret] = useState(localStorage.getItem('adminSecret') || '');
  const navigate = useNavigate();

  useEffect(() => {
    if (adminSecret) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [adminSecret]);

  const fetchData = async () => {
    try {
      const headers = { 'x-admin-secret': adminSecret };

      // Fetch metrics
      const metricsRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/metrics`,
        { headers }
      );
      setMetrics(metricsRes.data.metrics);

      // Fetch users
      const usersRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/users?limit=50`,
        { headers }
      );
      setUsers(usersRes.data.users);

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      localStorage.removeItem('adminSecret');
      setAdminSecret('');
      setLoading(false);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    const secret = prompt('Enter admin secret:');
    if (secret) {
      localStorage.setItem('adminSecret', secret);
      setAdminSecret(secret);
    }
  };

  if (!adminSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-doodle text-banana mb-6">Admin Dashboard</h1>
          <button
            onClick={handleAdminLogin}
            className="bg-banana text-gray-900 px-8 py-3 rounded-lg font-bold hover:opacity-90"
          >
            Login as Admin
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <header className="bg-card border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-doodle text-banana">Admin</h1>
          <button
            onClick={() => {
              localStorage.removeItem('adminSecret');
              navigate('/');
            }}
            className="text-red-400 hover:text-red-300"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-card border-b border-gray-700">
        <div className="container mx-auto px-4 flex gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-4 font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'text-banana border-banana'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-4 font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'text-banana border-banana'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-4 font-medium border-b-2 transition-colors ${
              activeTab === 'metrics'
                ? 'text-banana border-banana'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            Metrics
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && metrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title="Total Users"
                value={metrics.totalUsers}
                icon="👥"
              />
              <StatCard
                title="Active Subscribers"
                value={metrics.activeSubscribers}
                icon="💳"
              />
              <StatCard
                title="Monthly Revenue"
                value={`$${metrics.monthlyRecurringRevenue.toFixed(2)}`}
                icon="💰"
              />
              <StatCard
                title="New This Month"
                value={metrics.newUsersThisMonth}
                icon="🆕"
              />
            </div>

            {/* Tier Breakdown */}
            <div className="bg-card p-6 rounded-xl border border-gray-700">
              <h3 className="text-2xl font-bold mb-6">Subscription Breakdown</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">The Peel</p>
                  <p className="text-3xl font-bold text-banana">{metrics.tierBreakdown.peel}</p>
                  <p className="text-xs text-gray-500 mt-2">$49.99/mo</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">The Bunch</p>
                  <p className="text-3xl font-bold text-banana">{metrics.tierBreakdown.bunch}</p>
                  <p className="text-xs text-gray-500 mt-2">$99.99/mo</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">Top Banana</p>
                  <p className="text-3xl font-bold text-banana">{metrics.tierBreakdown.topBanana}</p>
                  <p className="text-xs text-gray-500 mt-2">Custom</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-card rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800 border-b border-gray-700">
                  <tr>
                    <th className="text-left p-4 font-bold">Name</th>
                    <th className="text-left p-4 font-bold">Company</th>
                    <th className="text-left p-4 font-bold">Tier</th>
                    <th className="text-left p-4 font-bold">Status</th>
                    <th className="text-left p-4 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-800">
                      <td className="p-4">
                        <div className="font-medium">{user.fullName}</div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </td>
                      <td className="p-4 text-gray-300">{user.company}</td>
                      <td className="p-4">
                        <span className="text-xs bg-banana/20 text-banana px-2 py-1 rounded capitalize">
                          {user.tier}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded ${
                          user.status === 'active'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => navigate(`/admin/user/${user.id}`)}
                          className="text-banana hover:underline text-sm"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Metrics Tab */}
        {activeTab === 'metrics' && metrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold mb-4">Growth Rate</h3>
                <p className="text-5xl font-bold text-banana">{metrics.growthRate}</p>
                <p className="text-sm text-gray-400 mt-2">New users this month</p>
              </div>

              <div className="bg-card p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold mb-4">Conversion Rate</h3>
                <p className="text-5xl font-bold text-banana">
                  {(
                    ((metrics.activeSubscribers / metrics.totalUsers) * 100).toFixed(1)
                  )}%
                </p>
                <p className="text-sm text-gray-400 mt-2">Active subscribers</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div className="bg-card p-6 rounded-xl border border-gray-700">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold">{title}</h3>
      <span className="text-3xl">{icon}</span>
    </div>
    <p className="text-4xl font-bold text-banana">{value}</p>
  </div>
);

export default AdminDashboard;
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import OutreachTab from './OutreachTab';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { user, session, subscription, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [sources, setSources] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const isPaid = subscription?.subscription_tier !== 'free';

  useEffect(() => {
    if (user && session) {
      fetchDashboardData();
    }
  }, [user, session]);

  const fetchDashboardData = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${session.access_token}`,
      };

      // Fetch stats
      const statsRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/dashboard/stats`,
        { headers }
      );
      setStats(statsRes.data.stats);

      // Fetch historical data (paid only)
      if (isPaid) {
        const historicalRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/dashboard/historical?days=30`,
          { headers }
        );
        setHistoricalData(historicalRes.data.data);

        // Fetch sources
        const sourcesRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/dashboard/sources`,
          { headers }
        );
        setSources(sourcesRes.data.sources);

        // Fetch competitors
        const competitorsRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/dashboard/competitors`,
          { headers }
        );
        setCompetitors(competitorsRes.data.competitors);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/stripe/create-portal-session`,
        {},
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      window.location.href = response.data.url;
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      alert('Failed to open billing portal. Please try again.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  // Chart configuration
  const visibilityChartData = historicalData ? {
    labels: historicalData.visibility.map(d => 
      new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'Brand Visibility %',
        data: historicalData.visibility.map(d => d.value),
        borderColor: '#FFD100',
        backgroundColor: 'rgba(255, 209, 0, 0.1)',
        tension: 0.4,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: '#252525',
        },
        ticks: {
          color: '#9CA3AF',
        },
      },
      x: {
        grid: {
          color: '#252525',
        },
        ticks: {
          color: '#9CA3AF',
        },
      },
    },
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card border-b border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-doodle text-banana">banana</h1>

            <div className="flex items-center gap-4">
              {/* Subscription Badge */}
              <div className="hidden md:flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
                <span className="text-sm text-gray-400">Plan:</span>
                <span className="text-sm font-bold text-banana capitalize">
                  {subscription?.subscription_tier || 'free'}
                </span>
              </div>

              {/* Manage Billing */}
              {isPaid && (
                <button
                  onClick={handleManageBilling}
                  className="hidden md:block text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Manage Billing
                </button>
              )}

              {/* User Menu */}
              <div className="relative group">
                <button className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                  <div className="w-8 h-8 bg-banana rounded-full flex items-center justify-center text-gray-900 font-bold">
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:block text-sm">{user?.email}</span>
                </button>

                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="p-2">
                    <button
                      onClick={() => navigate('/settings')}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Settings
                    </button>
                    {isPaid && (
                      <button
                        onClick={handleManageBilling}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        Manage Billing
                      </button>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card p-6 rounded-xl border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Total Scans</p>
            <p className="text-4xl font-bold text-banana">{stats?.totalScans || 0}</p>
          </div>

          <div className="bg-card p-6 rounded-xl border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Average Visibility</p>
            <p className="text-4xl font-bold text-white">{stats?.averageVisibility || 0}%</p>
          </div>

          <div className="bg-card p-6 rounded-xl border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Latest Sentiment</p>
            <p className="text-3xl font-bold text-white">
              {stats?.latestScan?.sentiment || 'N/A'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-card rounded-xl border border-gray-700 overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-700 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'text-banana border-b-2 border-banana'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('historical')}
              className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'historical'
                  ? 'text-banana border-b-2 border-banana'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Historical
              {!isPaid && <span className="text-xs bg-banana/20 text-banana px-2 py-1 rounded">PRO</span>}
            </button>
            <button
              onClick={() => setActiveTab('sources')}
              className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'sources'
                  ? 'text-banana border-b-2 border-banana'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sources
              {!isPaid && <span className="text-xs bg-banana/20 text-banana px-2 py-1 rounded">PRO</span>}
            </button>
            <button
              onClick={() => setActiveTab('competitors')}
              className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'competitors'
                  ? 'text-banana border-b-2 border-banana'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Competitors
              {!isPaid && <span className="text-xs bg-banana/20 text-banana px-2 py-1 rounded">PRO</span>}
            </button>
            <button
              onClick={() => setActiveTab('outreach')}
              className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'outreach'
                  ? 'text-banana border-b-2 border-banana'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Outreach
              {!isPaid && <span className="text-xs bg-banana/20 text-banana px-2 py-1 rounded">PRO</span>}
            </button>
            <button
              onClick={() => setActiveTab('blogs')}
              className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'blogs'
                  ? 'text-banana border-b-2 border-banana'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              My Blogs
              {!isPaid && <span className="text-xs bg-banana/20 text-banana px-2 py-1 rounded">PRO</span>}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-2xl font-bold mb-6">Welcome back!</h3>
                {stats?.latestScan ? (
                  <div className="bg-gray-800 p-6 rounded-lg">
                    <h4 className="font-bold mb-4">Latest Scan: {stats.latestScan.companyName}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Visibility</p>
                        <p className="text-2xl font-bold text-banana">{stats.latestScan.visibility}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Sentiment</p>
                        <p className="text-2xl font-bold">{stats.latestScan.sentiment}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400 mb-4">No scans yet. Run your first scan!</p>
                    <button
                      onClick={() => navigate('/')}
                      className="bg-banana text-gray-900 px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-all"
                    >
                      Run a Scan
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Historical Tab */}
            {activeTab === 'historical' && (
              <div>
                {isPaid && historicalData ? (
                  <div>
                    <h3 className="text-2xl font-bold mb-6">Visibility Over Time</h3>
                    <Line data={visibilityChartData} options={chartOptions} />
                  </div>
                ) : (
                  <UpgradePrompt feature="Historical Tracking" />
                )}
              </div>
            )}

            {/* Sources Tab */}
            {activeTab === 'sources' && (
              <div>
                {isPaid && sources.length > 0 ? (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold">Source Analysis</h3>
                      <button
                        onClick={() => navigate('/source-analyzer')}
                        className="bg-banana text-gray-900 px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90"
                      >
                        + Analyze New Source
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left py-3 px-4 text-gray-400">Source</th>
                            <th className="text-left py-3 px-4 text-gray-400">Author</th>
                            <th className="text-left py-3 px-4 text-gray-400">Mentions</th>
                            <th className="text-left py-3 px-4 text-gray-400">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sources.map((source) => (
                            <tr key={source.id} className="border-b border-gray-700">
                              <td className="py-3 px-4">
                                {source.url ? (
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-banana hover:underline"
                                  >
                                    {source.title || source.domain}
                                  </a>
                                ) : (
                                  <span className="text-banana">{source.title || source.domain}</span>
                                )}
                              </td>
                              <td className="py-3 px-4">{source.author || 'Unknown'}</td>
                              <td className="py-3 px-4">{source.mentions_count}</td>
                              <td className="py-3 px-4">
                                <span className="text-xs bg-gray-700 px-2 py-1 rounded capitalize">
                                  {(source.outreach_status || '').replace('_', ' ')}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : isPaid ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400 mb-4">No sources found yet.</p>
                    <button
                      onClick={() => navigate('/source-analyzer')}
                      className="bg-banana text-gray-900 px-6 py-3 rounded-lg font-bold hover:opacity-90"
                    >
                      Analyze Your First Source
                    </button>
                  </div>
                ) : (
                  <UpgradePrompt feature="Source Analysis" />
                )}
              </div>
            )}

            {/* Competitors Tab */}
            {activeTab === 'competitors' && (
              <div>
                {isPaid && competitors.length > 0 ? (
                  <div>
                    <h3 className="text-2xl font-bold mb-6">Competitor Analysis</h3>
                    <div className="space-y-4">
                      {competitors.map((competitor) => (
                        <div key={competitor.id} className="bg-gray-800 p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold">{competitor.competitor_name}</h4>
                              <p className="text-sm text-gray-400 mt-1">{competitor.industry}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-banana">
                                {competitor.latest_visibility}%
                              </p>
                              <p className="text-sm text-gray-400">Visibility</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : isPaid ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No competitors tracked yet.</p>
                  </div>
                ) : (
                  <UpgradePrompt feature="Competitor Analysis" />
                )}
              </div>
            )}

            {/* Outreach Tab */}
            {activeTab === 'outreach' && (
              <div>
                {isPaid ? (
                  <OutreachTab />
                ) : (
                  <UpgradePrompt feature="Outreach Management" />
                )}
              </div>
            )}

            {/* My Blogs Tab */}
            {activeTab === 'blogs' && (
              <div>
                {isPaid ? (
                  <MyBlogsTab navigate={navigate} />
                ) : (
                  <UpgradePrompt feature="Blog Generation" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// My Blogs Tab Component
const MyBlogsTab = ({ navigate }) => {
  const { session } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/blog?limit=10`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      setBlogs(response.data.posts);
      setError('');
      setLoading(false);

    } catch (err) {
      console.error('Failed to fetch blogs:', err);
      setError('Failed to load blog posts');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">My Blogs</h3>
        <button
          onClick={() => navigate('/blog-generator')}
          className="bg-banana text-gray-900 px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90"
        >
          + Create New Blog
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {blogs.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <p className="text-gray-400 mb-4">No blog posts yet. Create your first one!</p>
          <button
            onClick={() => navigate('/blog-generator')}
            className="bg-banana text-gray-900 px-6 py-3 rounded-lg font-bold hover:opacity-90"
          >
            Generate Blog Post
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blogs.map((blog) => (
            <div key={blog.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-banana transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-xs font-bold px-2 py-1 rounded capitalize ${
                    blog.status === 'draft'
                      ? 'bg-gray-600 text-gray-200'
                      : blog.status === 'published'
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-gray-500/20 text-gray-300'
                  }`}
                >
                  {blog.status}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(blog.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h4 className="font-bold text-sm mb-2 line-clamp-2">
                {blog.title}
              </h4>

              {blog.targetKeyword && (
                <p className="text-xs text-banana mb-3">
                  {blog.targetKeyword}
                </p>
              )}

              <button
                onClick={() => navigate(`/blog/${blog.id}`)}
                className="w-full bg-banana text-gray-900 px-3 py-2 rounded font-bold text-xs hover:opacity-90 transition-all"
              >
                View
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Upgrade Prompt Component
const UpgradePrompt = ({ feature }) => {
  const navigate = useNavigate();

  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">🔒</div>
      <h3 className="text-2xl font-bold mb-2">Unlock {feature}</h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        Upgrade to a paid plan to access {feature.toLowerCase()} and take full control of your AI visibility.
      </p>
      <button
        onClick={() => navigate('/pricing')}
        className="bg-banana text-gray-900 px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-all"
      >
        View Pricing Plans
      </button>
    </div>
  );
};

export default Dashboard;
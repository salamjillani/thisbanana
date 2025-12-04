import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../components/../context/AuthContext';

const OutreachTab = () => {
  const { session } = useAuth();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [editingSource, setEditingSource] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchSources();
  }, [filter]);

  const fetchSources = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/dashboard/sources`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
          params,
        }
      );

      setSources(response.data.sources);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch sources:', error);
      setLoading(false);
    }
  };

  const updateSourceStatus = async (sourceId, newStatus) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/dashboard/sources/${sourceId}`,
        {
          outreach_status: newStatus,
          outreach_notes: notes,
        },
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      setEditingSource(null);
      setNotes('');
      fetchSources();
    } catch (error) {
      console.error('Failed to update source:', error);
      alert('Failed to update source status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'not_contacted':
        return 'bg-gray-700 text-gray-300';
      case 'contacted':
        return 'bg-blue-500/20 text-blue-300';
      case 'responded':
        return 'bg-green-500/20 text-green-300';
      case 'ignored':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  const getStatusLabel = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Outreach Management</h3>
        
        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-banana text-gray-900'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All ({sources.length})
          </button>
          <button
            onClick={() => setFilter('not_contacted')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'not_contacted'
                ? 'bg-banana text-gray-900'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            To Do
          </button>
          <button
            onClick={() => setFilter('contacted')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'contacted'
                ? 'bg-banana text-gray-900'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Contacted
          </button>
          <button
            onClick={() => setFilter('responded')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'responded'
                ? 'bg-banana text-gray-900'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Responded
          </button>
        </div>
      </div>

      {sources.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No sources found. Run more scans to discover outreach opportunities!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sources.map((source) => (
            <div
              key={source.id}
              className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-bold text-lg">{source.title || source.domain}</h4>
                    <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(source.outreach_status)}`}>
                      {getStatusLabel(source.outreach_status)}
                    </span>
                  </div>

                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-banana hover:underline block mb-3"
                  >
                    {source.url}
                  </a>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    {source.author && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Author</p>
                        <p className="text-sm font-medium">{source.author}</p>
                      </div>
                    )}
                    {source.author_email && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Email</p>
                        <a
                          href={`mailto:${source.author_email}`}
                          className="text-sm text-banana hover:underline"
                        >
                          {source.author_email}
                        </a>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Mentions</p>
                      <p className="text-sm font-medium">{source.mentions_count}</p>
                    </div>
                    {source.contacted_at && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Contacted</p>
                        <p className="text-sm font-medium">
                          {new Date(source.contacted_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {source.outreach_notes && (
                    <div className="bg-gray-900 p-3 rounded-lg mb-3">
                      <p className="text-xs text-gray-500 mb-1">Notes</p>
                      <p className="text-sm text-gray-300">{source.outreach_notes}</p>
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <button
                    onClick={() => {
                      setEditingSource(source.id);
                      setNotes(source.outreach_notes || '');
                    }}
                    className="text-sm text-banana hover:underline"
                  >
                    Update Status
                  </button>
                </div>
              </div>

              {/* Edit Modal */}
              {editingSource === source.id && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Update Status</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['not_contacted', 'contacted', 'responded', 'ignored'].map((status) => (
                        <button
                          key={status}
                          onClick={() => updateSourceStatus(source.id, status)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            source.outreach_status === status
                              ? 'bg-banana text-gray-900'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {getStatusLabel(status)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-banana"
                      rows="3"
                      placeholder="Add notes about your outreach..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingSource(null)}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OutreachTab;
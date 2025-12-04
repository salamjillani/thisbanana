import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const SourceAnalyzer = () => {
  const { session } = useAuth();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError('');

    if (!url) {
      setError('Please enter a URL');
      return;
    }

    // Validate URL
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(url)) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/sources/analyze`,
        { url },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      setSource(response.data.source);
      setUrl('');

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze source');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <header className="bg-card border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-doodle text-banana">Source Analyzer</h1>
          <p className="text-gray-400 mt-1">Extract contact info from sources automatically</p>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Input Form */}
          <form onSubmit={handleAnalyze} className="bg-card p-8 rounded-xl border border-gray-700 mb-8">
            {error && (
              <div className="mb-6 bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-bold mb-2">Article URL *</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                placeholder="https://example.com/article"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-banana disabled:opacity-50"
              />
              <p className="text-xs text-gray-400 mt-2">
                Paste the URL of any article you want to analyze. We'll extract the author and contact info.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-banana text-gray-900 font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="spinner-small"></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                'Analyze Source'
              )}
            </button>
          </form>

          {/* Results */}
          {source && (
            <div className="space-y-4">
              <div className="bg-card p-8 rounded-xl border border-banana">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{source.title}</h3>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-banana hover:underline text-sm"
                    >
                      {source.domain}
                    </a>
                  </div>
                  <span className="text-4xl">✅</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Author</p>
                    <p className="text-lg font-medium">{source.author}</p>
                  </div>

                  {source.authorEmail && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Email</p>
                      <a
                        href={`mailto:${source.authorEmail}`}
                        className="text-lg font-medium text-banana hover:underline"
                      >
                        {source.authorEmail}
                      </a>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-400 mb-1">Published</p>
                    <p className="text-lg font-medium">
                      {new Date(source.publishedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSource(null)}
                  className="w-full bg-banana text-gray-900 font-bold py-3 rounded-lg hover:opacity-90"
                >
                  Analyze Another Source
                </button>
              </div>

              <p className="text-sm text-gray-400 text-center">
                This source has been saved and will appear in your Outreach tab.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SourceAnalyzer;
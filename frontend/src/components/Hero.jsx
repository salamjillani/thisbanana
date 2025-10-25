import React, { useState } from 'react';
import axios from 'axios';

const Hero = ({ onScanComplete }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScan = async (e) => {
    e.preventDefault();
    setError('');

    // Validate URL
    if (!url) {
      setError('Please enter a website URL');
      return;
    }

    // Basic URL validation
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(url)) {
      setError('Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    setLoading(true);

    try {
      // Initiate scan
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/scan`, {
        url: url,
      });

      const { scanId } = response.data;

      // Poll for results
      pollScanResults(scanId);

    } catch (err) {
      setLoading(false);
      if (err.response && err.response.status === 429) {
        setError(err.response.data.message || 'Rate limit exceeded. Please try again later.');
      } else {
        setError(err.response?.data?.error || 'Failed to start scan. Please try again.');
      }
    }
  };

  const pollScanResults = async (scanId) => {
    const maxAttempts = 60; // Poll for up to 60 seconds
    let attempts = 0;

    const poll = setInterval(async () => {
      attempts++;

      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/scan/${scanId}`);
        const { scan } = response.data;

        if (scan.status === 'completed') {
          clearInterval(poll);
          setLoading(false);
          onScanComplete(scan);
        } else if (scan.status === 'failed') {
          clearInterval(poll);
          setLoading(false);
          setError(scan.error || 'Scan failed. Please try again.');
        } else if (attempts >= maxAttempts) {
          clearInterval(poll);
          setLoading(false);
          setError('Scan is taking longer than expected. Please try again.');
        }
      } catch (err) {
        clearInterval(poll);
        setLoading(false);
        setError('Failed to retrieve scan results. Please try again.');
      }
    }, 2000); // Poll every 2 seconds
  };

  return (
    <section id="hero" className="text-center">
      <h2 className="text-5xl md:text-7xl font-doodle max-w-4xl mx-auto leading-tight">
        Turn AI mentions into{' '}
        <span className="text-banana">traffic and customers.</span>
      </h2>
      <p className="mt-6 text-lg text-gray-300 max-w-2xl mx-auto">
        You've mastered SEO, but the world is shifting to AI. Stop guessing. See
        what AI thinks of your brand in 60 seconds and get the tools to win.
      </p>

      <div className="mt-12 max-w-lg mx-auto">
        <form onSubmit={handleScan} className="flex flex-col gap-4">
          <input
            id="websiteUrl"
            type="url"
            placeholder="Enter your website URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-banana placeholder-gray-400 disabled:opacity-50"
          />

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-banana text-gray-900 text-xl font-bold p-4 rounded-lg hover:opacity-90 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none btn-banana"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="spinner"></div>
                <span>Scanning...</span>
              </div>
            ) : (
              'Get Your Free Scan'
            )}
          </button>
        </form>

        {loading && (
          <div className="mt-6 text-gray-400 text-sm animate-fadeIn">
            <p>⚡ Analyzing your website...</p>
            <p className="mt-2">🤖 Running AI simulations...</p>
            <p className="mt-2">This may take 30-60 seconds</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero;
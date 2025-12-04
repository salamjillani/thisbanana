import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Hero = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, session } = useAuth();
  const navigate = useNavigate();

  const handleScan = async (e) => {
    e.preventDefault();
    setError('');

    // Validate URL
    if (!url) {
      setError('Please enter a website URL');
      return;
    }

    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(url)) {
      setError('Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    setLoading(true);

    try {
      // Get or create session ID for anonymous users (only if not logged in)
      let sessionId = null;
      if (!user) {
        sessionId = localStorage.getItem('scan_session_id');
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('scan_session_id', sessionId);
        }
      }

      // Prepare request config
      const config = {};
      if (user && session) {
        // If logged in, send auth token
        config.headers = {
          Authorization: `Bearer ${session.access_token}`,
        };
      }

      // Initiate scan
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/scan`,
        { 
          url: url,
          sessionId: sessionId, // Only send sessionId if not logged in
        },
        config
      );

      const { scanId, requiresAuth } = response.data;

      // Store scan info for later (only for anonymous users)
      if (!user) {
        localStorage.setItem('pending_scan_id', scanId);
        localStorage.setItem('pending_scan_url', url);
      }

      // Poll for results
      pollScanResults(scanId, sessionId, requiresAuth);

    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Failed to start scan. Please try again.');
    }
  };

  const pollScanResults = async (scanId, sessionId, requiresAuth) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = setInterval(async () => {
      attempts++;

      try {
        // Build URL with sessionId only if user is not logged in
        let requestUrl = `${import.meta.env.VITE_API_URL}/api/scan/${scanId}`;
        if (!user && sessionId) {
          requestUrl += `?sessionId=${sessionId}`;
        }

        // Prepare request config
        const config = {};
        if (user && session) {
          config.headers = {
            Authorization: `Bearer ${session.access_token}`,
          };
        }

        const response = await axios.get(requestUrl, config);

        const { scan, accessLevel } = response.data;

        if (scan.status === 'completed') {
          clearInterval(poll);
          setLoading(false);
          
          // Navigate to results page with scan data
          navigate('/results', { 
            state: { 
              scan, 
              scanId, 
              sessionId: !user ? sessionId : null, // Only pass sessionId for anonymous users
              accessLevel,
              requiresAuth: !user // Only require auth if user is not logged in
            } 
          });
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
    }, 2000);
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
              user ? 'Run Your Scan' : 'Get Your Free Scan'
            )}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-400">
          {user ? (
            '✨ Logged in • See full results instantly'
          ) : (
            '✨ Free scan • No credit card required • See results in 60 seconds'
          )}
        </p>

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
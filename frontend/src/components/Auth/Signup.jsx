import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import supabase from '../../config/supabase';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signUp, signInWithGoogle, signInWithGithub } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if coming from a scan
  const fromScan = location.state?.fromScan;
  const scanId = location.state?.scanId;
  const sessionId = location.state?.sessionId;

  useEffect(() => {
    // Pre-fill company name if we have pending scan data
    const pendingUrl = localStorage.getItem('pending_scan_url');
    if (pendingUrl && !companyName) {
      try {
        const domain = new URL(pendingUrl).hostname.replace('www.', '');
        const name = domain.split('.')[0];
        setCompanyName(name.charAt(0).toUpperCase() + name.slice(1));
      } catch (e) {
        // Invalid URL, ignore
      }
    }
  }, []);

  const claimScan = async (scanId, sessionId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/scan/${scanId}/claim`,
        { sessionId },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
    } catch (error) {
      console.error('Failed to claim scan:', error);
      // Don't throw, user can still access dashboard
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password, fullName, companyName);

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // If coming from a scan, claim it
      if (fromScan && scanId && sessionId) {
        try {
          await claimScan(scanId, sessionId);
        } catch (claimError) {
          console.error('Failed to claim scan:', claimError);
          // Continue anyway, user can still see their scans
        }
      }

      // Clear pending scan data
      localStorage.removeItem('pending_scan_id');
      localStorage.removeItem('pending_scan_url');
      localStorage.removeItem('scan_session_id');

      // Redirect to dashboard
      navigate('/dashboard');

    } catch (err) {
      setError(err.message || 'Failed to create account');
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    
    // Store scan info if coming from scan
    if (fromScan && scanId && sessionId) {
      sessionStorage.setItem('pending_scan_claim', JSON.stringify({ scanId, sessionId }));
    }
    
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
    }
  };

  const handleGithubSignup = async () => {
    setError('');
    
    // Store scan info if coming from scan
    if (fromScan && scanId && sessionId) {
      sessionStorage.setItem('pending_scan_claim', JSON.stringify({ scanId, sessionId }));
    }
    
    const { error } = await signInWithGithub();
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 
            className="text-5xl font-doodle text-banana mb-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            banana
          </h1>
          <h2 className="text-3xl font-bold">Create your account</h2>
          {fromScan && (
            <p className="mt-2 text-sm text-gray-400">
              🎉 Sign up to see your complete scan results and track your progress
            </p>
          )}
          {!fromScan && (
            <p className="mt-2 text-sm text-gray-400">
              Start tracking your AI visibility today
            </p>
          )}
        </div>

        <div className="bg-card p-8 rounded-2xl border border-gray-700">
          {error && (
            <div className="mb-4 bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 px-4 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <button
              onClick={handleGithubSignup}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-gray-800 text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Continue with GitHub
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-gray-400">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-banana disabled:opacity-50"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium mb-2">
                Company Name
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-banana disabled:opacity-50"
                placeholder="Acme Inc"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-banana disabled:opacity-50"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password <span className="text-red-400">*</span>
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-banana disabled:opacity-50"
                placeholder="At least 6 characters"
              />
              <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-banana text-gray-900 font-bold py-3 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="spinner-small"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link 
              to="/login" 
              state={{ fromScan, scanId, sessionId }}
              className="text-banana hover:underline font-medium"
            >
              Log in
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          By signing up, you agree to our{' '}
          <a href="/terms" className="text-banana hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="text-banana hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
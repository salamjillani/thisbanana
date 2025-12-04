import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ScanResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { scan, scanId, sessionId, accessLevel, requiresAuth } = location.state || {};

  if (!scan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No scan data found</p>
          <button
            onClick={() => navigate('/')}
            className="bg-banana text-gray-900 px-6 py-3 rounded-lg font-bold hover:opacity-90"
          >
            Start a New Scan
          </button>
        </div>
      </div>
    );
  }

  const isPreview = accessLevel === 'preview';
  const isFull = accessLevel === 'full';
  const isPremium = accessLevel === 'premium';

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <header className="bg-card border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 
            className="text-3xl font-doodle text-banana cursor-pointer"
            onClick={() => navigate('/')}
          >
            banana
          </h1>
          
          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-banana text-gray-900 px-4 py-2 rounded-lg font-bold hover:opacity-90"
            >
              Dashboard
            </button>
          ) : (
            <button
              onClick={() => navigate('/signup', {
                state: {
                  fromScan: true,
                  scanId,
                  sessionId
                }
              })}
              className="bg-banana text-gray-900 px-4 py-2 rounded-lg font-bold hover:opacity-90"
            >
              Sign Up
            </button>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Success Banner */}
        <div className="bg-green-500/20 border border-green-500 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="text-4xl">✅</div>
            <div>
              <h2 className="text-2xl font-bold text-green-300">Scan Complete!</h2>
              <p className="text-gray-300 mt-1">
                Here's what we found about <span className="text-banana">{scan.companyName}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Brand Visibility */}
          <div className="bg-card p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Brand Visibility</h3>
              <span className="text-3xl">👁️</span>
            </div>
            <div className="text-5xl font-bold text-banana mb-2">
              {scan.brandVisibility}%
            </div>
            <p className="text-sm text-gray-400">
              How often AI mentions your brand
            </p>
          </div>

          {/* Sentiment */}
          <div className="bg-card p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Sentiment</h3>
              <span className="text-3xl">
                {scan.sentiment === 'Positive' ? '😊' : scan.sentiment === 'Negative' ? '😟' : '😐'}
              </span>
            </div>
            <div className={`text-4xl font-bold mb-2 ${
              scan.sentiment === 'Positive' ? 'text-green-400' : 
              scan.sentiment === 'Negative' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {scan.sentiment}
            </div>
            <p className="text-sm text-gray-400">
              How AI views your brand
            </p>
          </div>

          {/* Industry */}
          <div className="bg-card p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Industry</h3>
              <span className="text-3xl">🏢</span>
            </div>
            <p className="text-lg text-gray-300 leading-relaxed">
              {scan.industryDescription}
            </p>
          </div>
        </div>

        {/* Show Full Content for Authenticated Users */}
        {(isFull || isPremium) && (
          <>
            {/* Full AI Response */}
            <div className="bg-card p-8 rounded-xl border border-gray-700 mb-8">
              <h3 className="text-2xl font-bold mb-4">AI Response Analysis</h3>
              
              {scan.competitor && (
                <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Main Competitor</p>
                  <p className="text-lg font-bold text-banana">{scan.competitor}</p>
                </div>
              )}

              {scan.brandRanking > 0 && (
                <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Brand Ranking</p>
                  <p className="text-3xl font-bold text-white">#{scan.brandRanking}</p>
                  <p className="text-xs text-gray-400 mt-1">Position in AI recommendations</p>
                </div>
              )}

              {scan.aiResponse && (
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">{scan.aiResponse}</p>
                </div>
              )}
            </div>

            {/* Sources (Premium Only) */}
            {isPremium && scan.sources && scan.sources.length > 0 ? (
              <div className="bg-card p-8 rounded-xl border border-gray-700 mb-8">
                <h3 className="text-2xl font-bold mb-4">Referenced Sources</h3>
                <div className="space-y-3">
                  {scan.sources.map((source, index) => (
                    <div key={index} className="p-4 bg-gray-800 rounded-lg">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-banana hover:underline font-medium"
                      >
                        {source.title || source.url}
                      </a>
                      {source.cited && (
                        <span className="ml-2 text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                          Cited
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : !isPremium && isFull && (
              <div className="bg-card p-8 rounded-xl border border-gray-700 mb-8">
                <div className="text-center">
                  <div className="text-5xl mb-4">📊</div>
                  <h3 className="text-2xl font-bold mb-2">Unlock Source Analysis</h3>
                  <p className="text-gray-400 mb-6">
                    Upgrade to see which sources AI is referencing about your brand
                  </p>
                  <button
                    onClick={() => navigate('/pricing')}
                    className="bg-banana text-gray-900 px-8 py-3 rounded-lg font-bold hover:opacity-90"
                  >
                    View Pricing
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Show Preview/Signup Prompt ONLY for Anonymous Users */}
        {isPreview && !user && (
          <div className="relative mb-8">
            <div className="bg-card p-8 rounded-xl border border-gray-700 blur-sm">
              <h3 className="text-2xl font-bold mb-4">AI Response Analysis</h3>
              <div className="space-y-4">
                <p className="text-gray-300">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                  incididunt ut labore et dolore magna aliqua...
                </p>
                <p className="text-gray-300">
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris...
                </p>
              </div>
            </div>

            {/* Unlock Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-dark/80 rounded-xl">
              <div className="text-center max-w-md">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-3xl font-bold mb-4">Sign Up to See Full Results</h3>
                <p className="text-gray-300 mb-6">
                  Create a free account to unlock:
                </p>
                <ul className="text-left space-y-2 mb-6 text-gray-300">
                  <li className="flex items-center gap-2">
                    <span className="text-banana">✓</span> Complete AI response analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-banana">✓</span> Competitor comparison
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-banana">✓</span> Brand ranking insights
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-banana">✓</span> Save and track your progress
                  </li>
                </ul>
                <button
                  onClick={() => navigate('/signup', { 
                    state: { 
                      fromScan: true, 
                      scanId, 
                      sessionId 
                    } 
                  })}
                  className="w-full bg-banana text-gray-900 text-xl font-bold py-4 rounded-lg hover:opacity-90 transition-all"
                >
                  Create Free Account
                </button>
                <p className="mt-4 text-sm text-gray-400">
                  Already have an account?{' '}
                  <button
                    onClick={() => navigate('/login', { 
                      state: { 
                        fromScan: true, 
                        scanId, 
                        sessionId 
                      } 
                    })}
                    className="text-banana hover:underline"
                  >
                    Log in
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CTA Section for Authenticated Users */}
        {(isFull || isPremium) && (
          <div className="bg-gradient-to-r from-banana/20 to-banana/5 p-8 rounded-xl border border-banana/30">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold mb-2">Ready to Improve Your AI Visibility?</h3>
                <p className="text-gray-300">
                  {isPremium 
                    ? 'Continue tracking your progress and optimizing your AI presence'
                    : 'Upgrade to track competitors, get historical data, and unlock premium features'
                  }
                </p>
              </div>
              <button
                onClick={() => navigate(isPremium ? '/dashboard' : '/pricing')}
                className="bg-banana text-gray-900 px-8 py-3 rounded-lg font-bold hover:opacity-90 whitespace-nowrap"
              >
                {isPremium ? 'Go to Dashboard' : 'View Plans'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanResults;
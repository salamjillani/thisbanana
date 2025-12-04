import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, subscription } = useAuth();
  const navigate = useNavigate();

  const isPaid = user && subscription?.subscription_tier !== 'free';

  return (
    <header className="p-4 sm:p-6 sticky top-0 bg-dark/80 backdrop-blur-sm z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/">
          <h1 className="text-4xl font-doodle text-banana cursor-pointer">
            banana
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center space-x-6 text-sm font-medium">
          <a
            href="/#features-section"
            className="hover:text-banana transition-colors"
          >
            Features
          </a>
          <Link
            to="/pricing"
            className="hover:text-banana transition-colors"
          >
            Pricing
          </Link>
          <a
            href="/#guides-section"
            className="hover:text-banana transition-colors"
          >
            Guides
          </a>
          <a
            href="/#faq-section"
            className="hover:text-banana transition-colors"
          >
            FAQ
          </a>
          
          {user ? (
            <div className="flex items-center gap-4">
              {isPaid && (
                <>
                  <Link
                    to="/blog-generator"
                    className="text-xs bg-banana/20 text-banana px-3 py-1 rounded hover:bg-banana/30 transition-colors"
                  >
                    Blog AI
                  </Link>
                  <Link
                    to="/my-blog-posts"
                    className="text-xs bg-banana/20 text-banana px-3 py-1 rounded hover:bg-banana/30 transition-colors"
                  >
                    My Blogs
                  </Link>
                  <Link
                    to="/source-analyzer"
                    className="text-xs bg-banana/20 text-banana px-3 py-1 rounded hover:bg-banana/30 transition-colors"
                  >
                    Source Analyzer
                  </Link>
                </>
              )}
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-banana text-gray-900 px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-all"
              >
                Dashboard
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="hover:text-banana transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="bg-banana text-gray-900 px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-all"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="sm:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="sm:hidden mt-4 flex flex-col space-y-4 text-sm font-medium animate-fadeIn">
          <a
            href="/#features-section"
            className="hover:text-banana transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Features
          </a>
          <Link
            to="/pricing"
            className="hover:text-banana transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Pricing
          </Link>
          <a
            href="/#guides-section"
            className="hover:text-banana transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Guides
          </a>
          <a
            href="/#faq-section"
            className="hover:text-banana transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            FAQ
          </a>
          
          {user ? (
            <>
              {isPaid && (
                <>
                  <Link
                    to="/blog-generator"
                    className="text-xs bg-banana/20 text-banana px-3 py-1 rounded text-center hover:bg-banana/30 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    ✍️ Blog AI
                  </Link>
                  <Link
                    to="/my-blog-posts"
                    className="text-xs bg-banana/20 text-banana px-3 py-1 rounded text-center hover:bg-banana/30 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    📄 My Posts
                  </Link>
                  <Link
                    to="/source-analyzer"
                    className="text-xs bg-banana/20 text-banana px-3 py-1 rounded text-center hover:bg-banana/30 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    🔗 Sources
                  </Link>
                </>
              )}
              
              <Link
                to="/dashboard"
                className="bg-banana text-gray-900 px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-all text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hover:text-banana transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="bg-banana text-gray-900 px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-all text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
};

export default Header;
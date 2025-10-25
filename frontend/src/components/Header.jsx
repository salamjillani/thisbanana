import React, { useState } from 'react';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="p-4 sm:p-6 sticky top-0 bg-dark/80 backdrop-blur-sm z-50">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-4xl font-doodle text-banana cursor-pointer">
          banana
        </h1>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center space-x-6 text-sm font-medium">
          
          <a
            href="#features-section"
            className="hover:text-banana transition-colors"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="hover:text-banana transition-colors"
          >
            Pricing
          </a>
          <a
            href="#guides-section"
            className="hover:text-banana transition-colors"
          >
            Guides
          </a>
          <a
            href="#faq-section"
            className="hover:text-banana transition-colors"
          >
            FAQ
          </a>
          <a
            href="#login"
            className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold hover:bg-banana hover:text-gray-900 transition-all"
          >
            Log In
          </a>
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
            href="#features-section"
            className="hover:text-banana transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Features
          </a>
          <a
            href="#pricing"
            className="hover:text-banana transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Pricing
          </a>
          <a
            href="#guides-section"
            className="hover:text-banana transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Guides
          </a>
          <a
            href="#faq-section"
            className="hover:text-banana transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            FAQ
          </a>
          <a
            href="#login"
            className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold hover:bg-banana hover:text-gray-900 transition-all text-center"
            onClick={() => setMobileMenuOpen(false)}
          >
            Log In
          </a>
        </nav>
      )}
    </header>
  );
};

export default Header;
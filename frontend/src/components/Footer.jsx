import React from 'react';

const Footer = () => {
  return (
    <footer id="pricing" className="border-t border-gray-800 mt-24 pt-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          <div>
            <h1 className="text-4xl font-doodle text-banana">banana</h1>
            <p className="mt-2 text-sm text-gray-400">
              The Future of Search is AI. Own it.
            </p>
          </div>
          <div className="flex space-x-6 mt-6 md:mt-0">
            <a href="#" className="text-sm text-gray-400 hover:text-banana transition-colors">
              About
            </a>
            <a href="#" className="text-sm text-gray-400 hover:text-banana transition-colors">
              Pricing
            </a>
            <a href="#" className="text-sm text-gray-400 hover:text-banana transition-colors">
              Contact
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
          <p>&copy; 2025 ThisBanana.com. All Rights Reserved.</p>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <a href="#" className="hover:text-gray-300 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-gray-300 transition-colors">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
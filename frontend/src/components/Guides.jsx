import React from 'react';

const Guides = () => {
  const sideGuides = [
    'How to Optimize Your Site for AI Crawlers',
    'Case Study: How We Increased Brand Mentions by 40%',
    'The Top 5 AISO Mistakes to Avoid in 2026',
  ];

  return (
    <div id="guides-section" className="pt-24 mt-24 border-t border-gray-800">
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-5xl md:text-6xl font-doodle">The AISO Guidebook</h2>
        <p className="mt-4 text-lg text-gray-300">
          Generative Engine Optimization is still very new. We've got you covered
          with helpful resources on AISO and AI search.
        </p>
      </div>

      <div className="mt-16 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Featured Article */}
        <div className="bg-card p-8 rounded-2xl border border-gray-700 card-hover animate-fadeIn">
          <p className="text-sm font-bold text-banana">FEATURED • OCT 3, 2025</p>
          <h3 className="mt-4 text-2xl font-bold">
            SEO vs AISO: Why Ranking on ChatGPT Requires a Different Strategy
          </h3>
          <p className="mt-4 text-gray-400">
            Learn the fundamental differences and discover why your old SEO
            tactics won't work for conversational AI.
          </p>
          <div className="mt-6 flex items-center">
            <div className="w-10 h-10 bg-banana rounded-full flex items-center justify-center text-gray-900 font-bold">
              A
            </div>
            <p className="ml-4 font-bold">Amanuel</p>
          </div>
        </div>

        {/* Side Articles */}
        <div className="grid grid-cols-1 gap-6">
          {sideGuides.map((guide, index) => (
            <div
              key={index}
              className="bg-card p-6 rounded-2xl border border-gray-700 card-hover cursor-pointer animate-fadeIn"
              style={{ animationDelay: `${(index + 1) * 0.1}s` }}
            >
              <h4 className="font-bold">{guide}</h4>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Guides;
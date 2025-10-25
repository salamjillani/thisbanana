import React from 'react';

const Features = () => {
  const features = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-banana"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
      ),
      title: 'Find Sources Referenced by AI',
      description:
        'Discover the exact sources AI pulls from, so you can optimize the content that drives visibility and traffic.',
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-banana"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      title: 'Compare Competitors',
      description:
        'Benchmark your brand against competitors and spot opportunities to outrank them in AI conversations.',
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-banana"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: 'Boost Product Visibility',
      description:
        'Get clear, prioritized steps to turn brand mentions into new customers and measurable growth.',
    },
  ];

  return (
    <div id="features-section" className="pt-24 mt-24 border-t border-gray-800">
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-5xl md:text-6xl font-doodle">
          Own your visibility on AI Search.
        </h2>
        <p className="mt-4 text-lg text-gray-300">
          See exactly where you stand, track competitors, and get clear actions
          to turn AI mentions into growth.
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-card p-8 rounded-2xl border border-gray-700 card-hover animate-fadeIn"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center">
              {feature.icon}
            </div>
            <h3 className="mt-6 text-xl font-bold">{feature.title}</h3>
            <p className="mt-2 text-gray-400">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Features;
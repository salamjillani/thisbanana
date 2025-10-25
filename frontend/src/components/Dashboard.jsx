import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = ({ scanData, onNewScan }) => {
  const {
    companyName,
    industryDescription,
    competitor,
    brandVisibility,
    sentiment,
    brandRanking,
    sources,
    aiResponse,
  } = scanData;

  // Chart data (locked for free users)
  const chartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Brand Visibility %',
        data: [0, 0, 0, brandVisibility],
        borderColor: '#FFD100',
        backgroundColor: 'rgba(255, 209, 0, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: '#252525',
        },
        ticks: {
          color: '#9CA3AF',
        },
      },
      x: {
        grid: {
          color: '#252525',
        },
        ticks: {
          color: '#9CA3AF',
        },
      },
    },
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'Positive':
        return 'text-green-400';
      case 'Negative':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getSentimentEmoji = (sentiment) => {
    switch (sentiment) {
      case 'Positive':
        return '😊';
      case 'Negative':
        return '😟';
      default:
        return '😐';
    }
  };

  return (
    <div className="min-h-screen py-16 animate-fadeIn">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-doodle text-banana">
              Your AI Visibility Report
            </h1>
            <p className="mt-2 text-gray-400">
              Company: <span className="text-white font-bold">{companyName}</span>
            </p>
            <p className="text-gray-400">
              Industry: {industryDescription}
            </p>
          </div>
          <button
            onClick={onNewScan}
            className="mt-4 md:mt-0 bg-banana text-gray-900 px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-all btn-banana"
          >
            Run New Scan
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {/* Brand Visibility */}
          <div className="bg-card p-6 rounded-2xl border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Brand Visibility</p>
            <p className="text-4xl font-bold text-banana">{brandVisibility}%</p>
            <p className="text-xs text-gray-500 mt-2">
              {brandVisibility > 50 ? 'Strong presence' : 'Needs improvement'}
            </p>
          </div>

          {/* Sentiment */}
          <div className="bg-card p-6 rounded-2xl border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Sentiment</p>
            <p className={`text-3xl font-bold ${getSentimentColor(sentiment)}`}>
              {getSentimentEmoji(sentiment)} {sentiment}
            </p>
            <p className="text-xs text-gray-500 mt-2">AI perception</p>
          </div>

          {/* Brand Ranking */}
          <div className="bg-card p-6 rounded-2xl border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Brand Ranking</p>
            <p className="text-4xl font-bold text-white">
              #{brandRanking || 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              vs. {competitor}
            </p>
          </div>

          {/* Top Competitor */}
          <div className="bg-card p-6 rounded-2xl border border-gray-700">
         <p className="text-sm text-gray-400 mb-2">Top Competitor</p>
            <p className="text-2xl font-bold text-white truncate">{competitor}</p>
            <p className="text-xs text-gray-500 mt-2">Main rival</p>
          </div>
        </div>

        {/* Chart Section - LOCKED FOR FREE USERS */}
        <div className="bg-card p-8 rounded-2xl border border-gray-700 mb-12 relative">
          <h2 className="text-2xl font-bold mb-6">Visibility Trend</h2>
          
          {/* Blur overlay for free users */}
          <div className="relative">
            <div className="blur-sm pointer-events-none">
              <Line data={chartData} options={chartOptions} />
            </div>
            
            {/* Upgrade overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-dark/80 rounded-lg">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-2xl font-bold mb-2">Unlock Historical Data</h3>
                <p className="text-gray-400 mb-6 max-w-md">
                  See how your visibility changes over time and track your progress with daily scans.
                </p>
                <button className="bg-banana text-gray-900 px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-all btn-banana">
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Response Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* AI Response */}
          <div className="bg-card p-8 rounded-2xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-4">What AI Says</h2>
            <div className="bg-gray-800 p-6 rounded-lg max-h-96 overflow-y-auto">
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {aiResponse}
              </p>
            </div>
          </div>

          {/* Sources */}
          <div className="bg-card p-8 rounded-2xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Sources Referenced</h2>
            {sources && sources.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {sources.map((source, index) => (
                  <div
                    key={index}
                    className="bg-gray-800 p-4 rounded-lg hover:bg-gray-750 transition-colors"
                  >
                    <p className="font-semibold text-banana mb-1">
                      Source {index + 1}
                    </p>
                    <p className="text-sm text-gray-400 truncate">
                      {source.url}
                    </p>
                    {source.title && (
                      <p className="text-sm text-gray-300 mt-2">{source.title}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No sources found in this scan.</p>
            )}
          </div>
        </div>

        {/* Competitor Analysis - LOCKED */}
        <div className="bg-card p-8 rounded-2xl border border-gray-700 mb-12 relative">
          <h2 className="text-2xl font-bold mb-6">Competitor Analysis</h2>
          
          <div className="blur-sm pointer-events-none">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400">Rank</th>
                  <th className="text-left py-3 px-4 text-gray-400">Company</th>
                  <th className="text-left py-3 px-4 text-gray-400">Visibility</th>
                  <th className="text-left py-3 px-4 text-gray-400">Mentions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-700">
                  <td className="py-3 px-4">1</td>
                  <td className="py-3 px-4">{competitor}</td>
                  <td className="py-3 px-4">85%</td>
                  <td className="py-3 px-4">42</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-3 px-4">2</td>
                  <td className="py-3 px-4">{companyName}</td>
                  <td className="py-3 px-4">{brandVisibility}%</td>
                  <td className="py-3 px-4">12</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Upgrade overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-dark/80 rounded-lg">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-2xl font-bold mb-2">Unlock Competitor Insights</h3>
              <p className="text-gray-400 mb-6 max-w-md">
                Compare yourself against competitors and discover opportunities to outrank them.
              </p>
              <button className="bg-banana text-gray-900 px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-all btn-banana">
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>

        {/* Action Items - LOCKED */}
        <div className="bg-card p-8 rounded-2xl border border-gray-700 relative">
          <h2 className="text-2xl font-bold mb-6">Recommended Actions</h2>
          
          <div className="blur-sm pointer-events-none space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-banana rounded-full flex items-center justify-center text-gray-900 font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-bold">Optimize Your Content for AI Citations</h3>
                <p className="text-gray-400 mt-1">
                  Update your content to improve chances of being cited by AI models.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-banana rounded-full flex items-center justify-center text-gray-900 font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold">Contact Key Source Publishers</h3>
                <p className="text-gray-400 mt-1">
                  Reach out to websites that AI frequently references in your industry.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-banana rounded-full flex items-center justify-center text-gray-900 font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold">Generate AI-Optimized Content</h3>
                <p className="text-gray-400 mt-1">
                  Create content specifically designed to rank in AI search results.
                </p>
              </div>
            </div>
          </div>

          {/* Upgrade overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-dark/80 rounded-lg">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-2xl font-bold mb-2">Unlock Action Plan</h3>
              <p className="text-gray-400 mb-6 max-w-md">
                Get personalized, step-by-step guidance to improve your AI visibility.
              </p>
              <button className="bg-banana text-gray-900 px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-all btn-banana">
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-banana/10 to-banana/5 p-12 rounded-2xl border border-banana/20">
          <h2 className="text-4xl md:text-5xl font-doodle mb-4">
            Ready to dominate AI Search?
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Upgrade to unlock daily tracking, competitor analysis, content generation, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-banana text-gray-900 px-8 py-4 rounded-lg font-bold text-lg hover:opacity-90 transition-all btn-banana">
              View Pricing Plans
            </button>
            <button
              onClick={onNewScan}
              className="bg-gray-800 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-700 transition-all"
            >
              Run Another Free Scan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
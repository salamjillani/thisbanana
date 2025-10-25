import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Guides from './components/Guides';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';

function App() {
  const [scanData, setScanData] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);

  const handleScanComplete = (data) => {
    setScanData(data);
    setShowDashboard(true);
    // Scroll to top to show dashboard
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewScan = () => {
    setShowDashboard(false);
    setScanData(null);
    // Scroll to hero section
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="App">
      <Header />

      {showDashboard && scanData ? (
        <Dashboard scanData={scanData} onNewScan={handleNewScan} />
      ) : (
        <>
          <main className="container mx-auto px-4 py-8 sm:py-16">
            <Hero onScanComplete={handleScanComplete} />
            <Features />
            <Guides />
            <FAQ />

            {/* Final CTA Section */}
            <div className="mt-24 pt-24 text-center border-t border-gray-800">
              <h2 className="text-5xl md:text-7xl font-doodle max-w-4xl mx-auto leading-tight">
                Ready to take control of your{' '}
                <span className="text-banana">AI narrative?</span>
              </h2>
              <div className="mt-12 max-w-md mx-auto">
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="w-full bg-banana text-gray-900 text-xl font-bold p-4 rounded-lg hover:opacity-90 transform hover:scale-105 transition-all btn-banana"
                >
                  Get Your Free Scan Now
                </button>
              </div>
            </div>
          </main>

          <Footer />
        </>
      )}
    </div>
  );
}

export default App;
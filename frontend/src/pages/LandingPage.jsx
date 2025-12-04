import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Guides from '../components/Guides';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';

const LandingPage = () => {
  return (
    <div className="App">
      <Header />
      <main className="container mx-auto px-4 py-8 sm:py-16">
        <Hero />
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
    </div>
  );
};

export default LandingPage;
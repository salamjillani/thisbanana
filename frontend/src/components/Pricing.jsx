import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Pricing = () => {
  const [billingInterval, setBillingInterval] = useState('monthly');
  const [loading, setLoading] = useState(null);
  const { user, session } = useAuth();
  const navigate = useNavigate();

  const plans = {
    free: {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      features: [
        'Unlimited free scans',
        'Basic visibility metrics',
        'Competitor identification',
        'AI response preview',
        'Brand sentiment analysis',
      ],
      cta: 'Get Started',
      popular: false,
    },
    peel: {
      name: 'The Peel',
      price: { monthly: 49.99, yearly: 39 }, // $39/mo when billed annually
      yearlyTotal: 468,
      priceId: {
        monthly: import.meta.env.VITE_STRIPE_PEEL_MONTHLY_PRICE_ID,
        yearly: import.meta.env.VITE_STRIPE_PEEL_YEARLY_PRICE_ID,
      },
      features: [
        'Everything in Free',
        '100 AI simulations/month',
        '2 AI-generated blog posts/month',
        'Track 1 competitor',
        'Historical tracking & charts',
        'Source analysis',
        'Email support',
      ],
      cta: 'Upgrade to Peel',
      popular: true,
    },
    bunch: {
      name: 'The Bunch',
      price: { monthly: 99.99, yearly: 79 }, // $79/mo when billed annually
      yearlyTotal: 948,
      priceId: {
        monthly: import.meta.env.VITE_STRIPE_BUNCH_MONTHLY_PRICE_ID,
        yearly: import.meta.env.VITE_STRIPE_BUNCH_YEARLY_PRICE_ID,
      },
      features: [
        'Everything in The Peel',
        '500 AI simulations/month',
        '20 AI-generated blog posts/month',
        'Track 5 competitors',
        'llms.txt generator',
        'Outreach CRM',
        'Priority email support',
      ],
      cta: 'Upgrade to Bunch',
      popular: false,
    },
    topBanana: {
      name: 'Top Banana',
      price: { monthly: 'Custom', yearly: 'Custom' },
      custom: true,
      features: [
        'Everything in The Bunch',
        'Unlimited AI simulations',
        'Unlimited blog posts',
        'Track unlimited competitors',
        'API access',
        'White-label reporting',
        'White-glove onboarding',
        'Dedicated priority support',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  };

  const handleCheckout = async (plan, interval) => {
    if (plan === 'free') {
      navigate('/signup');
      return;
    }

    if (plan === 'topBanana') {
      window.location.href = 'mailto:sales@thisbanana.com?subject=Top Banana Enterprise Inquiry';
      return;
    }

    if (!user) {
      navigate('/signup');
      return;
    }

    setLoading(plan);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/stripe/create-checkout-session`,
        {
          priceId: plans[plan].priceId[interval],
          plan: plan,
          interval: interval,
        },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      // Redirect to Stripe Checkout
      window.location.href = response.data.url;

    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-5xl md:text-6xl font-doodle mb-4">
            Choose Your <span className="text-banana">Plan</span>
          </h2>
          <p className="text-lg text-gray-300">
            Start free, upgrade when you're ready to dominate AI search
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={billingInterval === 'monthly' ? 'text-white font-bold' : 'text-gray-400'}>
            Monthly
          </span>
          <button
            onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
            className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-700"
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-banana transition ${
                billingInterval === 'yearly' ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={billingInterval === 'yearly' ? 'text-white font-bold' : 'text-gray-400'}>
            Yearly
            <span className="ml-2 text-xs text-banana">(Save 20%)</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {Object.entries(plans).map(([key, plan]) => (
            <div
              key={key}
              className={`bg-card rounded-2xl border-2 p-6 relative flex flex-col ${
                plan.popular
                  ? 'border-banana shadow-2xl shadow-banana/20'
                  : 'border-gray-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-banana text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-2">
                  {plan.custom ? (
                    <span className="text-4xl font-bold text-banana">Custom</span>
                  ) : (
                    <>
                      <span className="text-5xl font-bold text-banana">
                        ${typeof plan.price[billingInterval] === 'number' 
                          ? plan.price[billingInterval].toFixed(2)
                          : plan.price[billingInterval]
                        }
                      </span>
                      {plan.price[billingInterval] > 0 && (
                        <span className="text-gray-400">
                          /{billingInterval === 'monthly' ? 'mo' : 'mo'}
                        </span>
                      )}
                    </>
                  )}
                </div>
                {billingInterval === 'yearly' && plan.yearlyTotal && (
                  <p className="text-sm text-gray-400 mt-1">
                    ${plan.yearlyTotal}/year
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-6 flex-grow">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <svg
                      className="w-5 h-5 text-banana flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(key, billingInterval)}
                disabled={loading === key}
                className={`w-full font-bold py-3 rounded-lg transition-all ${
                  plan.popular
                    ? 'bg-banana text-gray-900 hover:opacity-90'
                    : key === 'free'
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === key ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="spinner-small"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-24 max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-8">Detailed Feature Comparison</h3>
          
          <div className="bg-card rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-4 font-bold">Feature</th>
                  <th className="text-center p-4 font-bold">Free</th>
                  <th className="text-center p-4 font-bold bg-banana/10">The Peel</th>
                  <th className="text-center p-4 font-bold">The Bunch</th>
                  <th className="text-center p-4 font-bold">Top Banana</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-700">
                  <td className="p-4">AI Simulations</td>
                  <td className="text-center p-4 text-gray-400">Preview only</td>
                  <td className="text-center p-4 bg-banana/5">100/month</td>
                  <td className="text-center p-4">500/month</td>
                  <td className="text-center p-4">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="p-4">AI Blog Posts</td>
                  <td className="text-center p-4 text-gray-400">—</td>
                  <td className="text-center p-4 bg-banana/5">2/month</td>
                  <td className="text-center p-4">20/month</td>
                  <td className="text-center p-4">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="p-4">Competitor Tracking</td>
                  <td className="text-center p-4 text-gray-400">—</td>
                  <td className="text-center p-4 bg-banana/5">1 competitor</td>
                  <td className="text-center p-4">5 competitors</td>
                  <td className="text-center p-4">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="p-4">Historical Tracking</td>
                  <td className="text-center p-4 text-gray-400">—</td>
                  <td className="text-center p-4 bg-banana/5">✓</td>
                  <td className="text-center p-4">✓</td>
                  <td className="text-center p-4">✓</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="p-4">Source Analysis</td>
                  <td className="text-center p-4 text-gray-400">—</td>
                  <td className="text-center p-4 bg-banana/5">✓</td>
                  <td className="text-center p-4">✓</td>
                  <td className="text-center p-4">✓</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="p-4">Outreach CRM</td>
                  <td className="text-center p-4 text-gray-400">—</td>
                  <td className="text-center p-4 bg-banana/5 text-gray-400">—</td>
                  <td className="text-center p-4">✓</td>
                  <td className="text-center p-4">✓</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="p-4">llms.txt Generator</td>
                  <td className="text-center p-4 text-gray-400">—</td>
                  <td className="text-center p-4 bg-banana/5 text-gray-400">—</td>
                  <td className="text-center p-4">✓</td>
                  <td className="text-center p-4">✓</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="p-4">API Access</td>
                  <td className="text-center p-4 text-gray-400">—</td>
                  <td className="text-center p-4 bg-banana/5 text-gray-400">—</td>
                  <td className="text-center p-4 text-gray-400">—</td>
                  <td className="text-center p-4">✓</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="p-4">White-Label Reporting</td>
                  <td className="text-center p-4 text-gray-400">—</td>
                  <td className="text-center p-4 bg-banana/5 text-gray-400">—</td>
                  <td className="text-center p-4 text-gray-400">—</td>
                  <td className="text-center p-4">✓</td>
                </tr>
                <tr>
                  <td className="p-4">Support</td>
                  <td className="text-center p-4 text-gray-400">Community</td>
                  <td className="text-center p-4 bg-banana/5">Email</td>
                  <td className="text-center p-4">Priority Email</td>
                  <td className="text-center p-4">Dedicated</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h3>

          <div className="space-y-6">
            <div className="bg-card p-6 rounded-xl border border-gray-700">
              <h4 className="font-bold text-lg mb-2">Can I cancel anytime?</h4>
              <p className="text-gray-400">
                Yes! You can cancel your subscription at any time. You'll continue to have
                access until the end of your billing period.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-gray-700">
              <h4 className="font-bold text-lg mb-2">What happens when I hit my usage limits?</h4>
              <p className="text-gray-400">
                Usage limits reset monthly. If you hit your limit, you can upgrade to a higher tier
                or wait until the next billing cycle. Free scans are always unlimited.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-gray-700">
              <h4 className="font-bold text-lg mb-2">Do you offer refunds?</h4>
              <p className="text-gray-400">
                We offer a 14-day money-back guarantee. If you're not satisfied, contact us
                for a full refund.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-gray-700">
              <h4 className="font-bold text-lg mb-2">What payment methods do you accept?</h4>
              <p className="text-gray-400">
                We accept all major credit cards through our secure payment processor, Stripe.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-gray-700">
              <h4 className="font-bold text-lg mb-2">Can I upgrade or downgrade my plan?</h4>
              <p className="text-gray-400">
                Absolutely! You can change your plan at any time from your account settings.
                Changes are prorated automatically.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-gray-700">
              <h4 className="font-bold text-lg mb-2">What is the llms.txt generator?</h4>
              <p className="text-gray-400">
                llms.txt is a file that helps AI models understand your brand better. It's like
                a robots.txt for AI - telling language models accurate information about your
                company so they represent you correctly in their responses.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
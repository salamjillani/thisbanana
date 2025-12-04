import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Pricing plans configuration
export const PRICING_PLANS = {
  peel: {
    name: 'The Peel',
    monthly: {
      priceId: process.env.STRIPE_PEEL_MONTHLY_PRICE_ID,
      amount: 49.99,
      interval: 'month',
    },
    yearly: {
      priceId: process.env.STRIPE_PEEL_YEARLY_PRICE_ID,
      amount: 468, // $39/mo billed annually
      interval: 'year',
    },
    features: {
      simulations: 100,
      blogPosts: 2,
      competitors: 1,
      llmsTxt: false,
      apiAccess: false,
    },
  },
  bunch: {
    name: 'The Bunch',
    monthly: {
      priceId: process.env.STRIPE_BUNCH_MONTHLY_PRICE_ID,
      amount: 99.99,
      interval: 'month',
    },
    yearly: {
      priceId: process.env.STRIPE_BUNCH_YEARLY_PRICE_ID,
      amount: 948, // $79/mo billed annually
      interval: 'year',
    },
    features: {
      simulations: 500,
      blogPosts: 20,
      competitors: 5,
      llmsTxt: true,
      apiAccess: false,
    },
  },
  topBanana: {
    name: 'Top Banana',
    custom: true,
    features: {
      simulations: -1, // unlimited
      blogPosts: -1, // unlimited
      competitors: -1, // unlimited
      llmsTxt: true,
      apiAccess: true,
      whiteLabel: true,
      dedicatedSupport: true,
    },
  },
};

export default stripe;
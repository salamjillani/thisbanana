import express from 'express';
import stripe, { PRICING_PLANS } from '../config/stripe.js';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

/**
 * POST /api/stripe/create-checkout-session
 * Create a Stripe Checkout session for subscription
 */
router.post('/create-checkout-session', authenticate, async (req, res) => {
  try {
    console.log('=== CHECKOUT REQUEST RECEIVED ===');
    console.log('Request body:', req.body);
    
    const { plan, interval } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    console.log('Extracted values:', { plan, interval, userId, userEmail });

    // Validate input
    if (!plan || !interval) {
      console.error('VALIDATION FAILED:', { plan, interval });
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: plan and interval are required',
      });
    }

    // Validate plan exists
    if (!PRICING_PLANS[plan]) {
      return res.status(400).json({
        success: false,
        error: `Invalid plan: ${plan}`,
      });
    }

    // Validate interval
    if (interval !== 'monthly' && interval !== 'yearly') {
      return res.status(400).json({
        success: false,
        error: 'Invalid interval. Must be "monthly" or "yearly"',
      });
    }

    // Get price ID from PRICING_PLANS
    const priceId = PRICING_PLANS[plan][interval]?.priceId;
    
    if (!priceId) {
      console.error('Price ID not found:', { plan, interval, config: PRICING_PLANS[plan] });
      return res.status(400).json({
        success: false,
        error: 'Price configuration not found',
      });
    }

    console.log('Using price ID:', priceId);

    // Get or create Stripe customer
    const { data: userMeta } = await supabase
      .from('user_metadata')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    let customerId = userMeta?.stripe_customer_id;

    if (!customerId) {
      console.log('Creating new Stripe customer');
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          supabase_user_id: userId,
        },
      });

      customerId = customer.id;
      console.log('Created customer:', customerId);

      // Update user metadata with Stripe customer ID
      await supabase
        .from('user_metadata')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    } else {
      console.log('Using existing customer:', customerId);
    }

    // Create Checkout session
    console.log('Creating Stripe checkout session');
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
      metadata: {
        user_id: userId,
        plan: plan,
        interval: interval,
      },
    });

    console.log('Checkout session created:', session.id);

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session',
      message: error.message,
    });
  }
});

/**
 * POST /api/stripe/create-portal-session
 * Create a Stripe Customer Portal session
 */
router.post('/create-portal-session', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get Stripe customer ID
    const { data: userMeta, error } = await supabase
      .from('user_metadata')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (error || !userMeta?.stripe_customer_id) {
      return res.status(400).json({
        success: false,
        error: 'No active subscription found',
      });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: userMeta.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/dashboard`,
    });

    res.json({
      success: true,
      url: session.url,
    });

  } catch (error) {
    console.error('Portal session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create portal session',
      message: error.message,
    });
  }
});

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Log the event
  console.log(`🔔 Webhook received: ${event.type}`);

  // Store event in database for auditing
  await supabase.from('stripe_events').insert([
    {
      stripe_event_id: event.id,
      event_type: event.type,
      customer_id: event.data.object.customer,
      subscription_id: event.data.object.subscription || event.data.object.id,
      payload: event.data.object,
      processed: false,
    },
  ]);

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await supabase
      .from('stripe_events')
      .update({ processed: true })
      .eq('stripe_event_id', event.id);

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    
    // Log error in database
    await supabase
      .from('stripe_events')
      .update({ 
        processed: false,
        error: error.message 
      })
      .eq('stripe_event_id', event.id);

    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutCompleted(session) {
  console.log('✅ Checkout completed:', session.id);

  const customerId = session.customer;
  const subscriptionId = session.subscription;
  const userId = session.metadata.user_id;
  const plan = session.metadata.plan;

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Update user metadata
  await supabase
    .from('user_metadata')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_tier: plan,
      subscription_status: subscription.status,
      subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
      subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('id', userId);

  console.log(`✅ User ${userId} upgraded to ${plan}`);
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 Subscription updated:', subscription.id);

  const customerId = subscription.customer;

  // Find user by Stripe customer ID
  const { data: userMeta } = await supabase
    .from('user_metadata')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!userMeta) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Determine plan tier from subscription items
  const priceId = subscription.items.data[0]?.price.id;
  let plan = 'free';

  for (const [tierName, tierData] of Object.entries(PRICING_PLANS)) {
    if (
      tierData.monthly.priceId === priceId ||
      tierData.yearly.priceId === priceId
    ) {
      plan = tierName;
      break;
    }
  }

  // Update user metadata
  await supabase
    .from('user_metadata')
    .update({
      subscription_tier: plan,
      subscription_status: subscription.status,
      subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('id', userMeta.id);

  console.log(`✅ User ${userMeta.id} subscription updated to ${plan} (${subscription.status})`);
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription) {
  console.log('❌ Subscription deleted:', subscription.id);

  const customerId = subscription.customer;

  // Find user by Stripe customer ID
  const { data: userMeta } = await supabase
    .from('user_metadata')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!userMeta) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Downgrade to free tier
  await supabase
    .from('user_metadata')
    .update({
      subscription_tier: 'free',
      subscription_status: 'canceled',
      stripe_subscription_id: null,
    })
    .eq('id', userMeta.id);

  console.log(`✅ User ${userMeta.id} downgraded to free tier`);
}

/**
 * Handle invoice.payment_succeeded event
 */
async function handlePaymentSucceeded(invoice) {
  console.log('💰 Payment succeeded:', invoice.id);

  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) return;

  // Find user by Stripe customer ID
  const { data: userMeta } = await supabase
    .from('user_metadata')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!userMeta) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Update subscription status to active
  await supabase
    .from('user_metadata')
    .update({
      subscription_status: 'active',
    })
    .eq('id', userMeta.id);

  console.log(`✅ User ${userMeta.id} payment succeeded`);
}

/**
 * Handle invoice.payment_failed event
 */
async function handlePaymentFailed(invoice) {
  console.log('⚠️ Payment failed:', invoice.id);

  const customerId = invoice.customer;

  // Find user by Stripe customer ID
  const { data: userMeta } = await supabase
    .from('user_metadata')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!userMeta) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Update subscription status to past_due
  await supabase
    .from('user_metadata')
    .update({
      subscription_status: 'past_due',
    })
    .eq('id', userMeta.id);

  console.log(`⚠️ User ${userMeta.id} payment failed - marked as past_due`);
}

export default router;
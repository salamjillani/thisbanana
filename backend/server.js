import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import scanRoutes from './routes/scan.js';
import authRoutes from './routes/auth.js';
import stripeRoutes from './routes/stripe.js';
import dashboardRoutes from './routes/dashboard.js';
import blogRoutes from './routes/blog.js';
import llmsRoutes from './routes/llms.js';
import sourcesRoutes from './routes/sources.js';
import adminRoutes from './routes/admin.js';
import scheduledScansRoutes from './routes/scheduled-scans.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// IMPORTANT: Raw body for Stripe webhooks MUST come before express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// Regular JSON parsing for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy (required for rate limiting with IP addresses)
app.set('trust proxy', 1);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/llms', llmsRoutes);
app.use('/api/sources', sourcesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/scheduled-scans', scheduledScansRoutes);
app.use('/api', scanRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ThisBanana.com API is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL}`);
  console.log(`💾 Using Supabase for database`);
  console.log(`💳 Stripe integration enabled`);
  console.log(`🤖 AI features: Blog posts, llms.txt, & Source Analysis`);
  console.log(`👨‍💼 Admin dashboard enabled`);
});
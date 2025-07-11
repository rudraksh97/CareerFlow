const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Backend service configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8000';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// CORS middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'api-gateway'
  });
});

// API proxy middleware - Route all /api/* requests to backend
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(502).json({
      error: 'Backend service unavailable',
      message: 'Unable to connect to backend service'
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    // Log API requests for debugging
    console.log(`[API] ${req.method} ${req.path} -> ${BACKEND_URL}${req.path}`);
  }
}));

// Serve static files from frontend build directory
const frontendPath = path.join(__dirname, 'frontend/dist');
app.use(express.static(frontendPath));

// Handle client-side routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes that weren't caught above
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Gateway error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong in the API gateway'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📁 Serving frontend from: ${frontendPath}`);
  console.log(`🔗 Proxying API requests to: ${BACKEND_URL}`);
  console.log(`🌐 Health check available at: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 API Gateway shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 API Gateway shutting down gracefully...');
  process.exit(0);
}); 
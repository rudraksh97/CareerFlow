# PATS API Gateway Setup Guide

## Overview

The PATS application now includes an API Gateway that provides a **single entry point** for the entire application. This is perfect for hosting with ngrok and eliminates the need to manage multiple ports or deal with CORS issues.

## What Changed

### Before (Multi-Port Setup)
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- **Problem**: ngrok can only expose one port at a time

### After (Single Entry Point)
- Everything: `http://localhost:3000`
- API Gateway handles routing to backend
- **Solution**: Perfect for ngrok hosting

## Architecture

```
                    ┌─────────────────────────────────────┐
                    │           API Gateway               │
                    │         (Port 3000)                 │
                    │                                     │
┌─────────────┐    │  ┌─────────────┐  ┌─────────────┐   │
│   ngrok     │───▶│  │   Static    │  │   API       │   │
│  Tunnel     │    │  │  Serving    │  │  Proxy      │   │
└─────────────┘    │  │             │  │             │   │
                    │  └─────────────┘  └─────────────┘   │
                    │         │               │           │
                    └─────────┼───────────────┼───────────┘
                              │               │
                              ▼               ▼
                    ┌─────────────────┐  ┌─────────────────┐
                    │   React App     │  │   FastAPI       │
                    │ (Static Files)  │  │   Backend       │
                    └─────────────────┘  └─────────────────┘
```

## Quick Start

### Option 1: Using the Startup Script
```bash
# Make sure Docker is running
./start-with-gateway.sh
```

### Option 2: Manual Docker Compose
```bash
# Build and start all services
docker-compose up --build

# Check health
curl http://localhost:3000/health
```

## ngrok Setup

Once your services are running:

```bash
# Install ngrok if you haven't already
# Download from https://ngrok.com/

# Expose your PATS application
ngrok http 3000
```

Your application will be available at the ngrok URL:
- **Frontend**: `https://your-random-url.ngrok.io`
- **API**: `https://your-random-url.ngrok.io/api/*`
- **Health Check**: `https://your-random-url.ngrok.io/health`

## Service Configuration

### API Gateway (`api-gateway/`)
- **Purpose**: Single entry point, static file serving, API proxying
- **Port**: 3000 (exposed)
- **Technology**: Express.js with middleware

### Backend (`backend/`)
- **Purpose**: API endpoints, business logic, database
- **Port**: 8000 (internal only)
- **Technology**: FastAPI with SQLite

### Frontend Build (`frontend/`)
- **Purpose**: React application compiled to static files
- **Output**: `frontend/dist/`
- **Technology**: Vite build process

## API Routes

All requests go through the API Gateway:

| Route Pattern | Destination | Description |
|---------------|-------------|-------------|
| `GET /health` | API Gateway | Health check |
| `/api/*` | Backend | All API endpoints |
| `/*` | Frontend | React app (SPA routing) |

## Environment Variables

### API Gateway
- `PORT`: Server port (default: 3000)
- `BACKEND_URL`: Backend service URL (default: http://backend:8000)
- `CORS_ORIGIN`: CORS origin (default: *)

### Backend
- `DATABASE_URL`: SQLite database path
- Standard FastAPI configuration

## Development vs Production

### Development
```bash
# For development with hot reload
docker-compose up --build

# Backend and frontend will auto-reload on file changes
```

### Production
```bash
# Build optimized version
docker-compose up --build -d

# All services run in background
```

## Troubleshooting

### API Gateway Not Starting
```bash
# Check logs
docker-compose logs api-gateway

# Common issues:
# - Port 3000 already in use
# - Frontend build files missing
# - Backend not accessible
```

### Frontend Not Loading
```bash
# Check if build files exist
ls -la frontend/dist/

# Rebuild frontend
docker-compose up --build frontend-build
```

### Backend API Errors
```bash
# Check backend logs
docker-compose logs backend

# Test backend health (internal)
docker-compose exec api-gateway curl http://backend:8000/health
```

### ngrok Issues
```bash
# Check if port 3000 is accessible
curl http://localhost:3000/health

# Try different ngrok options
ngrok http 3000 --region us --inspect=false
```

## Security Features

The API Gateway includes several security enhancements:

- **Helmet.js**: Security headers
- **CORS**: Cross-origin request handling
- **Compression**: Gzip compression
- **Error Handling**: Graceful error responses
- **Request Logging**: API request monitoring

## Benefits for ngrok Hosting

1. **Single Port**: Only need to expose port 3000
2. **No CORS Issues**: Frontend and backend on same origin
3. **Clean URLs**: Professional-looking API endpoints
4. **Better Performance**: Compressed responses, caching headers
5. **Monitoring**: Health checks and request logging
6. **Security**: Protection against common web vulnerabilities

## Advanced Configuration

### Custom Domain with ngrok
```bash
# If you have a custom domain
ngrok http 3000 --hostname=your-domain.com
```

### Environment-Specific Configuration
```bash
# Production environment
CORS_ORIGIN=https://your-domain.com docker-compose up

# Development environment
CORS_ORIGIN=* docker-compose up
```

### Load Balancing (Future)
The API Gateway can be extended to support multiple backend instances:
```javascript
// In api-gateway/server.js
const backends = [
  'http://backend1:8000',
  'http://backend2:8000'
];
```

## Next Steps

1. **Set up ngrok account** for persistent URLs
2. **Configure custom domain** if needed
3. **Set up monitoring** for production usage
4. **Configure environment variables** for your deployment
5. **Set up SSL certificates** for custom domains

## Support

If you encounter issues:
1. Check the logs with `docker-compose logs`
2. Verify all services are running with `docker-compose ps`
3. Test the health endpoint at `http://localhost:3000/health`
4. Ensure Docker and Docker Compose are up to date 
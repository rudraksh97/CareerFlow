# PATS API Gateway

A lightweight Express.js API Gateway that serves as the single entry point for the PATS (Personal Application Tracking System) application.

## What it Does

The API Gateway provides a unified interface for both frontend and backend services:

1. **Static File Serving**: Serves the React frontend application from `/frontend/dist`
2. **API Proxying**: Routes all `/api/*` requests to the backend service
3. **Single Port Access**: Everything accessible through port 3000
4. **Health Monitoring**: Provides health check endpoint at `/health`

## Architecture

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
│   Client    │───▶│   API Gateway   │───▶│   Backend   │
│ (Browser)   │    │ (Port 3000)     │    │ (Port 8000) │
└─────────────┘    └─────────────────┘    └─────────────┘
                           │
                           ▼
                   ┌─────────────────┐
                   │   Frontend      │
                   │ (Static Files)  │
                   └─────────────────┘
```

## Perfect for ngrok

This setup is ideal for hosting with ngrok because:
- Single port to expose (3000)
- No CORS issues between frontend and backend
- Clean URLs for API endpoints
- Production-ready static file serving

## Environment Variables

- `PORT`: Server port (default: 3000)
- `BACKEND_URL`: Backend service URL (default: http://backend:8000)
- `CORS_ORIGIN`: CORS origin setting (default: *)

## Usage with ngrok

Once the services are running:

```bash
# Start all services
docker-compose up

# In another terminal, expose via ngrok
ngrok http 3000
```

Your application will be available at the ngrok URL with:
- Frontend: `https://your-ngrok-url.ngrok.io`
- API endpoints: `https://your-ngrok-url.ngrok.io/api/*`
- Health check: `https://your-ngrok-url.ngrok.io/health`

## API Routes

- `GET /health` - Health check endpoint
- `GET /api/*` - Proxied to backend service
- `POST /api/*` - Proxied to backend service
- `PUT /api/*` - Proxied to backend service
- `DELETE /api/*` - Proxied to backend service
- `GET /*` - Serves React frontend (client-side routing)

## Development

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Start in production mode
npm start
```

## Security Features

- Helmet.js for security headers
- CORS configuration
- Error handling middleware
- Request logging
- Compression middleware 
# Multi-stage build for frontend
FROM node:20-alpine AS base

# Build arguments for version information
ARG VERSION="unknown"
ARG BUILD_DATE="unknown"
ARG COMMIT_HASH="unknown"
ARG BRANCH="unknown"

# Labels for metadata
LABEL org.opencontainers.image.title="PATS Frontend"
LABEL org.opencontainers.image.description="Personal Application Tracking System - Frontend Application"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.revision="${COMMIT_HASH}"
LABEL org.opencontainers.image.source="https://github.com/rudraksh97/PATS"
LABEL pats.version="${VERSION}"
LABEL pats.component="frontend"
LABEL pats.branch="${BRANCH}"

WORKDIR /app

# Set environment variables to fix crypto issues
ENV NODE_OPTIONS="--openssl-legacy-provider"

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build stage - Creates static files for production
FROM base AS build

# Build the application
RUN npm run build

# Output the build artifacts
CMD ["cp", "-r", "dist", "/app/"]

# Development stage - For development server
FROM base AS dev

ENV VITE_DEV_SERVER_HOST=0.0.0.0

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 
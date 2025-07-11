#!/bin/bash

# PATS API Gateway Startup Script
# This script builds and starts the PATS application with the API Gateway

set -e

echo "🚀 Starting PATS with API Gateway..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
    print_error "Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Clean up any existing containers
print_status "Cleaning up existing containers..."
docker-compose down --remove-orphans 2>/dev/null || true

# Build and start services
print_status "Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 10

# Check if API Gateway is healthy
print_status "Checking API Gateway health..."
for i in {1..30}; do
    if curl -f http://localhost:3000/health >/dev/null 2>&1; then
        print_status "API Gateway is healthy!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "API Gateway failed to start properly."
        print_error "Check the logs with: docker-compose logs api-gateway"
        exit 1
    fi
    sleep 2
done

# Display status
echo ""
echo "🎉 PATS is now running with API Gateway!"
echo ""
echo "📍 Access Points:"
echo "   • Frontend: http://localhost:3000"
echo "   • API Health: http://localhost:3000/health"
echo "   • All API endpoints: http://localhost:3000/api/*"
echo ""
echo "🔧 For ngrok hosting:"
echo "   ngrok http 3000"
echo ""
echo "📊 View logs:"
echo "   docker-compose logs -f api-gateway"
echo "   docker-compose logs -f backend"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose down"
echo ""

# Optional: Show live logs
read -p "Would you like to view live logs? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Showing live logs (Press Ctrl+C to stop)..."
    docker-compose logs -f
fi 
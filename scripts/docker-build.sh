#!/bin/bash

# Docker build script with version information for PATS
# Usage: ./scripts/docker-build.sh [component] [options]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Get version information
VERSION=$(python3 "$SCRIPT_DIR/version_manager.py" current | sed 's/Current version: //')
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Get git information
if git rev-parse --git-dir > /dev/null 2>&1; then
    COMMIT_HASH=$(git rev-parse --short HEAD)
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
else
    COMMIT_HASH="unknown"
    BRANCH="unknown"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 PATS Docker Build${NC}"
echo -e "${YELLOW}Version: ${VERSION}${NC}"
echo -e "${YELLOW}Build Date: ${BUILD_DATE}${NC}"
echo -e "${YELLOW}Commit: ${COMMIT_HASH}${NC}"
echo -e "${YELLOW}Branch: ${BRANCH}${NC}"
echo ""

# Function to build a component
build_component() {
    local component=$1
    local dockerfile_path="$PROJECT_ROOT/$component/Dockerfile"
    local image_name="pats-$component"
    
    if [ ! -f "$dockerfile_path" ]; then
        echo -e "${RED}❌ Dockerfile not found: $dockerfile_path${NC}"
        return 1
    fi
    
    echo -e "${BLUE}Building $component...${NC}"
    
    docker build \
        --build-arg VERSION="$VERSION" \
        --build-arg BUILD_DATE="$BUILD_DATE" \
        --build-arg COMMIT_HASH="$COMMIT_HASH" \
        --build-arg BRANCH="$BRANCH" \
        -t "$image_name:$VERSION" \
        -t "$image_name:latest" \
        -f "$dockerfile_path" \
        "$PROJECT_ROOT/$component/"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Successfully built $image_name:$VERSION${NC}"
    else
        echo -e "${RED}❌ Failed to build $component${NC}"
        return 1
    fi
}

# Function to show image information
show_image_info() {
    local image_name=$1
    echo -e "${BLUE}📋 Image Information for $image_name:${NC}"
    docker image inspect "$image_name:$VERSION" --format='{{range .Config.Labels}}{{printf "  %s\n" .}}{{end}}' 2>/dev/null || echo "  No labels found"
}

# Main logic
case "${1:-all}" in
    "backend"|"be")
        build_component "backend"
        show_image_info "pats-backend"
        ;;
    "frontend"|"fe")
        build_component "frontend"
        show_image_info "pats-frontend"
        ;;
    "all")
        build_component "backend"
        echo ""
        build_component "frontend"
        echo ""
        echo -e "${GREEN}🎉 All components built successfully!${NC}"
        ;;
    "info")
        echo -e "${BLUE}Available images:${NC}"
        docker images | grep "pats-" || echo "No PATS images found"
        ;;
    "clean")
        echo -e "${YELLOW}🧹 Cleaning up PATS images...${NC}"
        docker images | grep "pats-" | awk '{print $3}' | xargs -r docker rmi -f
        echo -e "${GREEN}✅ Cleanup complete${NC}"
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [component] [options]"
        echo ""
        echo "Components:"
        echo "  backend, be    Build only the backend"
        echo "  frontend, fe   Build only the frontend"
        echo "  all            Build all components (default)"
        echo ""
        echo "Options:"
        echo "  info           Show existing PATS images"
        echo "  clean          Remove all PATS images"
        echo "  help           Show this help message"
        ;;
    *)
        echo -e "${RED}❌ Unknown component: $1${NC}"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac 
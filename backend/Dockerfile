FROM python:3.11-slim

# Build arguments for version information
ARG VERSION="unknown"
ARG BUILD_DATE="unknown"
ARG COMMIT_HASH="unknown"
ARG BRANCH="unknown"

# Labels for metadata
LABEL org.opencontainers.image.title="PATS Backend"
LABEL org.opencontainers.image.description="Personal Application Tracking System - Backend API"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.revision="${COMMIT_HASH}"
LABEL org.opencontainers.image.source="https://github.com/rudraksh97/PATS"
LABEL pats.version="${VERSION}"
LABEL pats.component="backend"
LABEL pats.branch="${BRANCH}"

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directory for database
RUN mkdir -p /app/data

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"] 
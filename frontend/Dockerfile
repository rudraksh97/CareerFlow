FROM node:20-alpine

WORKDIR /app

# Set environment variables to fix crypto issues
ENV NODE_OPTIONS="--openssl-legacy-provider"
ENV VITE_DEV_SERVER_HOST=0.0.0.0

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 
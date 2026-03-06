# ============================================
# Rural Tourism Frontend - Production Dockerfile
# ============================================
# Multi-stage: Node.js build → nginx serve

ARG NODE_VERSION=20
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

# Install Ionic CLI globally
RUN npm install -g @ionic/cli@7.2.1

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (legacy-peer-deps for Angular/Ionic compatibility)
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the production app
RUN ionic build --prod -- --output-path=www

# ============================================
# Nginx runtime stage
# ============================================
FROM nginx:1.27-alpine AS runtime

# Install wget for healthcheck
RUN apk add --no-cache wget

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app from builder stage
COPY --from=builder /app/www /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

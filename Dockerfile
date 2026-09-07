# Stage 1: Build Angular Frontend Application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build production bundle
COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve compiled Angular app via Nginx
FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx HTML files
RUN rm -rf ./*

# Copy built Angular application files from builder stage
COPY --from=builder /app/dist/hrms-frontend/browser ./
# If dist structure differs, fallback copy pattern
COPY --from=builder /app/dist/hrms-frontend/ ./ 2>/dev/null || true

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

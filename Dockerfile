# Stage 1: Build Frontend
FROM node:20-slim as frontend-builder

# Set working directory for frontend
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm install --include=dev

# Copy frontend source code
COPY frontend/ ./

# Build frontend
RUN npm run build

# Stage 2: Setup Backend & Serve
FROM node:20-slim

# Set working directory for backend
WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Copy backend source code first
COPY backend/ ./

# Ensure no windows node_modules persist
RUN rm -rf node_modules

# Install backend dependencies (production only)
RUN npm install --production

# Copy built frontend assets from Stage 1 to 'public' folder in backend
COPY --from=frontend-builder /app/frontend/dist ./public

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start the server
CMD ["node", "server.js"]

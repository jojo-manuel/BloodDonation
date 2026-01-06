# Stage 1: Build Frontend
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
# Copy frontend package files
COPY frontend/package*.json ./
RUN npm install
# Copy frontend source
COPY frontend/ .
RUN npm run build

# Stage 2: Setup Backend
FROM node:18-alpine
WORKDIR /app
# Copy backend package files
COPY blood-system/backend-monolith/package*.json ./
RUN npm install
# Copy backend source
COPY blood-system/backend-monolith/ .

# Copy built frontend assets to 'public' folder
# Backend app.js serves static files from '../public' relative to 'src', which resolves to '/app/public'
COPY --from=frontend-build /app/frontend/dist ./public

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]

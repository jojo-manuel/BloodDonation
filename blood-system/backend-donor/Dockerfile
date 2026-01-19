# Donor Backend Service Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend-donor/package*.json ./

# Install dependencies
RUN npm install

# Copy shared modules from monolith
COPY backend-monolith/src/modules/auth/ ./src/modules/auth/
COPY backend-monolith/src/modules/donor/ ./src/modules/donor/
COPY backend-monolith/src/modules/patient/ ./src/modules/patient/
COPY backend-monolith/src/modules/request/ ./src/modules/request/
COPY backend-monolith/src/modules/inventory/ ./src/modules/inventory/
COPY backend-monolith/src/modules/users/ ./src/modules/users/
COPY backend-monolith/src/modules/bloodbank/ ./src/modules/bloodbank/
COPY backend-monolith/src/middleware/ ./src/middleware/

# Copy source code (app.js, server.js, and local module overrides)
COPY backend-donor/src/ ./src/

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]

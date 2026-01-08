# Blood Bank Backend Service Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend-bloodbank/package*.json ./

# Install dependencies
RUN npm install

# Copy source code (app.js and server.js)
COPY backend-bloodbank/src/ ./src/

# Copy shared modules from monolith
COPY backend-monolith/src/modules/auth/ ./src/modules/auth/
COPY backend-monolith/src/modules/bloodbank/ ./src/modules/bloodbank/
COPY backend-monolith/src/modules/inventory/ ./src/modules/inventory/
COPY backend-monolith/src/modules/donor/ ./src/modules/donor/
COPY backend-monolith/src/modules/request/ ./src/modules/request/
COPY backend-monolith/src/modules/notification/ ./src/modules/notification/
COPY backend-monolith/src/modules/users/ ./src/modules/users/
COPY backend-monolith/src/modules/chat/ ./src/modules/chat/
COPY backend-monolith/src/middleware/ ./src/middleware/

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]

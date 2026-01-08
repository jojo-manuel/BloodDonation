# Login Backend Service Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend-login/package*.json ./

# Install dependencies
RUN npm install

# Copy source code (app.js and server.js)
COPY backend-login/src/ ./src/

# Copy shared modules from monolith
COPY backend-monolith/src/modules/auth/ ./src/modules/auth/
COPY backend-monolith/src/modules/users/ ./src/modules/users/
COPY backend-monolith/src/middleware/ ./src/middleware/

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]

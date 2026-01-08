# Admin Backend Service Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend-admin/package*.json ./

# Install dependencies
RUN npm install

# Copy source code (app.js and server.js)
COPY backend-admin/src/ ./src/

# Copy shared modules from monolith
COPY backend-monolith/src/modules/auth/ ./src/modules/auth/
COPY backend-monolith/src/modules/admin/ ./src/modules/admin/
COPY backend-monolith/src/modules/users/ ./src/modules/users/
COPY backend-monolith/src/modules/request/ ./src/modules/request/
COPY backend-monolith/src/middleware/ ./src/middleware/

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]

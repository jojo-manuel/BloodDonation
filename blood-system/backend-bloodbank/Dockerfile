# Blood Bank Backend Service Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend-bloodbank/package*.json ./

# Install dependencies
RUN npm install

# Copy source code (app.js, server.js, and routes)
COPY backend-bloodbank/src/ ./src/

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]

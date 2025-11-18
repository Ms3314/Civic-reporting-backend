# Use Node.js LTS version
FROM node:20-alpine

# Install necessary tools for Prisma
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Run database migrations and start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node index.js"]


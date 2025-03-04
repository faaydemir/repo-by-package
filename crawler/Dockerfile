# Build stage: use Node.js Alpine image for smaller size
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production

# Generate Prisma client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy application code
COPY . .

# Runtime stage: create a smaller image for running the app
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/app ./app
COPY --from=builder --chown=nodejs:nodejs /app/main.js ./

# Use non-root user
USER nodejs

# Set environment to production
ENV NODE_ENV production

# Run the application with automatic restart on failure
CMD ["node", "--unhandled-rejections=strict", "main.js"]

# Use a health check to monitor the app
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD node -e "process.exit(0)" || exit 1
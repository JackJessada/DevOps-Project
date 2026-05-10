FROM node:20-alpine
WORKDIR /app

# Install dependencies first (cached)
COPY package.json package-lock.json ./
RUN npm install

# Copy rest of the code
COPY . .

# Generate Prisma client
# Use a dummy DATABASE_URL to satisfy prisma.config.ts validation during build
RUN DATABASE_URL="postgresql://placeholder:5432" npx prisma generate

EXPOSE 3000

# Run in development mode
CMD ["npm", "run", "dev"]

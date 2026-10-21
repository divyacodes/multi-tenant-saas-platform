FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application code
COPY . .

# Expose server port
EXPOSE 5001

# Run migrations, seeds, and start server
CMD ["sh", "-c", "node src/database/migrate.js up && node src/database/seeds/seed.js && node src/server.js"]

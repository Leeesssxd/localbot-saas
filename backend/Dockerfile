FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

EXPOSE 3000

# Apply DB migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node src/app.js"]

FROM node:20-alpine
RUN apk add --no-cache curl iputils bind-tools netcat-openbsd
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY prisma ./prisma/
RUN npx prisma generate
COPY . .

ENV NODE_ENV development
CMD ["node", "main.js"]
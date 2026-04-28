# Multi-stage Dockerfile for ThreadNet (Vite + React)

FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies (use lockfile if present)
COPY package*.json ./
RUN if [ -f package-lock.json ]; then \
  npm ci --prefer-offline --no-audit --no-fund; \
  else npm install --prefer-offline --no-audit --no-fund; \
  fi

# Copy source and build
COPY . .
RUN npm run build

# Serve with nginx
FROM nginx:stable-alpine AS runner
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

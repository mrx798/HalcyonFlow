# Stage 1 — Build
FROM node:20-slim AS build

WORKDIR /app

# Accept API URL as build argument (Railway sets this)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy package files first for dependency caching
COPY package*.json .

# Install dependencies (no silent to see errors)
RUN npm install --no-audit --legacy-peer-deps && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2 — Serve
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration template
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

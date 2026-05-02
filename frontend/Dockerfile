# ── Stage 1: Build ────────────────────────────────────────────────────────────
# Uses Node 20 Alpine to keep the image small.
# Builds the Vite/React app into a static /dist folder.
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer-cached unless package.json changes)
##COPY package.json package-lock.json* ./
##RUN npm ci
COPY package.json ./
RUN npm install

# Copy source and build
COPY . .

# VITE_API_BASE is injected at build time via --build-arg or compose env.
# Defaults to /api/v1 so nginx can proxy it to the backend container.
ARG VITE_API_BASE=/api/v1
ENV VITE_API_BASE=$VITE_API_BASE

RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
# Nginx Alpine serves the static files and proxies /api → backend.
FROM nginx:1.27-alpine AS runner

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Bake in our nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

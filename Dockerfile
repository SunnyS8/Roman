# --- Stage 1: build ---
FROM node:22-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json tsup.config.ts ./
COPY src/ ./src/
RUN npm run build

# --- Stage 2: runtime ---
FROM node:22-slim

# Python + pip + edge-tts for TTS voice responses
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1 \
    libpango-1.0-0 libcairo2 libasound2 libxshmfence1 \
    && pip3 install --break-system-packages --no-cache-dir edge-tts \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

# Install Playwright Chromium
RUN npx playwright install chromium

COPY --from=build /app/dist/ ./dist/

EXPOSE 3777

CMD ["node", "dist/index.js"]
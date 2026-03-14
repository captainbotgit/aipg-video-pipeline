FROM node:20-slim

# Install Chromium and FFmpeg for Remotion rendering
RUN apt-get update && apt-get install -y \
  chromium \
  ffmpeg \
  fonts-noto-cjk \
  fonts-noto-color-emoji \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV REMOTION_CHROME_EXECUTABLE=/usr/bin/chromium
ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3100

CMD ["npm", "run", "server"]

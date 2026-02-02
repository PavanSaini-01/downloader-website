# Stage 1: Build the React Client
FROM node:18-alpine AS client-build
WORKDIR /usr/src/app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
# Set API URL to empty to treat backend as relative path (same origin)
ENV VITE_API_URL=""
RUN npm run build

# Stage 2: Setup the Server
FROM node:18-alpine
WORKDIR /usr/src/app

# Install dependencies for yt-dlp
RUN apk add --no-cache python3 py3-pip ffmpeg
# Install yt-dlp
RUN pip3 install --no-cache-dir https://github.com/yt-dlp/yt-dlp/archive/master.zip --break-system-packages || pip3 install --no-cache-dir https://github.com/yt-dlp/yt-dlp/archive/master.zip

# Install Node dependencies
COPY server/package*.json ./
RUN npm install

# Copy Server Code
COPY server/ ./

# Copy Built Client from Stage 1 to 'public' folder in server
COPY --from=client-build /usr/src/app/client/dist ./public

EXPOSE 4000

# Create startup script that decodes cookies from env var if present
RUN echo '#!/bin/sh' > /usr/src/app/start.sh && \
    echo 'if [ -n "$YOUTUBE_COOKIES_BASE64" ]; then' >> /usr/src/app/start.sh && \
    echo '  echo "$YOUTUBE_COOKIES_BASE64" | base64 -d > /usr/src/app/youtube_cookies.txt' >> /usr/src/app/start.sh && \
    echo '  echo "YouTube cookies loaded from environment variable"' >> /usr/src/app/start.sh && \
    echo 'fi' >> /usr/src/app/start.sh && \
    echo 'exec npm start' >> /usr/src/app/start.sh && \
    chmod +x /usr/src/app/start.sh

CMD ["/usr/src/app/start.sh"]

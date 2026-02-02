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

# Install Node dependencies
COPY server/package*.json ./
RUN npm install

# Copy Server Code
COPY server/ ./

# Copy Built Client from Stage 1 to 'public' folder in server
COPY --from=client-build /usr/src/app/client/dist ./public

EXPOSE 4000

CMD ["npm", "start"]

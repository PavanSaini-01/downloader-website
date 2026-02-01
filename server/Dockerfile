# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Install Python and ffmpeg (dependencies for yt-dlp)
RUN apk add --no-cache python3 py3-pip ffmpeg

# Install yt-dlp using pip
# Break system packages is needed on some newer alpine versions to install via pip into system, 
# or we can use a venv, but for a simple container this is often easier.
# Adding --break-system-packages for safety if we hit newer python/pip versions in alpine.
RUN pip3 install --no-cache-dir yt-dlp --break-system-packages || pip3 install --no-cache-dir yt-dlp

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json matches
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 4000

# Define the command to run the app
CMD [ "npm", "start" ]

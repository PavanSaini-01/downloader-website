# Downloader Website

This project is a web application for downloading videos, consisting of a React frontend and an Express backend.

## Prerequisites

-   [Node.js](https://nodejs.org/) installed on your machine.

## Project Structure

-   `client/`: React frontend (Vite)
-   `server/`: Node.js backend (Express)

## How to Run

You need to run both the server and the client simultaneously (in separate terminal windows).

### 1. Setup & Run Server

Open a terminal and run:

```bash
cd server
npm install
npm start
```

The server will typically run on `http://localhost:3000` (or the port defined in `index.js`).

### 2. Setup & Run Client

Open a **new** terminal window and run:

```bash
cd client
npm install
npm run dev
```

The client will start (usually on `http://localhost:5173`) and you can view it in your browser.

## Build for Production

To build the client for production:

```bash
cd client
npm run build
```

## Deployment (Render.com)

This project is configured for easy deployment on Render using Docker.

**Option 1: Blueprints (Recommended)**
1.  Push this code to a GitHub repository.
2.  In Render dashboard, click "New" > "Blueprint".
3.  Connect your repository.
4.  Render will automatically detect `render.yaml` and configure the service.
5.  Click "Apply".

**Option 2: Manual Docker Service**
1.  Push code to GitHub.
2.  Create a new "Web Service".
3.  Connect your repository.
4.  **Important**: Select **Docker** as the Runtime (not Node).
5.  Create Web Service.

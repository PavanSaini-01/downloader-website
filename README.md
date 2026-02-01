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

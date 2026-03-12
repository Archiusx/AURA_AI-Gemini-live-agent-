# Gemini Live Agent Project

This repository contains the boilerplate codebase for the **Gemini Live Agent** project, as part of the Devpost Gemini Live Agent Challenge. It includes a frontend React application and a backend Python FastAPI application configured to work together to facilitate real-time interactions using voice, video, and text streams.

## System Architecture

The project architecture is designed around the following flow:

1.  **User**: Interacts with the system via a web application.
2.  **Webapp (Frontend)**: A React application running in the browser (Chrome). It utilizes **WebRTC** to capture Voice Stream, Video Stream, and Text Stream inputs from the user.
3.  **Firebase Authentication**: Handles secure user sign-in and session management.
4.  **Backend Middleware (FastAPI)**: Receives the user inputs and processes them through several layers:
    *   **Safety Layer**: A security filter to check the inputs before processing.
    *   **Google Agent Development Kit (ADK)**: A modular system consisting of:
        *   **Planner Agent**: Determines the sequence of actions.
        *   **Router Tools**: Routes tasks to the appropriate tools.
        *   **Knowledge Retriever**: Fetches relevant context or information.
    *   **Gemini Live API**: The core AI model that processes the multimodal inputs and generates responses.
    *   **Tools Layer**: External capabilities that the agent can utilize, including:
        *   Search
        *   Vector DB
        *   Google APIs
5.  **Firestore Database**: Stores the conversational audio and text responses for history, analytics, or asynchronous retrieval.
6.  **Output**: The system generates conversational audio and text responses back to the user via the Webapp.

## Project Structure

*   `frontend/`: Contains the React/Vite application for the user interface.
*   `backend/`: Contains the Python FastAPI application, which acts as the middleware and integrates with the Gemini Live API and other components.

## Setup Guide

### 1. Backend Setup

The backend is built with Python 3 and FastAPI. It uses WebSockets to simulate real-time streaming for WebRTC.

**Prerequisites:**
*   Python 3.8+
*   `pip` (Python package manager)

**Installation Steps:**

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  (Optional but recommended) Create and activate a virtual environment:
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On Linux/macOS
    # venv\Scripts\activate  # On Windows
    ```
3.  Install the required dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Run the FastAPI development server:
    ```bash
    uvicorn main:app --reload
    ```
    The backend server will start at `http://localhost:8000`. The WebSocket endpoint is available at `ws://localhost:8000/ws`.

### 2. Frontend Setup

The frontend is a React application created with Vite.

**Prerequisites:**
*   Node.js (v16+)
*   `npm` or `yarn`

**Installation Steps:**

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install the necessary dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The frontend application will start and can be accessed in your browser (usually at `http://localhost:5173`).

## Next Steps

This repository serves as a starting point. To fully implement the Gemini Live Agent, you will need to:

*   Configure Firebase Authentication in the frontend and backend.
*   Implement real WebRTC logic in the frontend to capture actual media streams.
*   Integrate the actual Gemini Live API using your Google Cloud credentials in the backend.
*   Flesh out the logic within the Safety Layer, ADK components (Planner, Router, Retriever), and Tools Layer stubs in `backend/main.py`.
*   Set up a Firebase project and configure Firestore to save the conversations.

## Deployment

### Hosting the Frontend (Netlify)

The React frontend is perfectly suited to be hosted on Netlify for free. We have included a `frontend/netlify.toml` file to configure the build automatically.

1.  Create an account at [Netlify](https://www.netlify.com/).
2.  Click **Add new site** -> **Import an existing project**.
3.  Connect your GitHub repository.
4.  Set the **Base directory** to `frontend`.
5.  Netlify will automatically detect the build command (`npm run build`) and the publish directory (`dist`).
6.  Click **Deploy site**.

### Hosting the Backend (Render, Railway, or Google Cloud Run)

The backend uses FastAPI and WebSockets, which require a server environment that supports long-lived connections. You cannot host this backend on serverless platforms like Netlify or Vercel functions easily.

*   **Render / Railway**: These platforms offer simple, Docker-based or Python-native hosting that supports WebSockets. You would set the root directory to `backend` and the start command to `uvicorn main:app --host 0.0.0.0 --port $PORT`.
*   **Google Cloud Run**: As part of a Google Devpost challenge, deploying the backend container to Cloud Run is highly recommended. You will need to create a `Dockerfile` for the backend and deploy the container. Note that Cloud Run supports WebSockets.

**Note:** Once you deploy the backend, you must update the `WebSocket` URL in `frontend/src/App.jsx` from `ws://localhost:8000/ws` to your new production secure websocket URL (e.g., `wss://your-backend-app.onrender.com/ws`).

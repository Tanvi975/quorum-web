# Quorum -- Frontend

Quorum is a collaborative workspace platform that brings team
communication, project coordination, meetings, and productivity tools
into one place.

-   **Live application:** https://newquorum.me/
-   **Frontend repository:** https://github.com/Tanvi975/quorum-web

## Overview

The Quorum frontend is built with React and Vite. It provides the user
interface for organization workspaces, teams, projects, real-time
collaboration, and connected productivity features.

## Features

### 1. Authentication and onboarding

-   Login and sign-up
-   Forgot password and password reset
-   Verification and single sign-on screens
-   Protected application routes
-   Organization onboarding and invitations

### 2. Dashboard and organization workspace

-   Dashboard and organization overview
-   Create, join, and switch between organizations
-   Organization members and team management
-   Organization feed with posts and comments
-   Organization-level projects, documents, and whiteboards

### 3. Team collaboration

-   Team chat and real-time messaging
-   Message actions, replies, reactions, and voice messages
-   Presence indicators
-   Virtual Office interface for team collaboration
-   Jira connection and ticket/board views
-   GitHub connection with repository, issues, pull requests, commits,
    branches, and collaborators views

### 4. Project management

-   Project listing and project details
-   Project members
-   Task board
-   Project resources
-   Deliverable review
-   Project-specific chat and real-time updates

### 5. Meetings

-   Video meeting interface
-   Camera and microphone controls
-   Participant and meeting side panels
-   Screen-sharing support in the meeting experience
-   Meeting chat, reactions, hand-raising, and polls
-   Meeting history and recording pages

### 6. Whiteboards and documents

-   Whiteboard workspace and canvas
-   Whiteboard toolbar and collaboration socket hook
-   Document listing and creation
-   Document editor and details panel

### 7. Calendar and saved items

-   Calendar interface and event management
-   Saved Items page for accessing saved content

### 8. Communities

-   Browse and create communities
-   Community details and channels
-   Posts and attachments
-   Invitations and join requests

### 9. Quorum AI Assistant

-   AI chat
-   Workspace search
-   Project assistance
-   Project/status update generation
-   Workflow planning and execution
-   AI conversation history
-   File attachments, voice input, and quick-reply helpers

## Tech stack

-   **React 19** -- component-based user interface
-   **Vite 8** -- development server and production build
-   **React Router 7** -- client-side routing
-   **Tailwind CSS 4** -- styling
-   **Axios** -- HTTP requests and API integration
-   **Socket.IO Client** -- real-time communication
-   **React Hook Form** and **Zod** -- form handling and validation
-   **Tiptap** -- rich-text document editing
-   **React Icons** -- interface icons

## Getting started

### Prerequisites

-   Node.js and npm
-   Access to the Quorum backend/API

### 1. Clone the repository

``` bash
git clone https://github.com/Tanvi975/quorum-web.git
cd quorum-web
```

### 2. Install dependencies

``` bash
npm install
```

### 3. Configure the API URL

The frontend reads the API base URL from `VITE_API_URL`.

Create a `.env` file in the project root if you need to point the
frontend to a specific backend:

``` env
VITE_API_URL=https://api.newquorum.me
```

If `VITE_API_URL` is not set, the Axios client uses the current origin.
The Vite development configuration also proxies `/api` requests to
`https://api.newquorum.me`.

### 4. Start the development server

``` bash
npm run dev
```

The Vite configuration uses port `3000`.

### 5. Create a production build

``` bash
npm run build
```

To preview the production build locally:

``` bash
npm run preview
```

### 6. Run lint checks

``` bash
npm run lint
```

## Project structure

``` text
src/
├── components/      # Reusable UI and feature components
├── context/         # React context, including authentication
├── hooks/           # Reusable hooks for chat, meetings, presence, etc.
├── pages/           # Application pages and feature screens
├── routes/          # Route guards and routing helpers
├── services/        # API service modules
├── styles/          # Page-specific styles
├── assets/          # Images and SVG assets
├── App.jsx          # Application routes and providers
└── main.jsx         # React application entry point
```

## API and real-time communication

-   API requests are centralized through the Axios instance in
    `src/services/api.js`.
-   The API client sends credentials and includes CSRF token handling.
-   Feature-specific API calls are organized under `src/services/`.
-   Socket.IO client hooks are used for real-time features such as chat,
    presence, projects, documents, whiteboards, and meetings.

The frontend depends on the Quorum backend for data, authentication, and
server-side operations. Configure the correct API endpoint before
running it against another environment.

## Available scripts

  Command             Description
  ------------------- ------------------------------------
  `npm run dev`       Start the local development server
  `npm run build`     Build the production frontend
  `npm run preview`   Preview the production build
  `npm run lint`      Run ESLint checks

## Deployment

The deployed frontend is available at:

**https://newquorum.me/**

For deployment, create a production build using `npm run build` and
deploy the generated `dist/` directory to your hosting provider. Ensure
the production API URL and backend CORS/cookie settings are configured
for the deployed domain.

## Notes

This repository contains the Quorum frontend. Backend services, database
operations, and external integration credentials are managed separately.
The availability of a feature in the UI may depend on backend
configuration, user permissions, and connected third-party services.

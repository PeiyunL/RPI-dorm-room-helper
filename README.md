# RPI Dorm Room Helper

RPI Dorm Room Helper is a full-stack web application that helps RPI students explore residence options and connect with other students during housing selection. The frontend is built with React and Material UI, and the backend uses PocketBase for authentication, data storage, and social features. The project focuses on making dorm research faster, clearer, and more interactive.

## Features
- Dorm browsing with dedicated pages and housing details
- Post board for student questions, updates, and discussion
- Filtering and search for finding relevant posts quickly
- Likes and comments on posts
- Favorites page to save important posts
- Interactive campus map for dorm and location context
- User authentication with email verification and password reset

## Screenshots

### Home Page
![Home Page](./images/home.png)
Main dashboard for browsing dorm content and recent posts.
<!-- Add screenshot file at ./images/home.png -->

### Post Board
![Post Board](./images/posts.png)
Students can browse, create, and interact with posts.
<!-- Add screenshot file at ./images/posts.png -->

### Favorites
![Favorites](./images/favorites.png)
Saved posts and items that users want to revisit.
<!-- Add screenshot file at ./images/favorites.png -->

## Demo
Demo GIF or link to live site.

## Tech Stack
- React 19 + TypeScript
- Material UI (MUI)
- Vite
- React Router
- PocketBase
- Leaflet (interactive map)
- Python (Flask utility backend scripts)

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- PocketBase executable (included in `backend/`)

### 1. Install frontend dependencies
```bash
cd frontend
npm install
```

### 2. Configure environment
Create `frontend/.env` from `frontend/.env.example` and set:
```bash
VITE_PB_URL=https://rpidorms.cs.rpi.edu:8090
```

### 3. Start PocketBase backend (local)
```bash
cd backend
./pocketbase serve
```
On Windows PowerShell, use:
```powershell
.\pocketbase.exe serve
```

### 4. Start frontend
```bash
cd frontend
npm run dev
```

## Semester Goals

We aim to deploy the website online by the end of the semester. Specifically, we plan to:

- Finish leftover work from the previous semester
- Add and test unfinished features
- Conduct thorough testing and debugging
- Maintain the website after deployment

If time allows:
- Add a student communication platform
- Implement 3D models of dorms, including interiors

## Team Members

| Name | Role | Contact |
|--------------|-------|------------------------|
| **Peiyun Li** | Lead | lip6@rpi.edu |
| **Zihao Wang** | Developer | wangz61@rpi.edu |

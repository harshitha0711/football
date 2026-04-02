# ⚽ Football Pro Arena

A fun browser-based football/soccer game where you score goals and beat your own record. Built with React on the frontend and Node.js + MongoDB on the backend.

## What's This?

Basically, it's a simple arcade-style soccer game. You control a player, pass the ball around defenders, and try to shoot past the goalkeeper to score. Your best score gets saved to the database so you can track your progress.

## Getting Started

### Prerequisites

Make sure you have Node.js installed and MongoDB running locally on port 27017.

### Setup

1. Clone the repo and navigate to the project folder
2. Go to the client directory:
   ```
   cd client
   npm install
   npm start
   ```
3. In another terminal, start the server:
   ```
   cd server
   npm install
   npm start
   ```

The game will open at `http://localhost:3000` and connect to the API running on `http://localhost:5000`.

## How to Play

- **W/A/S/D** - Move your player around
- **SPACE** - Charge up your shot (hold and release to shoot)
- **R** - Quick shot without charging
- Score goals by shooting the ball into the goal area
- Watch out for offside positioning
- Beat your personal best!

## Tech Stack

- **Frontend:** React with Canvas for game rendering
- **Backend:** Express.js
- **Database:** MongoDB
- **Game Logic:** Custom physics and collision detection

## Project Structure

```
football/
├── client/          # React frontend
│   └── src/
│       └── App.js   # Main game component
└── server/          # Node.js backend
    ├── server.js    # Express server
    └── models/
        └── score.js # Score schema
```

That's it! Have fun playing.

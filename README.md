# Pingd

A mobile-first social media app built around short posts called "pings" — fast, lightweight updates you can create and interact with instantly.

## Features

- **Home Feed** — Infinite scroll with like, reply, repost actions
- **Create Ping** — Post text (250 char max) + optional images
- **Quick Ping Mode** — Tap ⚡ to instantly type and post in under 2 seconds
- **Ping Pulse** — Real-time trending system highlighting viral posts
- **Ping Streaks** — Track your daily posting streaks 🔥
- **Profile** — View/edit profile with banner, bio, follower counts
- **Explore** — Trending pings, suggested users, and categories
- **Notifications** — Likes, replies, follows, reposts
- **Messages** — Simple DM chat interface

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** CSS-in-JS with CSS custom properties
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Routing:** React Router DOM

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Design System

- **Theme:** Dark mode default
- **Background:** `#0f0f14`
- **Cards:** `#1a1a25`
- **Accent:** Electric purple (`#6c5ce7`) + Neon blue (`#00b4d8`)
- **Font:** Inter
- **Rounded corners, soft glow effects, smooth animations**

## Project Structure

```
src/
├── components/    # Reusable UI components
├── context/       # React context (AppContext)
├── data/          # Sample data for testing
├── hooks/         # Custom hooks
├── pages/         # Page components
├── styles/        # Global CSS
└── types/         # TypeScript types
```

# SketchInSync Roadmap

> A collaborative whiteboard application inspired by Excalidraw with real-time multi-user editing.

---

# Project Goals

- Build a scalable whiteboard application from scratch.
- Learn the HTML5 Canvas API.
- Understand graphics rendering and event handling.
- Implement real-time collaboration using WebSockets.
- Design a backend capable of persisting boards.
- Showcase frontend, backend, and system design skills.

---

# Milestone 1 — Project Setup

## Objectives

- [x] Create GitHub repository
- [x] Setup React + TypeScript + Vite
- [x] Configure Tailwind CSS
- [x] Create folder structure
- [ ] Configure ESLint & Prettier
- [x] Initial README

---

# Milestone 2 — Canvas Fundamentals

## Objectives

- [ ] Render full-screen canvas
- [ ] Handle canvas resizing
- [ ] Obtain CanvasRenderingContext2D
- [ ] Draw rectangle
- [ ] Draw circle
- [ ] Draw line
- [ ] Draw text
- [ ] Draw image

### Learning Topics

- HTML Canvas API
- Drawing primitives
- Coordinate systems
- Device pixel ratio

---

# Milestone 3 — Canvas Engine

## Objectives

- [ ] Maintain objects in memory
- [ ] Render objects from state
- [ ] Clear + redraw canvas
- [ ] Rendering loop
- [ ] Object IDs
- [ ] Object serialization

### Learning Topics

- Immediate Mode Rendering
- Scene Graph
- Rendering Pipeline

---

# Milestone 4 — Drawing Tools

## Tools

- [ ] Rectangle
- [ ] Circle
- [ ] Line
- [ ] Arrow
- [ ] Pencil
- [ ] Eraser
- [ ] Text
- [ ] Image Upload

---

# Milestone 5 — Object Manipulation

## Objectives

- [ ] Selection
- [ ] Multi-selection
- [ ] Drag objects
- [ ] Resize
- [ ] Rotate (Optional)
- [ ] Delete
- [ ] Duplicate

### Learning Topics

- Bounding boxes
- Hit detection
- Collision detection

---

# Milestone 6 — Camera System

## Objectives

- [ ] Infinite canvas
- [ ] Pan
- [ ] Zoom
- [ ] Reset View
- [ ] Mini-map (Optional)

### Learning Topics

- World Coordinates
- View Coordinates
- Transform Matrix

---

# Milestone 7 — History

## Objectives

- [ ] Undo
- [ ] Redo
- [ ] History stack

### Learning Topics

- Command Pattern
- Immutable state

---

# Milestone 8 — State Management

## Objectives

- [ ] Zustand Store
- [ ] Tool State
- [ ] Canvas State
- [ ] Selection State

---

# Milestone 9 — Backend

## Objectives

- [ ] Setup FastAPI
- [ ] PostgreSQL
- [ ] SQLAlchemy
- [ ] Alembic
- [ ] JWT Authentication

---

# Milestone 10 — Persistence

## Objectives

- [ ] Create Boards
- [ ] Save Board
- [ ] Load Board
- [ ] Autosave

---

# Milestone 11 — Collaboration

## Objectives

- [ ] WebSockets
- [ ] Shared Rooms
- [ ] Live Cursor
- [ ] Live Editing
- [ ] Presence

### Stretch Goals

- [ ] Conflict Resolution
- [ ] Operational Log
- [ ] CRDT Research

---

# Milestone 12 — Polish

## Objectives

- [ ] Dark Mode
- [ ] Keyboard Shortcuts
- [ ] Export PNG
- [ ] Export SVG
- [ ] Export PDF
- [ ] Mobile Support
- [ ] Performance Optimizations

---

# Future Features

- Version History
- Comments
- Sticky Notes
- Templates
- AI Shape Recognition
- Voice Notes
- Public Boards
- Board Sharing
- Read-only Links

---

# Deployment

Frontend

- Cloudflare Pages

Backend

- Render / Fly.io

Database

- PostgreSQL

Storage

- Cloudinary / S3

---

# Current Progress

Project Status:

🟩 Project Setup

Current Milestone:

➡️ Canvas Fundamentals
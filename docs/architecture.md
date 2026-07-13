# SketchInSync Architecture

## High-Level Architecture

```
                     ┌────────────────────────────┐
                     │        React Client        │
                     └──────────────┬─────────────┘
                                    │
                    REST API         │ WebSocket
                                    │
                     ┌──────────────▼─────────────┐
                     │         FastAPI            │
                     └───────┬─────────┬──────────┘
                             │         │
                             │         │
                  PostgreSQL │         │
                             │         │
                  ┌──────────▼───┐     │
                  │  Board Data  │     │
                  └──────────────┘     │
                                       │
                              Broadcast Updates
```

---

# Frontend Architecture

```
App

│

├── Layout

│

├── Toolbar

├── Sidebar

├── Canvas

├── Status Bar

└── Modals
```

---

# Canvas Module

```
canvas/

│

├── Canvas.tsx

├── CanvasEngine.ts

├── Renderer.ts

├── Camera.ts

├── EventManager.ts

├── History.ts

├── Selection.ts

│

├── elements/

│     Rectangle.ts

│     Circle.ts

│     Line.ts

│     Arrow.ts

│     Text.ts

│

└── types.ts
```

---

# Rendering Pipeline

```
Canvas State

↓

Renderer

↓

Clear Canvas

↓

Loop through Elements

↓

Draw Each Element

↓

Display Frame
```

---

# Canvas Object Model

Each drawable element will be stored as an object instead of pixels.

Example:

```ts
{
    id: "abc123",
    type: "rectangle",

    x: 120,
    y: 300,

    width: 250,
    height: 180,

    strokeColor: "#000000",
    fillColor: "#ffffff",

    strokeWidth: 2,

    rotation: 0
}
```

---

# Rendering Philosophy

Canvas is treated as a **pure renderer**.

The canvas never owns data.

Instead:

```
Application State

↓

Canvas Renderer

↓

Pixels
```

Whenever the application state changes:

1. Clear the canvas
2. Draw every object again

This approach makes undo/redo, saving, exporting, and collaboration significantly easier.

---

# Event Flow

```
Mouse Event

↓

Canvas

↓

Canvas Engine

↓

Update State

↓

Renderer

↓

Redraw Canvas
```

---

# Backend Responsibilities

FastAPI will handle:

- Authentication
- User management
- Board management
- Persistence
- WebSocket connections

The backend **does not render** anything.

---

# Database Overview

Main tables:

Users

↓

Boards

↓

Board Elements

↓

Board History (Optional)

---

# Collaboration Flow

```
User A

↓

WebSocket

↓

FastAPI

↓

Broadcast

↓

User B

↓

Canvas Update
```

Initially:

- Last write wins.

Future improvements:

- CRDT
- Operational Transform
- Conflict Resolution

---

# Design Principles

## 1. Separation of Concerns

React handles UI.

Canvas handles rendering.

FastAPI handles data.

PostgreSQL stores state.

---

## 2. Single Source of Truth

Application state is the source of truth.

Canvas is only a visual representation.

---

## 3. Incremental Development

Build in this order:

Canvas

↓

Drawing

↓

Selection

↓

History

↓

Persistence

↓

Realtime

↓

Performance

---

# Technology Stack

Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand

Backend

- FastAPI
- SQLAlchemy
- Alembic

Database

- PostgreSQL

Realtime

- WebSockets

Deployment

- Cloudflare Pages
- Render
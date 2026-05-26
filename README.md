# Real-Time Industrial Digital Twin Dashboard

This repository contains the source code for a simplified real-time **Industrial Digital Twin Observability Platform** designed for factory floor monitoring. It integrates high-velocity IoT machine telemetry, edge CCTV computer vision safety alerts, active and passive downtime tracking, and a real-time operator panel.

---

## 🏗️ System Architecture

```
[IoT Sensor Simulators] ──(QoS 1 Telemetry)──► [Mosquitto MQTT Broker] ◄──(QoS 2 CV Alerts)── [CCTV Simulators]
                                                    │
                                                    ▼
                                       [MQTT Ingestion Daemon]
                                                    │
                                           (AJV/Zod Validation)
                                                    │
                                        [Stream & Alert Processor]
                                         /                      \
                                        /                        \
                  (Immediate Cache updates)              (5s Telemetry Batches)
                                      /                            \
                                     ▼                              ▼
                             [Redis Cache]                [PostgreSQL Database]
                                     │                              │
                     (Heartbeat timeout checks)            (Auditing, Historic Logs)
                                     │                              │
                                     ▼                              ▼
                           [Socket.IO Server] ◄──────────── [Express REST APIs]
                                     │
                             (WS Connection)
                                     │
                                     ▼
                      [Vite + React Operator Client]
```

---

## 🛠️ Technology Stack & Justification

*   **Frontend (Vite + React + TailwindCSS + Recharts):** Highly responsive UI rendering. Recharts uses lightweight vector SVGs to render telemetry trends, and glassmorphic designs keep cognitive load low for plant operator shifts.
*   **Backend (Node.js + Express + TypeScript):** Standard TypeScript compiler for safety. The single-threaded, non-blocking asynchronous event loop of Node.js is optimal for handling concurrent streams of MQTT packets.
*   **Caching (Redis):** Caches the latest states of all machines. Telemetry heartbeats are synced *immediately and synchronously* to Redis, preventing database I/O overhead from blocking operations.
*   **Database (PostgreSQL + Prisma ORM):** Postgres acts as the relational repository. Prisma maps type-safe database queries. Telemetry history writes are buffered and written in bulk every 5 seconds to prevent database write amplification.
*   **Messaging (Mosquitto MQTT Broker):** Extremely lightweight message queuing.
    *   **QoS 1 (At-least-once):** For 1Hz machine telemetry to prevent telemetry gaps, with duplicates resolved in the application layer.
    *   **QoS 2 (Exactly-once):** For CV safety breaches to guarantee safety events are processed exactly once.

---

## 🚀 Quick Start Guide (Docker Compose)

The entire ecosystem is containerized for simple one-command launching.

### 1. Prerequisites
Ensure you have [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed.

### 2. Startup Containers
Spin up Mosquitto, Redis, PostgreSQL, the API server, and React UI in the background:
```bash
docker-compose up -d --build
```

---

## ⚙️ Manual Developer Installation (Local Setup)

If you prefer to run services outside of Docker for development/debugging, follow these steps:

### 1. Database Migrations
Create a local PostgreSQL database, specify the connection string in your `.env` file, and execute migrations:
```bash
cd backend
# Install backend packages
npm install

# Run migrations and generate Prisma Client
npx prisma migrate dev --schema=../database/schema.prisma
```

### 2. Start Backend API
```bash
npm run dev
```
The server will boot on `http://localhost:5000`.

### 3. Start React Client
```bash
cd ../frontend
npm install
npm run dev
```
The UI will launch on `http://localhost:3000`.

---

## 📡 Simulators Guide

To seed the digital twin with data, launch the edge simulators:

### 1. IoT Sensor Telemetry Simulator (1Hz)
Simulates six machines across three production lines, introducing temperature/vibration spikes and scheduling silent windows to trigger connectivity timeout alerts.
```bash
cd simulators
npm install
npm run sensors
```

### 2. CCTV Computer Vision Simulator (15s)
Emits safety breaches (restricted zone entries, missing PPE, conveyer blockages) with confidence scores and mock picture captures.
```bash
cd simulators
npm run camera
```

---

## 🧪 Running Automated Tests

The testing suite contains unit tests for alarm thresholds with alert storm deduplication, and integration tests for MQTT-to-Redis ingestion and passive heartbeat timeouts.
```bash
cd backend
npm run test
```

---

## 📖 API Documentation

### REST API Endpoints

| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET /api/machines` | `GET` | All | Fetch current machine status and latest cached telemetry metrics. |
| `GET /api/machines/:id/telemetry` | `GET` | All | Fetch paginated historical readings (temperature, vibration, power). Query parameters: `?limit=` (default 50, cap 500), `?offset=` (default 0). |
| `GET /api/alerts` | `GET` | All | Fetch paginated warnings. Query parameters: `?limit=`, `?offset=`, `?status=` (ACTIVE, ACKNOWLEDGED, RESOLVED). |
| `POST /api/alerts/:id/acknowledge` | `POST` | Operator | Acknowledge active warning. Payload: `{ "operatorId": "OP_ID" }`. |
| `POST /api/alerts/:id/resolve` | `POST` | Operator | Resolve acknowledged warning. Payload: `{ "operatorId": "OP_ID" }`. |
| `POST /api/machines/:id/downtime` | `POST` | Operator | Submit OEE audit downtime classification. Payload: `{ "eventId": "EVENT_UUID", "reason": "Reason" }`. |
| `GET /api/reports/downtime/export` | `GET` | Supervisor| Download full OEE audit logs as a structured `.csv` file attachment. |
| `POST /api/simulate/camera` | `POST` | Developer | Emits camera event for simulation testing. |

### WebSocket Gateway (Socket.IO on `ws://localhost:5000`)

*   **Inbound Client Events:**
    *   `join:line` (payload: `{ "lineId": "line_1" }`): Joins a floor-line update room.
    *   `leave:line` (payload: `{ "lineId": "line_1" }`): Leaves the floor-line room.
*   **Outbound Server Broadcasts:**
    *   `telemetry:init` (payload: `MachineState[]`): Pre-populates operator screen states on handshake.
    *   `telemetry:update` (payload: `MachineState`): 1Hz update broadcasted to specific floor-line rooms.
    *   `alert:new` (payload: `Alert`): Broadcasted globally to `'alerts'` room.
    *   `alert:update` (payload: `Alert`): Emitted on state shifts.

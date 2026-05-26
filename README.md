# 🏭 Real-Time Industrial Digital Twin Observability Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![MQTT](https://img.shields.io/badge/MQTT-3B82F6?style=flat-square&logo=eclipsemosquitto&logoColor=white)](https://mqtt.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square)](#-running-automated-tests)

A high-performance virtual representation (**Digital Twin**) of a factory floor blending high-velocity Industrial IoT telemetry (1Hz), edge CCTV computer vision safety alerts, active & passive downtime tracking, and a real-time operator workspace.

Designed for night-shift plant supervisors and operators to correlate telemetry metrics with visual hazard verification under low cognitive load.

---

## 📸 System Interfaces

### 1. Plant Operator SCADA Workspace
The interface utilizes a monospace contrast layout optimized for dark factory environments. Status transitions trigger subtle animations, and down machinery emits a pulsed red shadow to capture operator attention immediately.
![Industrial Twin Dashboard](media/dashboard_screenshot.png)

### 2. CCTV Computer Vision Hazard Stream
Live safety breaches (such as restricted zone entry or missing PPE) are pushed to the active sidebar. Operators can view preview snapshots directly to verify alarms before initiating shutdowns.
![CCTV Zone Breach](media/cctv_zone_breach.png)

---

## 🏗️ System Architecture

```
[IoT Sensor Simulators] ──(QoS 1 Telemetry)──► [Mosquitto MQTT Broker] ◄──(QoS 2 CV Alerts)── [CCTV Simulators]
                                                     │
                                                     ▼
                                        [MQTT Ingestion Daemon]
                                                     │
                                            (Ajv/Zod Validation)
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
                        [Vite + React Operator UI]
```

### 🧠 Core Engineering Design Choices

1. **Lightweight Edge Telemetry Ingestion (QoS 1)**
   Factory machine sensors publish telemetry at 1Hz. The system uses **QoS 1 (At-least-once)** to avoid packet drops over unreliable factory Wi-Fi networks. Any potential duplicate packets are handled cleanly at the ingestion layer using state/timestamp comparisons.
2. **Transactional Computer Vision Alerts (QoS 2)**
   CCTV cameras analyze the floor for safety events (e.g., forklift near-misses, unauthorized zone entries) and publish them to MQTT with **QoS 2 (Exactly-once)**. Because missing or duplicating a safety alarm is critical, QoS 2's four-step handshake guarantees that safety alerts are processed exactly once.
3. **High-Performance Caching & Deduping (Redis)**
   To handle rapid 1Hz streams from multiple machines, telemetry is cached immediately in Redis to keep the active status metrics fresh. The system uses a **cache-aside** design for alert deduplication, verifying active alerts in Redis first to prevent database connection pool exhaustion and read/write starvation.
4. **PostgreSQL Write-Amplification Mitigation (Buffering)**
   Writing high-frequency telemetry directly to PostgreSQL causes write-amplification and disk bottlenecks. Instead, telemetry records are buffered in-memory and flushed to PostgreSQL in bulk transaction inserts every **5 seconds**, reducing disk I/O load.
5. **Passive Heartbeat Daemon (Timeout Detection)**
   An active machine might lose power or connectivity without sending a final status packet. To catch this, a background daemon polls Redis states every 10 seconds. If a machine's last heartbeat is older than **60 seconds**, it automatically triggers a `SYSTEM_TIMEOUT` downtime event, updates its status to `DOWN`, and broadcasts a critical connectivity alarm.

---

## 📂 Repository Directory Layout

This monorepo is structured cleanly with separate concerns to mimic a production environment:

```
cctv-zone-breach-detection/
├── docker-compose.yml       # Production docker orchestration setup
├── README.md                # System documentation
├── PRD.md                   # Product Requirements Document (What & Why)
├── implementation_plan.md   # Architectural & Implementation specs (How)
├── walkthrough.md           # Walkthrough & Verification details
├── .gitignore               # Multi-environment dependency exclusions
├── .github/                 # GitHub workflows & templates
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
├── media/                   # Screen captures & mockup assets
├── database/                # Global Prisma schemas & setup
│   └── schema.prisma
├── backend/                 # Node.js Express API & MQTT Daemon
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── app.ts           # Service bootstrap & routing configurations
│   │   ├── config.ts        # Environment configurations
│   │   ├── controllers/     # Express REST endpoint controllers
│   │   ├── gateways/        # Socket.io connection gates
│   │   ├── services/
│   │   │   ├── ingestion.ts # MQTT listener client
│   │   │   ├── processor.ts # Stream metric & Alert logic
│   │   │   └── timeout.ts   # Active timeout monitor daemon
│   │   └── utils/           # DB, Redis, and logger clients
│   └── public/              # Mock visual CCTV event assets
├── frontend/                # React Vite Operator UI Client
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css        # Global CSS stylesheet (Tailwind directives)
│       ├── components/      # UI Grid, cards, sidebar, chart modals
│       ├── context/         # Socket state providers
│       └── hooks/
└── simulators/              # Production floor simulators
    ├── package.json
    ├── sensor_simulator.js  # Emitter for 1Hz machine telemetry
    └── camera_simulator.js  # Emitter for CCTV safety breach events
```

---

## 🚀 Docker Setup (Quick Start)

Deploy the entire infrastructure (Mosquitto, Redis, PostgreSQL, the API server, and React UI) in the background with a single command:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nikhilc1910/cctv-zone-breach-detection.git
   cd cctv-zone-breach-detection
   ```
2. **Configure Environment Variables:**
   Copy `.env.example` to `.env` and configure appropriate values before running:
   ```bash
   cp .env.example .env
   ```
3. **Build and start the containers:**
   ```bash
   docker compose up -d --build
   ```
3. **Run database migrations:**
   Apply migrations to synchronize the database schema within the backend container:
   ```bash
   docker compose exec backend npx prisma migrate dev --name init
   ```
4. **Access the services:**
   * **Operator Dashboard:** `http://localhost:3000`
   * **Backend REST API:** `http://localhost:5000`
   * **Mosquitto Broker:** `localhost:1883` (MQTT), `localhost:9001` (WebSockets)
   * **Redis Cache:** `localhost:6379`
   * **Postgres Database:** `localhost:5432`

---

## ⚙️ Manual Developer Installation (Local Setup)

If you prefer to run services outside of Docker for debugging, follow these steps:

### 1. Database Migrations
Set up a PostgreSQL instance, copy `.env.example` to `.env` in the backend directory, update your database connection parameters, and run:
```bash
cd backend
npm install
npx prisma migrate dev
```

### 2. Start Backend API
```bash
npm run dev
```
The server will run on `http://localhost:5000`.

### 3. Start React Client
```bash
cd ../frontend
npm install
npm run dev
```
The UI will launch on `http://localhost:3000`.

---

## 📡 Edge Simulators

To stream live data into the digital twin, launch the edge simulator scripts:

1. **Install dependencies:**
   ```bash
   cd simulators
   npm install
   ```
2. **Start IoT Machine Telemetry (1Hz):**
   ```bash
   npm run sensors
   ```
3. **Start CCTV Computer Vision Safety Events (15s):**
   ```bash
   npm run camera
   ```

---

## 🧪 Running Automated Tests

The backend includes a comprehensive Jest test suite checking threshold evaluations, alert storm deduplications, database ingestion, and heartbeat timeouts:
```bash
cd backend
npm run test
```

---

## 📖 API Documentation

### REST API Endpoints

| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET /api` | `GET` | All | Root diagnostic health and uptime status check. |
| `GET /api/machines` | `GET` | All | Fetch all registered machines with status and cached metrics. |
| `GET /api/machines/:id/telemetry` | `GET` | All | Fetch historical telemetry readings for trend charts. Query parameters: `?limit=` (default 50, cap 500), `?offset=` (default 0). |
| `GET /api/alerts` | `GET` | All | Fetch paginated alarms. Query parameters: `?limit=`, `?offset=`, `?status=` (ACTIVE, ACKNOWLEDGED, RESOLVED). |
| `POST /api/alerts/:id/acknowledge` | `POST` | Operator | Acknowledge an active alert. Payload: `{ "operatorId": "OP_UUID" }`. |
| `POST /api/alerts/:id/resolve` | `POST` | Operator | Resolve an alert. Payload: `{ "operatorId": "OP_UUID" }`. |
| `POST /api/machines/:id/downtime` | `POST` | Operator | Submit Root-Cause OEE classifications. Payload: `{ "eventId": "EVENT_UUID", "reason": "Reason details" }`. |
| `GET /api/machines/:id/downtime` | `GET` | All | Retrieve historical downtime logs for a specific machine. |
| `GET /api/reports/downtime/export` | `GET` | Supervisor| Download OEE audit logs as a structured `.csv` file. |
| `POST /api/simulate/camera` | `POST` | Developer | Emits camera event for simulation testing. |

### WebSocket Gateway (Socket.IO on `ws://localhost:5000`)

* **Inbound Client Events:**
  * `join:line` (payload: `{ "lineId": "line_1" }`): Joins a floor-line update room.
  * `leave:line` (payload: `{ "lineId": "line_1" }`): Leaves the floor-line room.
* **Outbound Server Broadcasts:**
  * `telemetry:init` (payload: `MachineState[]`): Pre-populates operator screen states on handshake.
  * `telemetry:update` (payload: `MachineState`): 1Hz update broadcasted to specific floor-line rooms.
  * `alert:new` (payload: `Alert`): Broadcasted globally to `'alerts'` room.
  * `alert:update` (payload: `Alert`): Emitted on state shifts (acknowledge/resolve).

---

## 🗺️ Roadmap & Future Scope

* [ ] **Predictive Machine Failures (ML)**: Integrate LSTM autoencoders to calculate an "Anomaly Score" based on temperature + vibration trends, raising warnings *before* a failure occurs.
* [ ] **Intelligent Alarm Prioritization**: Dynamically score alert criticalities by correlating safety violations and machine downtime histories.
* [ ] **RTSP Live Camera Feeds**: Transition from static preview snapshots to live HLS/RTSP CCTV streams on the sidebar panel.

---

## 🤝 Contribution Guidelines

Contributions are welcome! Please follow these steps:
1. Fork the project.
2. Create a branch (`git checkout -b feature/NewFeature`).
3. Commit your changes (`git commit -m 'Add NewFeature'`).
4. Push to the branch (`git push origin feature/NewFeature`).
5. Open a Pull Request for review.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

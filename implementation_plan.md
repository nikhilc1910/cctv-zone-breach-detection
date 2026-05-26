# Technical Implementation Plan
## Real-Time Industrial Digital Twin Dashboard
**Document Version:** 1.2.0  
**Target Role:** AI/ML & IoT Engineering Intern (Industry 4.0 Application)  
**Author:** AIML Engineering Student  
**Workspace:** `d:/projects/Autonex Ai`

---

## 6. System Architecture

The following block diagram illustrates the end-to-end architecture, emphasizing the separation of Ingestion, Processing, Cache, Storage, and Communication layers.

```mermaid
graph TD
    %% Ingestors
    subgraph IoT_Edge_Simulators["Edge Simulators"]
        Sensors["IoT Sensors (Status, Temp, Vib, Power)"]
        Cameras["CCTV Camera Simulator (CV Events)"]
    end

    %% Message Broker
    subgraph Broker_Layer["Broker Layer"]
        Mosquitto["Mosquitto MQTT Broker"]
    end

    %% Backend System
    subgraph Backend_App["Node.js / TS Modular Backend"]
        Ingestion["MQTT Ingestion Daemon"]
        Processor["Stream & Alert Processor"]
        DowntimeWatcher["Downtime Timeout Engine (Cron/TTL)"]
        ExpressAPI["Express API Server"]
        SocketServer["Socket.IO Server"]
    end

    %% Storage & Caching
    subgraph Storage_Layer["Storage & Cache Layer"]
        Redis["Redis Cache (Latest States, Lock Management)"]
        Postgres["PostgreSQL Database (Prisma ORM)"]
    end

    %% Frontend App
    subgraph Frontend_App["Frontend Layer"]
        ReactUI["React Vite Dashboard (Tailwind CSS, Recharts)"]
    end

    %% Connections
    Sensors -->|factory/+/+/telemetry| Mosquitto
    Cameras -->|factory/camera/+/event| Mosquitto
    
    Mosquitto -->|Subscribes to wildcards| Ingestion
    Ingestion -->|Unserialized raw events| Processor
    
    Processor -->|Read/Write State| Redis
    Processor -->|Write telemetry history & alerts| Postgres
    DowntimeWatcher -->|Poll heartbeat ages| Redis
    DowntimeWatcher -->|Write timeout downtime events| Postgres
    
    ExpressAPI -->|Read historical telemetry / OEE| Postgres
    ExpressAPI -->|Write Manual Alert Acknowledge| Postgres
    
    Processor -->|Push Live Updates| SocketServer
    DowntimeWatcher -->|Push Timeout Alerts| SocketServer
    
    SocketServer -->|WebSockets (ws://)| ReactUI
    ExpressAPI -->|REST (http://)| ReactUI

    classDef edge fill:#f9f,stroke:#333,stroke-width:2px;
    classDef broker fill:#bbf,stroke:#333,stroke-width:2px;
    classDef app fill:#ddf,stroke:#333,stroke-width:2px;
    classDef storage fill:#dfd,stroke:#333,stroke-width:2px;
    classDef ui fill:#ffd,stroke:#333,stroke-width:2px;
    
    class Sensors,Cameras edge;
    class Mosquitto broker;
    class Ingestion,Processor,DowntimeWatcher,ExpressAPI,SocketServer app;
    class Redis,Postgres storage;
    class ReactUI ui;
```

---

## 7. Backend Architecture

The backend is developed in **TypeScript** using **Node.js** and **Express**. It is designed as a **Modular Monolith** organized into distinct domain packages to allow microservice separation in the future:

1.  **Ingestion Service (`/services/ingestion`)**: An MQTT.js client that maintains a single, persistent TCP connection to the Mosquitto broker, subscribing to wildcards. It performs input payload parsing and validates it using a strict JSON schema validator (e.g. Zod or Ajv). This checks for the presence of required fields (`machine_id`, `timestamp`, `status`) and verifies data types at the boundary, logging and dropping any malformed payloads to protect downstream services from runtime crashes. Validated payloads are delegated to the Event Queue.
2.  **Processing Service (`/services/processor`)**: Evaluates incoming telemetry.
    *   Saves telemetry into PostgreSQL.
    *   Updates the Machine's overall state cache in Redis.
    *   Dispatches payloads to the **Alert Engine** and **Downtime Engine**.
3.  **WebSocket Gateway (`/gateways/websocket`)**: Powered by Socket.IO. Handles operator client socket lifecycles, authentication (JWT), and topic subscription rooms (e.g., joining room `line:line1` or `alerts`).
4.  **REST Controller Layer (`/controllers`)**: Manages non-stream operations, such as manual alert lifecycle transitions and historical telemetry fetches.
5.  **ORM / Repository Layer (`/repositories`)**: Encapsulates Prisma queries to insulate domain models from schema details.

---

## 8. Frontend Architecture

The frontend is built using **React** structured around a Single Page Application pattern bootstrapped with **Vite**.

*   **State Management (Context API)**: Keeps state lightweight. A `LiveDashboardProvider` establishes a Socket.IO connection, registers event listeners, and updates local state slices.
*   **Visual Grid Rendering**: Custom SVG maps or absolute grid layouts represent the physical plant floor. Machine status is encoded visually using clear styling (e.g., Green = Running, Orange = Idle, Red = Down, Blue = Maintenance).
*   **TailwindCSS Component System**: Follows modern UI patterns like dark-mode glassmorphic cards to maintain visual quality and structure.
*   **Recharts Integration**: Implements lightweight time-series charts to display historical trends without blocking UI rendering.

---

## 9. MQTT Topic Design

To ensure optimal message filtering and routing, the system follows a strict topic hierarchy:

### 9.1 Sensor Telemetry Topic
*   **Structure:** `factory/line/<line_id>/machine/<machine_id>/telemetry`
*   **Example:** `factory/line/line_1/machine/machine_01/telemetry`
*   **Payload Schema (JSON):**
```json
{
  "machine_id": "MACHINE_01",
  "timestamp": "2026-05-26T10:30:00.000Z",
  "status": "RUNNING",
  "metrics": {
    "temperature": 72.5,
    "vibration": 3.2,
    "power_consumption": 14.8
  }
}
```

### 9.2 Camera Safety Event Topic
*   **Structure:** `factory/camera/<camera_id>/event`
*   **Example:** `factory/camera/cam_01/event`
*   **Payload Schema (JSON):**
```json
{
  "camera_id": "CAM_01",
  "zone": "Line 1 - Loading Area",
  "timestamp": "2026-05-26T10:31:00.000Z",
  "event_type": "restricted_zone_entry",
  "confidence": 0.91,
  "image_url": "http://localhost:5000/public/events/cam_01_restricted_entry.jpg"
}
```

### 9.3 Quality of Service (QoS) Level Design
To guarantee message reliability across noisy or intermittent plant-floor networks:
*   **Sensor Telemetry Topics:** Configured with **QoS 1 (At-least-once delivery)**. Telemetry is sent at 1Hz. While QoS 1 can produce duplicates during broker handshakes, these are deduplicated at the ingestion database layer via timestamp checks. This avoids the high bandwidth overhead of QoS 2 while preventing telemetry gaps.
*   **Camera Safety & CCTV Topics:** Configured with **QoS 2 (Exactly-once delivery)**. Safety-critical CV events (such as restricted zone entry or PPE violations) are transactional. Missing a safety alert or receiving duplicated alarms is unacceptable, so QoS 2's four-step handshake ensures safety messages are delivered exactly once.

---

## 10. Real-Time Processing Flow

```
[IoT Sensor] 
    │ (Publishes JSON telemetry payload at 1Hz)
    ▼
[Mosquitto Broker] 
    │ (Routes matching wildcard topics to backend subscriber)
    ▼
[MQTT Ingestion Daemon]
    │ 
    ├── 1. Parse JSON & Validate Fields
    ▼
[Stream & Alert Processor]
    │
    ├── 2. Update Redis: SET "machine:MACHINE_01:state"
    │      (Caches latest status, metrics, and last_heartbeat timestamp)
    │
    ├── 3. Write Time-Series Telemetry to PostgreSQL (via Prisma ORM)
    │
    ├── 4. Evaluate Threshold Rules (Alert Engine)
    │      └── If violation and no active alert:
    │             ├── Save Alert in PostgreSQL (status = ACTIVE)
    │             └── Broadcast "alert:new" via Socket.IO
    │
    └── 5. Dispatch Live Telemetry via Socket.IO room "line:line_1"
           └── [React Dashboard UI updates machine card state]
```

---

## 11. Alert Engine Design

The Alert Engine checks incoming parameters against configurable threshold values:

| Metric | Rule Threshold | Severity | Alert Type | Message Template |
| :--- | :--- | :--- | :--- | :--- |
| **Temperature** | $> 80.0\text{ }^\circ\text{C}$ | HIGH | `HIGH_TEMPERATURE` | "Machine temperature exceeds critical limit of 80°C (Current: {val}°C)" |
| **Vibration** | $> 5.0\text{ mm/s}$ | CRITICAL | `HIGH_VIBRATION` | "Vibration signature indicates imminent structural fatigue (Current: {val} mm/s)" |
| **Status** | `= DOWN` | HIGH | `DOWNTIME` | "Machine has reported downtime state." |
| **Heartbeat Delay** | $> 60\text{ seconds}$ | CRITICAL | `CONNECTIVITY` | "Lost communication channel. Heartbeat missing for > 60 seconds." |
| **Camera Event** | `restricted_zone_entry` | CRITICAL | `SAFETY_VIOLATION` | "Restricted zone breached! Operator detected in zone: {zone}." |
| **Camera Event** | `ppe_violation` | HIGH | `SAFETY_VIOLATION` | "Safety violation: Operator detected missing mandatory PPE in zone: {zone}." |
| **Camera Event** | `machine_blockage` | HIGH | `HARDWARE_ALERT` | "Critical blockage detected on machine conveyor system in zone: {zone}." |
| **Camera Event** | `forklift_near_miss` | CRITICAL | `SAFETY_VIOLATION` | "Hazardous event: Near-miss collision warning involving forklift in zone: {zone}." |
| **Camera Event** | `unauthorized_access` | HIGH | `SECURITY_ALERT` | "Security warning: Personnel entered unauthorized sector in zone: {zone}." |

### Alert Lifecycle State Machine
```
   ┌──────────────┐
   │    ACTIVE    │
   └──────┬───────┘
          │
          │ Operator clicks "Acknowledge" (POST /api/alerts/:id/acknowledge)
          ▼
   ┌──────────────┐
   │ ACKNOWLEDGED │
   └──────┬───────┘
          │
          │ Value returns to normal OR operator clears cause (POST /api/alerts/:id/resolve)
          ▼
   ┌──────────────┐
   │   RESOLVED   │
   └──────────────┘
```

### Alert Storm Mitigation Algorithm
To prevent duplicate alerts for continuous sensor failures (e.g., temperature remaining at 82°C for 2 minutes straight), the system implements the following check:

```typescript
async function checkAndTriggerAlert(machineId: string, alertType: string, val: number, rule: Rule) {
  // Query Redis/DB for an active alert of the same type
  const activeAlert = await prisma.alert.findFirst({
    where: {
      machineId,
      alertType,
      status: 'ACTIVE'
    }
  });

  if (activeAlert) {
    // Alert already exists, update trigger frequency / last seen time
    await prisma.alert.update({
      where: { id: activeAlert.id },
      data: { updatedAt: new Date() }
    });
    return;
  }

  // Create new alert and broadcast
  const newAlert = await prisma.alert.create({
    data: {
      machineId,
      alertType,
      severity: rule.severity,
      message: rule.messageTemplate.replace('{val}', val.toString()),
      status: 'ACTIVE'
    }
  });
  
  // Broadcast to 'alerts' room so all supervisors and overview operators receive it immediately
  io.to('alerts').emit('alert:new', newAlert);
}
```

---

## 12. Downtime Detection Logic

Downtime events are processed using two complementary mechanisms:

```mermaid
stateDiagram-v2
    [*] --> UNKNOWN
    
    UNKNOWN --> RUNNING : First Status/Telemetry Received
    
    RUNNING --> DOWN : Status = "DOWN" Received (Sensor Trigger)
    RUNNING --> DOWN : Heartbeat Missing > 60s (Timeout Trigger)
    RUNNING --> IDLE : Status = "IDLE" Received
    
    IDLE --> DOWN : Status = "DOWN" Received (Sensor Trigger)
    IDLE --> DOWN : Heartbeat Missing > 60s (Timeout Trigger)
    IDLE --> RUNNING : Status = "RUNNING" Received
    
    DOWN --> RUNNING : Telemetry status = "RUNNING" OR "IDLE" Received
    DOWN --> MAINTENANCE : Status = "MAINTENANCE" Received
    
    MAINTENANCE --> RUNNING : Maintenance task resolved
```

### 12.1 Active Sensor Downtime Event
*   Triggered when an MQTT message includes `"status": "DOWN"`.
*   The processor writes a new `DowntimeEvent` entry where `startTime` is set to the packet's timestamp and `source` is set to `SENSOR`.
*   If a previous downtime event for this machine is still active (lacks an `endTime`), the system resolves it first using the current timestamp.

#### 12.1.1 Denormalized `duration` Rationale & Data Integrity Hooks
To optimize write-once, read-heavy queries (e.g., calculation of Overall Equipment Effectiveness (OEE) and downtime aggregations across thousands of historical records), the `DowntimeEvent` model includes a denormalized `duration` field (in seconds). Storing this redundantly avoids expensive dynamic calculations in SQL queries.
To prevent inconsistencies:
*   **Application-Layer Transaction Hook:** When completing a downtime event, the system uses a transaction boundary that calculates `duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)` and writes both `endTime` and `duration` atomically in the same database update transaction.
*   **Database Constraints:** A PostgreSQL check constraint or trigger is defined to validate that `duration` equals the difference between `endTime` and `startTime` on write, maintaining schema integrity.

### 12.2 System Timeout (Stale Heartbeat) Downtime Event
*   To detect connectivity issues or power outages, a background interval job runs every 10 seconds.
*   The worker queries the cached states in Redis to identify any machines with a `last_heartbeat` timestamp older than 60 seconds.
*   For each stale machine, it executes the following atomic operations:
    1.  Sets the machine's state to `DOWN` in Redis.
    2.  Creates a `DowntimeEvent` in PostgreSQL with `source: SYSTEM_TIMEOUT` and `reason: "Heartbeat timeout"`.
    3.  Creates a `CONNECTIVITY` alert of `CRITICAL` severity.
    4.  Emits `machine:downtime` and `alert:new` messages via Socket.IO.

---

## 13. Camera/CCTV Event Handling

CCTV streams are analyzed at the edge by separate computer vision pipelines, which publish event notifications to MQTT topics. 

The backend processes these events to:
1.  **Generate a Safety Alert**: Automatically creates an `Alert` record in PostgreSQL with severity set to `HIGH` or `CRITICAL`.
2.  **Expose Event Snapshots**: Exposes the `image_url` on the operator's dashboard to provide context for verification.
3.  **Broadcast Real-Time Events**: Emits a `camera:event` packet to update the dashboard, highlighting the target zone in red and displaying the associated camera feed.

---

## 14. Database Schema Design

The system database is **PostgreSQL**, schema migrations are managed via **Prisma ORM**.

### 14.1 Entity Relationship Diagram

```
  ┌───────────────┐          ┌────────────────────┐
  │    Machine    │ 1      * │  TelemetryReading  │
  ├───────────────┤──────────┼────────────────────┤
  │ id (PK)       │          │ id (PK)            │
  │ name          │          │ machineId (FK)     │
  │ lineId        │          │ timestamp          │
  │ status        │          │ temperature        │
  │ ...           │          │ vibration          │
  └───────────────┘          │ powerConsumption   │
       │ 1                   └────────────────────┘
       │
       ├───────────────────┐
       │ 1                 │ 1
       ▼ *                 ▼ *
  ┌───────────────┐   ┌───────────────┐          ┌───────────────┐
  │ DowntimeEvent │   │     Alert     │ *      1 │     User      │
  ├───────────────┤   ├───────────────┤──────────┼───────────────┤
  │ id (PK)       │   │ id (PK)       │          │ id (PK)       │
  │ machineId (FK)│   │ machineId (FK)│          │ username      │
  │ startTime     │   │ cameraId      │          │ role          │
  │ endTime       │   │ cameraEventId(FK)        └───────────────┘
  │ duration      │   │ alertType     │
  │ source        │   │ severity      │
  └───────────────┘   │ status        │
                      │ operatorId(FK)│
                      └───────┬───────┘
                              │ 1
                              │ (optional)
                              ▼ 1
                      ┌───────────────┐
                      │  CameraEvent  │
                      ├───────────────┤
                      │ id (PK)       │
                      │ cameraId      │
                      │ zone          │
                      │ eventType     │
                      │ ...           │
                      └───────────────┘
```

### 14.2 Schema Definition (`schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum MachineStatus {
  RUNNING
  IDLE
  DOWN
  MAINTENANCE
  UNKNOWN
}

enum AlertSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum AlertStatus {
  ACTIVE
  ACKNOWLEDGED
  RESOLVED
}

enum DetectionSource {
  SENSOR
  MANUAL
  SYSTEM_TIMEOUT
}

enum UserRole {
  OPERATOR
  SUPERVISOR
}

model User {
  id           String    @id @default(uuid())
  username     String    @unique
  passwordHash String
  role         UserRole  @default(OPERATOR)
  alerts       Alert[]   // Alerts acknowledged/resolved by this user
  createdAt    DateTime  @default(now())
}

model Machine {
  id               String            @id
  name             String
  lineId           String
  status           MachineStatus     @default(UNKNOWN)
  lastUpdated      DateTime          @default(now())
  
  // Cache of latest metrics to avoid querying telemetry history for basic state reads
  lastTemperature  Float?
  lastVibration    Float?
  lastPower        Float?
  
  telemetryReadings TelemetryReading[]
  downtimeEvents    DowntimeEvent[]
  alerts            Alert[]
  
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
}

model TelemetryReading {
  id               String   @id @default(uuid())
  machineId        String
  machine          Machine  @relation(fields: [machineId], references: [id], onDelete: Cascade)
  timestamp        DateTime @default(now())
  temperature      Float
  vibration        Float
  powerConsumption Float

  @@index([machineId, timestamp])
}

model DowntimeEvent {
  id               String          @id @default(uuid())
  machineId        String
  machine          Machine         @relation(fields: [machineId], references: [id], onDelete: Cascade)
  startTime        DateTime
  endTime          DateTime?
  duration         Int?            // Duration stored in seconds
  reason           String?
  source           DetectionSource @default(SENSOR)
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  @@index([machineId, startTime])
}

model Alert {
  id             String        @id @default(uuid())
  machineId      String?
  machine        Machine?      @relation(fields: [machineId], references: [id], onDelete: SetNull)
  cameraId       String?
  cameraEventId  String?       @unique
  cameraEvent    CameraEvent?  @relation(fields: [cameraEventId], references: [id], onDelete: Cascade)
  alertType      String        // HIGH_TEMPERATURE, HIGH_VIBRATION, DOWNTIME, CONNECTIVITY, SAFETY_VIOLATION
  severity       AlertSeverity
  status         AlertStatus   @default(ACTIVE)
  message        String
  timestamp      DateTime      @default(now())
  resolvedAt     DateTime?
  acknowledgedAt DateTime?
  operatorId     String?       // Operator who acknowledged/resolved
  operator       User?         @relation(fields: [operatorId], references: [id])
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([machineId, status])
  @@index([cameraId, status])
  @@index([cameraEventId])
}

model CameraEvent {
  id         String   @id @default(uuid())
  cameraId   String
  zone       String
  timestamp  DateTime @default(now())
  eventType  String   // restricted_zone_entry, ppe_violation, machine_blockage, etc.
  confidence Float
  imageUrl   String
  alert      Alert?
  createdAt  DateTime @default(now())
}
```

---

## 15. API Design

The API includes REST endpoints for operational configuration, manual state shifts, and historical reporting.

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | `POST` | All | Authenticate user and issue JWT. |
| `/api/machines` | `GET` | All | Fetch all machines with status and cached metrics. |
| `/api/machines/:id/telemetry` | `GET` | All | Fetch paginated historical trends (temperature, vibration, power). Supports pagination: `?limit=` and `?offset=`. |
| `/api/alerts` | `GET` | All | Fetch active and historical alerts (filterable by line, severity, status). Supports pagination: `?limit=` and `?offset=`. |
| `/api/alerts/:id/acknowledge` | `POST` | Operator | Mark alert status as `ACKNOWLEDGED`. |
| `/api/alerts/:id/resolve` | `POST` | Operator | Mark alert status as `RESOLVED` and store operator notes. |
| `/api/machines/:id/downtime` | `POST` | Operator | Manually edit downtime events or submit reasons. |
| `/api/reports/downtime/export` | `GET` | Supervisor| Download structured CSV reports for OEE analysis. |
| `/api/simulate/camera` | `POST` | All (Dev) | Endpoint for the camera simulator to post safety events. |

### 15.2 Pagination Design
To prevent memory starvation and network saturation when retrieving high-volume records (since 1Hz sensor telemetry accumulates 86,400 rows per machine daily), API query endpoints implement limit-offset pagination:
*   **`limit` (integer):** The number of records to return. Defaults to `50`, capped at a maximum of `500`.
*   **`offset` (integer):** The starting row offset. Defaults to `0`.
*   **Response Headers:** Paginated responses return metadata in headers:
    *   `X-Total-Count`: Total database rows matching filters.
    *   `X-Limit`: Active batch size limit.
    *   `X-Offset`: Active offset cursor.

### 15.1 API Request & Response Payload Examples

#### GET `/api/machines`
**Response (200 OK):**
```json
[
  {
    "id": "MACHINE_01",
    "name": "Robotic Welding Station A",
    "lineId": "line_1",
    "status": "RUNNING",
    "lastTemperature": 74.2,
    "lastVibration": 3.1,
    "lastPower": 15.4,
    "lastUpdated": "2026-05-26T10:35:00.000Z"
  },
  {
    "id": "MACHINE_02",
    "name": "Stamping Press B",
    "lineId": "line_1",
    "status": "DOWN",
    "lastTemperature": 85.6,
    "lastVibration": 5.8,
    "lastPower": 0.2,
    "lastUpdated": "2026-05-26T10:34:55.000Z"
  }
]
```

#### POST `/api/alerts/d3b07384d113/acknowledge`
**Request Payload:**
```json
{
  "operatorId": "operator-uuid-101"
}
```
**Response (200 OK):**
```json
{
  "id": "d3b07384d113",
  "machineId": "MACHINE_02",
  "alertType": "HIGH_VIBRATION",
  "severity": "CRITICAL",
  "status": "ACKNOWLEDGED",
  "message": "Vibration signature indicates imminent structural fatigue (Current: 5.8 mm/s)",
  "timestamp": "2026-05-26T10:34:55.000Z",
  "acknowledgedAt": "2026-05-26T10:36:12.000Z",
  "operatorId": "operator-uuid-101"
}
```

---

## 16. WebSocket Event Design

The WebSocket service implements a publish-subscribe topology using Socket.IO.

### 16.1 Inbound Events (Client $\rightarrow$ Server)
*   **`join:line`**: Restricts incoming telemetry broadcasts to a specific line.
```json
{ "lineId": "line_1" }
```
*   **`leave:line`**: Leaves the room to stop monitoring the selected line.
```json
{ "lineId": "line_1" }
```

### 16.2 Outbound Events (Server $\rightarrow$ Client)
*   **`telemetry:update`**: Published on value change (at $1\text{Hz}$ rate).
```json
{
  "machineId": "MACHINE_01",
  "status": "RUNNING",
  "timestamp": "2026-05-26T10:36:20.000Z",
  "metrics": {
    "temperature": 73.1,
    "vibration": 3.0,
    "power_consumption": 14.9
  }
}
```
*   **`alert:new`**: Broadcast to the `'alerts'` room, enabling real-time overview updates for operators and supervisors.
```json
{
  "id": "alert-uuid-404",
  "machineId": "MACHINE_02",
  "alertType": "CONNECTIVITY",
  "severity": "CRITICAL",
  "status": "ACTIVE",
  "message": "Lost communication channel. Heartbeat missing for > 60 seconds.",
  "timestamp": "2026-05-26T10:37:00.000Z"
}
```
*   **`camera:event`**: Dynamic camera event stream.
```json
{
  "eventId": "cam-event-88",
  "cameraId": "CAM_01",
  "zone": "Line 1 - Loading Area",
  "eventType": "restricted_zone_entry",
  "confidence": 0.94,
  "imageUrl": "http://localhost:5000/public/events/cam_01_breach.jpg",
  "timestamp": "2026-05-26T10:37:15.000Z"
}
```

---

## 17. Dashboard UI/UX Requirements

The user interface is designed for low cognitive load on operators working high-stress shifts.

*   **Design Tokens:** Dark Mode styling (Slate/Charcoal background, translucent glassmorphic components).
*   **Plant-Level Summary Ribbon:** Displays high-priority plant metrics:
    $$\text{Total Machines} \quad \Big| \quad \text{Running} \quad \Big| \quad \text{Down (Red)} \quad \Big| \quad \text{Idle} \quad \Big| \quad \text{Active Alerts (Flashing Red)}$$
*   **Virtual Layout Map:** A physical layout view of the production lines. Card components change color dynamically to reflect active states.
*   **Telemetry Trends Pane:** Hovering over or clicking a machine card opens a modal overlay showing historical trends (powered by Recharts).
*   **Interactive Sidebar Alerts Feed:** Displays active, unacknowledged warnings. Includes single-click "Acknowledge" buttons and image preview thumbnails for CCTV feeds.

---

## 18. Folder Structure

The project is structured as a single monorepo to simplify development, testing, and deployment:

```
realtime-digital-twin/
├── docker-compose.yml
├── README.md
├── database/
│   ├── schema.prisma
│   └── migrations/
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── src/
│   │   ├── app.ts            # Entrypoint, registers controllers and websockets
│   │   ├── config.ts         # Environment variables
│   │   ├── controllers/      # REST API route handlers
│   │   ├── gateways/         # Socket.IO connection handling
│   │   ├── services/
│   │   │   ├── ingestion.ts  # MQTT.js subscriber client
│   │   │   ├── processor.ts  # State management and alerts logic
│   │   │   └── timeout.ts    # Background heartbeat checking
│   │   └── utils/
│   └── public/               # Serves simulated CCTV frames
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── Dockerfile
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   ├── index.css         # Styling system configuration
│   │   ├── App.tsx
│   │   ├── components/       # Layout, MachineCard, AlertsPanel, ChartModal
│   │   ├── context/          # LiveDashboardContext socket wrapper
│   │   └── hooks/
└── simulators/
    ├── package.json
    ├── sensor_simulator.js   # Generates realistic MQTT telemetry
    └── camera_simulator.js   # Publishes visual safety alerts and images
```

---

## 19. Docker Deployment Setup

A unified container topology orchestrates database configurations, messaging brokers, telemetry processors, and the web layer.

### 19.1 `docker-compose.yml`

```yaml
version: '3.8'

services:
  # Message Broker
  mosquitto:
    image: eclipse-mosquitto:2.0
    container_name: twin-mqtt-broker
    ports:
      - "1883:1883"
      - "9001:9001"
    volumes:
      - ./docker/mosquitto/config:/mosquitto/config
      - ./docker/mosquitto/data:/mosquitto/data
      - ./docker/mosquitto/log:/mosquitto/log
    networks:
      - digital-twin-net

  # High-performance In-Memory Cache
  redis:
    image: redis:7.0-alpine
    container_name: twin-redis-cache
    ports:
      - "6379:6379"
    command: redis-server --save 60 1 --loglevel warning
    networks:
      - digital-twin-net

  # Relational Database
  postgres:
    image: postgres:15-alpine
    container_name: twin-postgres-db
    environment:
      POSTGRES_USER: twin_operator
      POSTGRES_PASSWORD: SecretDbPassword123
      POSTGRES_DB: digital_twin
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - digital-twin-net

  # Backend Server Application
  backend:
    build: ./backend
    container_name: twin-backend-api
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - DATABASE_URL=postgresql://twin_operator:SecretDbPassword123@postgres:5432/digital_twin?schema=public
      - REDIS_URL=redis://redis:6379
      - MQTT_BROKER_URL=mqtt://mosquitto:1883
    depends_on:
      - postgres
      - redis
      - mosquitto
    networks:
      - digital-twin-net

  # Web Client UI
  frontend:
    build: ./frontend
    container_name: twin-frontend-ui
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - digital-twin-net

networks:
  digital-twin-net:
    driver: bridge

volumes:
  pgdata:
```

### 19.2 Mosquitto Broker Configuration (`mosquitto.conf`)
Located under `./docker/mosquitto/config/mosquitto.conf`:
```ini
# Port binding configuration
listener 1883 0.0.0.0

# ⚠️ DEVELOPMENT ONLY CONFIGURATION: Anonymous connections are enabled for local simulator environments.
# In staging/production environments, this must be set to 'false' with a password file defined.
allow_anonymous true

# PRODUCTION AUTHENTICATION SCHEME (Uncomment to enable credentials checking):
# allow_anonymous false
# password_file /mosquitto/config/passwords

persistence true
persistence_location /mosquitto/data/
log_dest file /mosquitto/log/mosquitto.log
```

---

## 20. Security & Scalability Considerations

### 20.1 Role-Based Access Control (RBAC)
*   **Operator Permissions**: Can read values, acknowledge alerts, add downtime classifications.
*   **Supervisor Permissions**: Full write capabilities, rule overrides, access to reporting APIs.
*   **Implementation**: Verify permissions by decoding JWT claims within Express route handlers.

### 20.1.2 MQTT Authentication & Authorization
*   **Local Ingestion Simulator Security:** In development mode, the broker runs with `allow_anonymous true` to ease testing.
*   **Production Hardening:** The Mosquitto broker container is configured with `allow_anonymous false` and is bound to a file `/mosquitto/config/passwords` generated via `mosquitto_passwd`. The backend subscriber client and IoT gateway publishers authenticate using distinct credentials and ACL (Access Control List) rules that limit permissions. For instance:
    *   `sensor_publisher` can only publish to `factory/line/+/machine/+/telemetry`.
    *   `backend_subscriber` has read-only access to `factory/#`.

### 20.2 Connection Pooling & Read Optimization
*   Prisma handles connection pooling implicitly. The backend limits connection sizing in production using database connection string parameters (e.g., `&connection_limit=20`).
*   Instead of querying PostgreSQL for every single client socket refresh, state fetches are redirected to Redis. A cache-aside approach updates Redis values during telemetry ingestion, ensuring that read calls avoid hitting the disk.

### 20.3 Telemetry Batching & Heartbeat Sync Strategy
To protect PostgreSQL against write amplification during peak telemetry loads, the system decouples caching updates from archival database writes:
*   **Immediate Redis Cache/Heartbeat Sync:** When a telemetry packet is received, the ingestion service writes it **immediately and synchronously** to Redis (using a single CPU memory operation) to update `last_heartbeat`. This guarantees that the 10-second background timeout watcher has access to real-time machine telemetry timestamps, preventing any early connectivity alerts (e.g. false timeouts due to database batch latency).
*   **Asynchronous PostgreSQL Batching:** Relational database writes are buffered in memory and committed in bulk via transaction operations (`createMany`) every 5 seconds, mitigating database I/O overhead.

---

## 21. Edge Cases & Failure Handling

*   **Broker Disconnection:** On broker connection loss, the backend holds metrics in a memory buffer. Once the connection re-establishes, the backend flushes the buffer to preserve historical trends.
*   **Out-of-Order Packets:** The backend ignores telemetry updates containing a timestamp older than the machine's current `lastUpdated` time in Redis.
*   **Database Failure:** If the database goes offline, the backend writes active alerts directly to Redis to ensure operators are still notified via WebSockets, and caches event data locally to write to the database once it recovers.

---

## 22. Logging & Monitoring

*   **Structured Logging:** Logs are written to stdout in JSON format using Pino/Winston.
*   **Correlation IDs:** Express middlewares inject a unique `x-correlation-id` header into incoming requests. This ID is passed through log calls to simplify troubleshooting across services.
*   **Health Diagnostics:** The `/health` route verifies the status of active dependencies (PostgreSQL, Redis, Mosquitto) and returns appropriate HTTP status codes for orchestration health checks.

---

## 23. Phased Implementation Roadmap

```
┌────────────────────────────────────────────────────────┐
│ Phase 1: Setup Infrastructure & Environment (Weeks 1)  │
│  - Docker configurations, Mosquitto & DB setup         │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ Phase 2: Ingestion Pipeline & DB Migrations (Week 2)   │
│  - Ingestor engine, Prisma models, caching logic       │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ Phase 3: Real-Time Communication & API Core (Week 3)   │
│  - Express endpoints, Socket.IO rooms, alerts engine   │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ Phase 4: Frontend Development & Visualization (Week 4) │
│  - React, Tailwind dashboard, charting, alert panels   │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ Phase 5: Verification & Safety Simulations (Week 5)    │
│  - Load simulation scripts, verify timeouts & limits   │
└────────────────────────────────────────────────────────┘
```

---

## 24. Future AI/ML Enhancements

*   **Predictive Maintenance (RUL)**: Implement a regression model (such as a Random Forest or LSTM) to forecast the Remaining Useful Life of critical machine parts based on rolling trends in temperature and vibration.
*   **Anomaly Detection**: Train an unsupervised Autoencoder on normal operating data. The model flags abnormal machine states by monitoring reconstruction errors, identifying issues before they trigger simple threshold rules.
*   **Visual PPE Verification**: Integrate a YOLO object detector at the edge to inspect camera streams. The model verifies that personnel are wearing hardhats and safety vests, generating safety alerts automatically on the dashboard when violations are detected.

---

## 25. README Structure

The project submission will include a structured README detailing:
1.  **Project Description**: Core features and tech stack justification.
2.  **Quick Start Guide**: Commands to run the Docker Compose setup.
3.  **Simulation Configuration**: Instructions for starting the telemetry and camera simulators.
4.  **Database Migration**: Guide for running schema migrations via Prisma.
5.  **API Reference & WebSocket Documentation**: Details on endpoints and payload structures.
6.  **Troubleshooting Guide**: Common issues and mitigation steps.

---

## 26. Testing Strategy

To ensure system reliability and code quality, the project implements an automated testing framework using Jest and Ts-jest. The strategy covers unit, integration, and end-to-end scenarios.

### 26.1 Unit Test: Alert Threshold Logic
This test verifies that the threshold engine generates correct alerts with appropriate severity classifications, and enforces alert storm mitigation.

```typescript
import { evaluateTelemetryRules } from '../services/alertEngine';
import { prismaMock } from '../utils/singletonPrismaMock';

describe('Alert Engine Threshold Evaluation', () => {
  it('should generate a HIGH severity alert when temperature exceeds 80°C', async () => {
    const mockMachineId = 'MACHINE_01';
    const metrics = { temperature: 85.5, vibration: 3.0, power_consumption: 12.0 };
    
    // Mock the database call to return null (no active alert already exists)
    prismaMock.alert.findFirst.mockResolvedValue(null);
    prismaMock.alert.create.mockResolvedValue({
      id: 'alert-uuid',
      machineId: mockMachineId,
      alertType: 'HIGH_TEMPERATURE',
      severity: 'HIGH',
      status: 'ACTIVE',
      message: 'Machine temperature exceeds critical limit of 80°C (Current: 85.5°C)',
    });

    const alerts = await evaluateTelemetryRules(mockMachineId, metrics);
    
    expect(alerts).toHaveLength(1);
    expect(alerts[0].alertType).toBe('HIGH_TEMPERATURE');
    expect(alerts[0].severity).toBe('HIGH');
  });

  it('should not create a duplicate alert if an ACTIVE high temperature alert already exists', async () => {
    const mockMachineId = 'MACHINE_01';
    const metrics = { temperature: 85.5, vibration: 3.0, power_consumption: 12.0 };
    
    // Mock active alert exists
    prismaMock.alert.findFirst.mockResolvedValue({
      id: 'existing-alert-uuid',
      machineId: mockMachineId,
      alertType: 'HIGH_TEMPERATURE',
      status: 'ACTIVE',
    });

    const alerts = await evaluateTelemetryRules(mockMachineId, metrics);
    
    // Expect duplicate prevention (alert storm mitigation) to skip DB creation
    expect(prismaMock.alert.create).not.toHaveBeenCalled();
    expect(alerts).toHaveLength(0);
  });
});
```

### 26.2 Integration Test: MQTT Ingestion -> State Update Flow
This test validates the path from receiving an MQTT telemetry packet to updating the Redis cache and SQL storage.

```typescript
import { handleMqttTelemetryPacket } from '../services/processor';
import { createClient } from 'redis';
import { prisma } from '../utils/db';

jest.mock('../utils/db');

describe('MQTT Telemetry Processing Integration', () => {
  let redisClient: any;

  beforeAll(async () => {
    redisClient = createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  it('should process telemetry payload, update Redis state, and persist to DB', async () => {
    const rawPayload = JSON.stringify({
      machine_id: 'MACHINE_01',
      timestamp: new Date().toISOString(),
      status: 'RUNNING',
      metrics: {
        temperature: 75.0,
        vibration: 2.1,
        power_consumption: 10.5
      }
    });

    const topic = 'factory/line/line_1/machine/MACHINE_01/telemetry';

    // Invoke processing handler
    await handleMqttTelemetryPacket(topic, rawPayload);

    // Assert Redis state cache is updated correctly
    const cachedState = await redisClient.get('machine:MACHINE_01:state');
    expect(cachedState).not.toBeNull();
    
    const parsedState = JSON.parse(cachedState);
    expect(parsedState.status).toBe('RUNNING');
    expect(parsedState.metrics.temperature).toBe(75.0);

    // Assert DB insert was triggered
    expect(prisma.telemetryReading.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          machineId: 'MACHINE_01',
          temperature: 75.0
        })
      })
    );
  });
});
```

### 26.3 Integration Test: Passive Timeout Detection
This test checks that the background connection monitor correctly marks inactive machines as down.

```typescript
import { checkConnectivityHeartbeats } from '../services/timeout';
import { createClient } from 'redis';
import { prismaMock } from '../utils/singletonPrismaMock';

describe('Connectivity Heartbeat Watcher', () => {
  let redisClient: any;

  beforeAll(async () => {
    redisClient = createClient();
    await redisClient.connect();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  it('should flag machine as DOWN and trigger CONNECTIVITY alert if last heartbeat is older than 60s', async () => {
    const machineId = 'MACHINE_SILENT';
    const staleTime = new Date(Date.now() - 75000).toISOString(); // 75 seconds ago
    
    // Seed stale state in Redis
    await redisClient.set(`machine:${machineId}:state`, JSON.stringify({
      machineId,
      status: 'RUNNING',
      lastUpdated: staleTime
    }));

    prismaMock.downtimeEvent.create.mockResolvedValue({ id: 'downtime-event-1' });
    prismaMock.alert.create.mockResolvedValue({ id: 'alert-1' });

    // Execute connectivity check
    await checkConnectivityHeartbeats();

    // Verify Redis state is updated to DOWN
    const updatedState = await redisClient.get(`machine:${machineId}:state`);
    const parsedState = JSON.parse(updatedState);
    expect(parsedState.status).toBe('DOWN');

    // Verify Downtime event in DB was created
    expect(prismaMock.downtimeEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          machineId,
          source: 'SYSTEM_TIMEOUT',
          reason: 'Heartbeat timeout'
        })
      })
    );
  });
});
```

# Task Progress: Industrial Digital Twin Dashboard

- `[/]` **Phase 1: Setup Infrastructure & Environment**
  - `[ ]` Create folder structure (backend, frontend, simulators, database, docker configs)
  - `[ ]` Create `docker-compose.yml` in project root
  - `[ ]` Create Mosquitto config (`docker/mosquitto/config/mosquitto.conf`)
  - `[ ]` Set up Postgres database volume mappings
- `[ ]` **Phase 2: Database and Ingestion Core**
  - `[ ]` Initialize backend Node/TypeScript application
  - `[ ]` Create `schema.prisma` under database module
  - `[ ]` Set up local database migration scripts
  - `[ ]` Implement MQTT Ingestion Service with validation schema (`Zod`)
  - `[ ]` Set up Redis connection pool and caching utility
- `[ ]` **Phase 3: Stream Processing & Real-Time Engine**
  - `[ ]` Implement stream and threshold Alert Engine
  - `[ ]` Implement active and passive Downtime Detection logic (Heartbeat Watcher daemon)
  - `[ ]` Set up WebSocket Socket.IO room broadcast server
  - `[ ]` Implement Express REST APIs (pagination, acknowledge, resolve alerts)
- `[ ]` **Phase 4: Frontend Development**
  * `[ ]` Bootstrap Vite React + TailwindCSS client application
  * `[ ]` Implement layout map component (grid rendering of machine state colors)
  * `[ ]` Build active alerts side-panel feed
  * `[ ]` Build Recharts modal overlay for machine historical trends
- `[ ]` **Phase 5: Simulators, Testing & Verification**
  - `[ ]` Write sensor simulators script (1Hz telemetry emitter)
  - `[ ]` Write camera visual simulator script (safety event emitter)
  - `[ ]` Add automated unit tests for thresholds and timeouts
  - `[ ]` Run validation checks and update walkthrough

# Technical Implementation Walkthrough

This document outlines the implementation details, verification results, and layout configurations of the completed Real-Time Industrial Digital Twin Dashboard.

***

## 1. Project Overview
This project is a real-time Digital Twin Dashboard designed for factory plant floors. It integrates:
*   **IoT Ingestion**: Captures high-frequency machine telemetry (status, temperature, vibration, power) at 1Hz via MQTT.
*   **Safety Monitoring**: Processes computer vision camera events (PPE violations, restricted zone entries) to notify supervisors immediately.
*   **Downtime Tracking**: Tracks passive machine timeouts and active sensor downtime events to compute plant OEE.

***

## 2. Core Features Implemented
*   **Requirements Separation**: Split monolithic requirements into clear design documents: `PRD.md` (Product Specifications) and `implementation_plan.md` (Technical Architecture).
*   **Expanded Factory Simulation**: Upgraded IoT simulators to support 15 machines (5 per line across 3 production lines).
*   **Structured SCADA UI**: Enforced a monospace-only display grid where machines are sorted alphabetically and organized as physical rows.
*   **Process Security**: Configured CORS origins dynamically on REST and WebSocket layers, and implemented process lifecycle signals to gracefully release connections.

***

## 3. Backend Improvements
*   **Alert Storm Mitigation**: Added a Redis caching layer for active alerts. The alert engine checks Redis first before querying PostgreSQL, avoiding database bottlenecks during high-frequency telemetry spikes.
*   **Telemetry Batching**: Telemetry readings are buffered in memory and flushed to PostgreSQL in transactions every 5 seconds to reduce write overhead.
*   **Passive Heartbeat Timeout**: A background daemon monitors Redis heartbeat keys every 10 seconds. If a machine remains silent for more than 60 seconds, it is marked as `DOWN`, generating a critical connectivity alert.
*   **Error Handling and Types**: Resolved compiler warnings by cleaning up Pino logging calls and type-casting caught errors in server lifecycle shutdown hooks.

***

## 4. Frontend Dashboard Highlights
*   **Monospace SCADA Aesthetic**: Built with a dark, high-contrast monospace scheme using 'JetBrains Mono' for low-light factory environments.
*   **Status Indicators**: Uses intuitive status codes and breathing box-shadow alerts on `DOWN` machines to highlight critical events.
*   **Trend Analysis & OEE Classification**: Includes a modal chart displaying Recharts trends for temperature, vibration, and power, with a form to classify downtime reasons.
*   **API Proxy Routing**: Integrated Nginx routing inside the Docker container to forward `/api` and `/socket.io` websocket traffic to the backend API.

***

## 5. Testing Results
All unit and integration tests compile cleanly and pass without leaks.

```bash
> digital-twin-backend@1.0.0 test
> jest --runInBand --detectOpenHandles

PASS src/tests/digitalTwin.test.ts
  Digital Twin Observability System Tests
    1. Unit Test: Alert Threshold Logic
      √ should trigger a HIGH severity alert when temperature exceeds 80°C (4 ms)
      √ should mitigate alert storm by updating and not creating duplicates when active alert exists (1 ms)
      √ should bypass database findFirst check when active alert cache is warm in Redis (2 ms)
    2. Integration Test: Ingestion Ingress Flow
      √ should process telemetry payloads, caching in Redis immediately and registering in DB (2 ms)
    3. Integration Test: Passive Timeout Detection
      √ should flag unresponsive machine as DOWN and trigger CONNECTIVITY alert (2 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        2.726 s, estimated 4 s
Ran all test suites.
```

***

## 6. Screenshots / Demo
### 6.1 Plant Operator SCADA Workspace
The plant operator panel runs on a monospace layout with strict contrast styling and accent statuses (Green=Running, Amber=Idle, Red=Down, Blue=Maintenance). DOWN machines trigger a breathing red shadow ring to capture attention.

![Industrial Twin Dashboard](media/dashboard_screenshot.png)

### 6.2 CCTV Camera Event Violation
Safety CCTV event logs are pushed to the sidebar containing relative timestamps, severity indicators, and root-cause preview images.

![CCTV Zone Breach](media/cctv_zone_breach.png)

***

## 7. Deployment Readiness
*   **Docker Orchestration**: The stack is containerized with Docker Compose (separating Postgres, Redis, Mosquitto, API, and Web Client UI).
*   **Environment Configuration**: Credentials have been removed from source files and are managed via a `.env` file.
*   **GitHub Templates**: Added `.github` issue and pull request templates for standard workspace collaboration.

***

## 8. Future Improvements
*   **Machine Learning Integration**: Integrate a lightweight LSTM model on telemetry streams to detect anomalies before limits are exceeded.
*   **Predictive Maintenance**: Predict machine maintenance intervals using cumulative power and vibration wear trends.
*   **Interactive Floorplan**: Replace grid-based SCADA cells with an SVG-based spatial floor map.

# Product Requirements Document (PRD)
## Real-Time Industrial Digital Twin Dashboard
**Document Version:** 1.0.0  
**Target Role:** AI/ML & IoT Engineering Intern (Industry 4.0 Application)  
**Author:** AIML Engineering Student  
**Workspace:** `d:/projects/Autonex Ai`

---

## 1. Executive Summary
This document defines the product and technical specifications for the **Real-Time Industrial Digital Twin Dashboard**, a simplified Industry 4.0 platform. The system ingests telemetry from plant-floor IoT sensors and CCTV cameras via MQTT, processes streams in real time (tracking machine state, calculating downtime, and evaluating thresholds), stores readings in PostgreSQL, and reflects live plant status on a WebSockets-powered React dashboard.

This PRD acts as a blueprint for implementing a production-grade, containerized solution designed for reliability, sub-second latency, and future predictive intelligence.

---

## 2. Problem Statement
Modern manufacturing plants are hindered by siloed data sources. Industrial IoT sensors (PLCs, temperature probes, vibration sensors) publish high-velocity telemetry, while safety-critical events occur within camera feeds (restricted zone entries, PPE violations). Operators often lack a single pane of glass to:
1. View real-time machine operations.
2. Correlate sensor abnormalities with computer vision (CCTV) alerts.
3. Automatically identify and trace machine downtime event lifecycles.
4. Action and acknowledge critical safety and hardware warnings.

---

## 3. Product Vision
To build a high-fidelity virtual representation (Digital Twin) of a factory floor that blends IoT sensor streams and computer vision events. The system alerts operators immediately upon threshold breaches, automates the detection of equipment failures, provides tools to categorize downtime reasons, and sets a foundation for predictive maintenance using historical machine data.

### Target User Personas
*   **Plant Operator:** Focuses on tactical action. Needs instant notifications, machine health cards, alert acknowledgement workflows, and real-time CCTV event clips.
*   **Plant Supervisor:** Focuses on analytical performance. Needs historical trends, overall equipment effectiveness (OEE) metrics, downtime duration distribution, and CSV export capabilities.

---

## 4. Functional Requirements

### 4.1 Ingestion & Tracking
*   **FR-1.1:** Continuous ingestion of telemetry from multi-line machine groups (RUNNING, IDLE, DOWN, MAINTENANCE, UNKNOWN).
*   **FR-1.2:** Maintain a Redis-based cache of the "Latest Machine State" for instant API reads and UI syncs.
*   **FR-1.3:** Ingest CCTV event payloads containing safety alerts, zones, confidence scores, and preview image URLs.

### 4.2 Downtime & Alerts
*   **FR-2.1:** **Active Downtime:** Transition status immediately if telemetry explicitly indicates `DOWN`.
*   **FR-2.2:** **Passive Downtime (System Timeout):** Trigger status change to `DOWN` if telemetry is missing for $> 60$ seconds.
*   **FR-2.3:** **Alert Storm Prevention:** Deduplicate active alerts to avoid spamming the database and UI.
*   **FR-2.4:** **Alert Acknowledgement Workflow:** Provide operations with API/WS endpoints to Transition alerts from `ACTIVE` $\rightarrow$ `ACKNOWLEDGED` $\rightarrow$ `RESOLVED`.

### 4.3 UI & Reporting
*   **FR-3.1:** Display a virtual layout representing machines categorized by factory lines.
*   **FR-3.2:** Render historical trends (temperature, vibration, power) using responsive SVG charts.
*   **FR-3.3:** Enable report extraction summarizing downtime events and OEE parameters to CSV.

---

## 5. Non-Functional Requirements

### 5.1 Performance & Latency
*   **NFR-1.1:** End-to-end telemetry propagation latency (MQTT publish to WebSocket client update) must be $< 150\text{ms}$ under normal load (100 active machines at $1\text{Hz}$ publish rate).
*   **NFR-1.2:** Ingestion service must process incoming MQTT messages asynchronously without blocking the REST API handler thread.

### 5.2 Scalability & Resiliency
*   **NFR-2.1:** Implement Redis to offload read-heavy dashboard queries for latest states, protecting the main relational database.
*   **NFR-2.2:** MQTT client must auto-reconnect with exponential backoff on broker connection failures.
*   **NFR-2.3:** Leverage database connection pooling to avoid resource starvation under high event rates.

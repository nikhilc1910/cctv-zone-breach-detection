# Real-Time Industrial Digital Twin Dashboard — Walkthrough & Verification

This document summarizes the changes made to the project, validates its core ingestion and alert processing components through automated tests, and presents the visual layout of the completed system.

***

## 1. Summary of Changes Made

### 1.1 PRD & Implementation Plan Separation
- Split the monolithic `PRD.md` into two separate documents:
  - [PRD.md](file:///d:/projects/Autonex%20Ai/PRD.md) — What/Why requirements (Problem Statement, Vision, Personas, Functional/Non-Functional requirements).
  - [implementation_plan.md](file:///d:/projects/Autonex%20Ai/implementation_plan.md) — How technical execution plan (System Architecture, Schemas, API Endpoints, WebSocket design).

### 1.2 Backend Ingestion & Logging Fixes
- Corrected the Pino logging method invocations in [ingestion.ts](file:///d:/projects/Autonex%20Ai/backend/src/services/ingestion.ts) to resolve TS2769 compilation errors.
- Added a `GET /api/machines/:id/downtime` endpoint to [api.ts](file:///d:/projects/Autonex%20Ai/backend/src/controllers/api.ts) to retrieve historical downtime records for manual Root-Cause OEE audits.

### 1.3 Jest Caching & Memory Leak Fixes
- Added `resetMocks: false` and `restoreMocks: false` in [jest.config.js](file:///d:/projects/Autonex%20Ai/backend/jest.config.js) to prevent Jest from wiping out `jest.mock` implementations between test suites.
- Exported `stopTelemetryBatcher()` from [processor.ts](file:///d:/projects/Autonex%20Ai/backend/src/services/processor.ts) and registered an `afterAll` cleanup hook in [digitalTwin.test.ts](file:///d:/projects/Autonex%20Ai/backend/src/tests/digitalTwin.test.ts) to clean up open timer handles.
- Fixed mock store leakages in [digitalTwin.test.ts](file:///d:/projects/Autonex%20Ai/backend/src/tests/digitalTwin.test.ts) by clearing the local mock Redis store before every test run.

### 1.4 High-Performance Alert Deduplication
- Added Redis caching helper functions (`getActiveAlertCache`, `setActiveAlertCache`, `deleteActiveAlertCache`) in [redis.ts](file:///d:/projects/Autonex%20Ai/backend/src/utils/redis.ts).
- Re-wired `checkAndTriggerAlert` in [processor.ts](file:///d:/projects/Autonex%20Ai/backend/src/services/processor.ts) to check the Redis active cache **first** before making any disk database reads.
- Re-wired the Express manual acknowledge and resolve endpoints in [api.ts](file:///d:/projects/Autonex%20Ai/backend/src/controllers/api.ts) to clear the active cache entry upon status changes.

### 1.5 SCADA Monospace User Interface
- Bootstrapped and designed the entire frontend with pure monospace typography using 'JetBrains Mono'.
- Created [TopRibbon.tsx](file:///d:/projects/Autonex%20Ai/frontend/src/components/TopRibbon.tsx) containing OEE summaries that slide up on value change.
- Created [PlantMap.tsx](file:///d:/projects/Autonex%20Ai/frontend/src/components/PlantMap.tsx) showing the production floor layout, line filtering, a dynamic 8-second horizontal scan line, and an `[EXPORT OEE]` button.
- Created [MachineCell.tsx](file:///d:/projects/Autonex%20Ai/frontend/src/components/MachineCell.tsx) supporting left-bordered status labels, value update flashing, safety threshold highlights (red on breach), and box-shadow pulse breathing on `DOWN` machines.
- Created [AlertsPanel.tsx](file:///d:/projects/Autonex%20Ai/frontend/src/components/AlertsPanel.tsx) / [AlertRow.tsx](file:///d:/projects/Autonex%20Ai/frontend/src/components/AlertRow.tsx) displaying unclosed alarms, relative time, and text-only buttons that dynamically highlights on hover.
- Created [TrendModal.tsx](file:///d:/projects/Autonex%20Ai/frontend/src/components/TrendModal.tsx) containing stacked temperature, vibration, and power charts along with the OEE root-cause classification form.

***

## 2. Automated Test Verification Results

All unit and integration tests compile cleanly and pass with zero errors, warning flags, or open handle leaks.

```bash
> digital-twin-backend@1.0.0 test
> jest --runInBand --detectOpenHandles

{"level":40,"time":1779794433646,"pid":16680,"hostname":"NIKHILC","msg":"New Threshold Alert triggered on MACHINE_01: Machine temperature exceeds critical limit of 80°C (Current: 85.5°C)"}
{"level":40,"time":1779794433670,"pid":16680,"hostname":"NIKHILC","msg":"Lost communication channel on machine [MACHINE_SILENT]. Silence age: 75s."}
{"level":40,"time":1779794433670,"pid":16680,"hostname":"NIKHILC","msg":"New Threshold Alert triggered on MACHINE_SILENT: Lost communication channel. Heartbeat missing for > 60 seconds."}
PASS src/tests/digitalTwin.test.ts
  Digital Twin Observability System Tests
    1. Unit Test: Alert Threshold Logic
      √ should trigger a HIGH severity alert when temperature exceeds 80°C (6 ms)
      √ should mitigate alert storm by updating and not creating duplicates when active alert exists (11 ms)
    2. Integration Test: Ingestion Ingress Flow
      √ should process telemetry payloads, caching in Redis immediately and registering in DB (5 ms)
    3. Integration Test: Passive Timeout Detection
      √ should flag unresponsive machine as DOWN and trigger CONNECTIVITY alert (3 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        2.823 s, estimated 4 s
Ran all test suites.
```

***

## 3. Visual UI & Camera Event Walkthrough

Below are the mockups of the finished dashboard and simulated CCTV vision feeds demonstrating the completed client application.

### 3.1 Digital Twin SCADA Dashboard Interface
The plant operator panel runs on a monospace layout with strict contrast styling and accent statuses (Green=Running, Amber=Idle, Red=Down, Blue=Maintenance). DOWN machines trigger a breathing red shadow ring to capture attention.

![Industrial Twin Dashboard](media/dashboard_screenshot.png)

### 3.2 CCTV Camera Event Violation
Safety CCTV event logs are pushed to the sidebar containing relative timestamps, severity indicators, and root-cause preview images.

![CCTV Zone Breach](media/cctv_zone_breach.png)

***

## 4. Repository Professionalization & Polish

We have made the following repository-level changes to optimize discoverability, SEO, and indexing:

### 4.1 Staged Visual Assets
- Created a `media/` folder in the root directory to store high-resolution UI walkthrough mockups.
- Staged `media/dashboard_screenshot.png` and `media/cctv_zone_breach.png` locally in the repository.

### 4.2 Comprehensive Configuration Files
- Expanded [.gitignore](.gitignore) to cover common Editor configurations (`.vscode`, `.idea`), build outputs, package caches, OS temporary files, and database schemas.

### 4.3 GitHub Automation Templates
- Created [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md) for standardized peer review checkmarks.
- Created [.github/ISSUE_TEMPLATE/bug_report.md](.github/ISSUE_TEMPLATE/bug_report.md) for clean issue tracking.
- Created [.github/ISSUE_TEMPLATE/feature_request.md](.github/ISSUE_TEMPLATE/feature_request.md) for standard feature proposals.

### 4.4 Recruitment & Recruiter Visibility Polish
- Added technology shield badges (TypeScript, React, Redis, Postgres, MQTT, Docker, and MIT License).
- Added an **Engineering Highlights** section explaining key architecture decisions (MQTT QoS levels, Redis caching, write buffering, passive heartbeat timeouts).
- Documented a full visual Monorepo Directory Tree representation of the workspace.
- Documented future extension roadmaps (e.g., LSTM Anomaly Telemetry models, Predictive Maintenance forecasting).

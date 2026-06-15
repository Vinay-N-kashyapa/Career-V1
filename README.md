# Verify-PinIT Student Flow Realignment (Version 1)

This repository holds the student-facing Career OS dashboard, vault, quests, and daily missions application. In Version 1, the student flow has been realigned to omit the Resume Builder, Career Builder (standalone), mock AI Interviews, and Sentinel trust ledger, focusing on a streamlined core experience.

## Key Changes & Updates

### 1. Navigation Shell (`src/components/ui/AppShell.tsx`)
- **Tab Cleanliness**: Removed navigation links to `/resume`, `/career-builder`, `/interview`, and `/sentinel`. Added `/vault` directly into the sidebar.
- **Top Bar Badge Renaming**: Renamed the top bar telemetry label from **ATS** to **Career** to match the general capability score.
- **AI Guide Onboarding**: Updated the step-by-step onboarding walkthrough and tab-guide summaries to only mention and direct users to active paths:
  1. Onboarding greeting.
  2. Command Center Dashboard (Introduction to XP, streaks, Career DNA).
  3. Career Twin Studio (Onboarding questionnaire).
  4. Quest & Mission Dashboard Trajectory selection.
- Removed all markdown help assets referencing legacy pages.

### 2. HUD Command Center (`src/app/dashboard/page.tsx`)
- **Radial Score Metric**: Renamed `Career Score (ATS)` to `Career Score` and simplified descriptions to remove ATS keyword-matching dependencies.
- **Inline Trajectory Selection**: Rather than routing to the legacy `/career-builder` tab, selecting a trajectory card (e.g. Java Backend Architect) occurs inline. The Next Step recommendation card dynamically scrolls/points to the inline trajectory selector via `#trajectory-selector` if no roadmap is generated.
- **Mentor Advice**: Updated Ms. Priya's and Mr. Vikram's advice tips to focus on Vault certifications, consistency streaks, and Career DNA rather than resume uploads and mock AI interviews.
- **Telemetry Scan Logs**: Updated the secure vault verification logger to match tags with the `Career Twin profile` instead of the legacy `resume career twin profile`.

### 3. Personalised Checklist (`src/components/ui/WhatToDoToday.tsx`)
- Fully purged the `Resume / ATS` priority check card (Priority 1) and `Mock interview` priority check card from the "WHAT TO DO TODAY" candidate generator. The component now prioritizes:
  1. Vault upload / expansion.
  2. Daily Mission streak.
  3. Trust Score level.
  4. Recruiter visibility index.
  5. Career DNA dimensions.

---
*Note: All legacy routes and components have been safely moved to `_legacy/` for future reference in Version 2 development.*

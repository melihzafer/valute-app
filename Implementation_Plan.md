# 📋 Implementation Plan: Epoch

## Phase 1: Foundation & "Modern Clean" UI
**Goal:** Replace the current interface with the Raycast-style Command Bar and Card Dashboard.
- [ ] **Command Bar UI:** Implement `cmdk` with "Chip" visualizer for tags.
- [ ] **Dashboard:** Build "Active Project Cards" and "Financial Health" widgets.
- [ ] **Navigation:** Remove all traditional sidebars/menus.

## Phase 2: The Multi-Model Service Engine
**Goal:** Enable the 4 billing models.
- [ ] **Database Migration:** Update Drizzle schema for `ServiceItems`, `Subscriptions`, and `HybridLogs`.
- [ ] **Unit Tracker:** UI for selecting units and "Completing" them.
- [ ] **Subscription Daemon:** Background logic to check date and accrue monthly revenue.
- [ ] **Revenue Calculator:** Unified function to sum (Hourly + Fixed + Units + Subs).

## Phase 3: Automation & Vault
**Goal:** OS Integration.
- [ ] **Deep Focus:** Implement `AutomationService` (Node.js `child_process`).
- [ ] **Vault:** Implement File Linking and `Shell.openItem` logic.
- [ ] **Secrets:** Implement Encrypted storage for client credentials.

## Phase 4: Financial Intelligence
**Goal:** Forecasting and Expenses.
- [ ] **Pipeline:** Create "Deal Flow" data model and UI.
- [ ] **Scope Guard:** Implement "Hidden Hourly Quota" math and alerts.
- [ ] **Expenses:** UI for adding expenses to projects.

## Phase 5: Epoch Neural Core (AI)
**Goal:** Intelligence Layer.
- [ ] **Settings:** UI for "Bring Your Own Key" (OpenAI).
- [ ] **Ghostwriter:** Prompt engineering for Daily Reports.
- [ ] **Tone Polisher:** `Cmd+K` action for text inputs.
- [ ] **Client Portal:** HTML Report Generator template.

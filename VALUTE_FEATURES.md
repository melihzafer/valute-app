# 🚀 Valute: Master Feature Specification

> **Vision:** A "Modern Freelance OS" that manages time, revenue, environment, and client relationships.
> **Identity:** "Modern Clean" // Linear-Style // Keyboard-First.

---

## 1. Core Experience
**Philosophy:** Delete the interface. Use the Command Bar.

### 1.1 Global Command Palette (`Ctrl+K`)
*   **Visuals:** A floating, vertically centered bar (Raycast/Spotlight style). not a terminal.
*   **Smart Chips:** Inputs are visualized as tags: `[@Client]`, `[> Task]`, `[:Unit]`.
*   **Context:** Works globally, even when the app is minimized.

### 1.2 "Modern Clean" Dashboard
*   **Left Panel (Active Work):** 
    *   Uses "Cards" instead of tables.
    *   Visual progress bars for budget/time.
*   **Right Panel (Financial Health):** 
    *   **Monthly Revenue Goal:** A bar chart filling up based on *all* revenue streams (subscriptions + active work).
    *   **Passive Income Widget:** Highlights guaranteed revenue for the month (e.g., Retainers).

---

## 2. The Multi-Model Service Engine
Freelancers don't just sell hours. Valute natively supports 4 distinct models:

### A. Unit-Based Tracking
*   **Scenario:** "Frontend Dev - 85€ Per Page".
*   **Workflow:** User selects a unit type. No timer required (optional). Clicking "Complete Unit" adds fixed amount to accrued revenue.
*   **Output:** Invoice reads "Frontend Service - 1 Page (Home)... 85 EUR".

### B. Subscription Engine (Passive Income)
*   **Scenario:** "Monthly SEO - 400€", "Maintenance - 60€".
*   **Workflow:** Auto-accrues on the 1st of the month.
*   **Dashboard:** Shows "Guaranteed Income" regardless of hours worked. Handles reminders ("Send SEO Report").

### C. Hybrid Projects
*   **Scenario:** "DevOps" (Hourly) + "Script Writing" (Fixed).
*   **Workflow:** Switching tasks within the same project changes the billing mode dynamically.
    *   `~Scripting` -> **Fixed Price Engine**.
    *   `~Server-Fix` -> **Hourly Engine**.

### D. Standard Hourly & Fixed
*   **Fixed Price:** Calculated based on % completion.
*   **Hourly:** Standard `Rate * Time`.

---

## 3. Context & Automation Wizardry
The app manages your physical digital environment.

### "Deep Focus" Launcher
The system executes OS-level commands based on the selected task:
*   **`~Video-Editing`**: Opens Premiere/DaVinci. Closes Spotify. Mutes Notifications.
*   **`~Web-App`**: Opens VS Code & Localhost. Starts "Deep Focus" playlist.
*   **`~Design`**: Opens Figma. Opens Pinterest moodboard.

### Idle Detection
*   Smart pauses after 5 minutes of inactivity. "Were you on a break? discard time?"

---

## 4. Financial Intelligence
Acting as a CFO, not just a calculator.

*   **Deal Flow (Pipeline):** Track potential leads with Probability (%). Forecast "Expected Cash Flow" for next month.
*   **Dynamic Invoicing:** One-click generation of "Hybrid Invoices" (e.g., 1 Subscription + 5 Units + 3 Hours).
*   **Goal Tracking:** "You need 12 more hours or 2 Videos to hit your 5000€ goal."
*   **Multi-Currency:** Input in EUR, view estimated value in local currency (TRY/USD) via live rates.

---

## 5. Client Portal & Reporting
*   **HTML Report Generator:** Replaces PDF. Generates a single interactive HTML file.
*   **Content:** Timeline, Deliverables, Live Links (GitHub/Figma), SEO Metrics (iframe/charts).
*   **Value:** Elevates the freelancer to "Digital Partner" status.

---

## 6. The "Game Changers"

### 6.1 Scope Creep Guard
*   **Concept:** Uses a "Hidden Hourly Quota" for fixed-price projects.
*   **Alert:** Warns when actual hours worked consumes >80% of the project's theoretical hourly value.

### 6.2 Reimbursable Expenses
*   **Workflow:** Log expenses (`~Expense theme_license $59`) directly to a project.
*   **Invoicing:** Auto-prompts to include these "Billable" items on the next invoice.

### 6.3 Project "Vault" (Asset Indexing)
*   **Logic:** Does not copy files. Stores *Reference Links* to local folders, Repos, and Figma files for instant `Cmd+O` access.
*   **Credentials:** Encrypted storage for client passwords.

---

## 7. Valute Neural Core (AI Layer)
**Architecture:** BYOK (Bring Your Own Key). Privacy-first.

*   **Ghostwriter:** Auto-summarizes daily logs into professional "Daily Reports".
*   **Tone Polisher:** Transforms hasty text into professional communication (`Cmd+K` -> "Make Professional").
*   **Task Parser:** Extracts actionable tasks from copied Client Emails/Slack messages.
*   **The Estimator:** Predicts time/cost for new projects based on historical velocity.
# 🤖 GEMINI.md: Context & Agent Guidelines

**Project:** Valute (v2) - *Code Name: "Valute"*
**Identity:** "The Modern Freelance Operating System"

## 1. Project DNA
Valute is an **Electron-based Desktop Application** designed to transform freelancers into "Digital Partners". It is not just a time tracker; it is a **Service, Revenue, and Environment Manager**.

### Key Philosophies
1.  **Invisible Interface (Linear-Style):** "Command Palette" (`Ctrl+K`) over complex dashboards. Speed is the priority.
2.  **Multi-Model Revenue:** Native support for Retainers, Unit-based work, Fixed projects, and Hourly billing—often all within the same client.
3.  **Context Aware:** The app actively manages the user's OS environment (launching apps, blocking distractions) based on the task.
4.  **Local & Private AI:** "Bring Your Own Key" (BYOK) architecture. AI runs on demand to summarize, polish, and estimate, but data stays local.

### Technology Stack
*   **Runtime:** Electron (Main + Renderer).
*   **Language:** TypeScript (Strict).
*   **Frontend:** React, TailwindCSS, Shadcn/UI, Framer Motion.
*   **Backend:** Local SQLite (Drizzle ORM).
*   **AI Layer:** OpenAI Node SDK (User API Key).
*   **Automation:** Node.js `child_process` (for OS-level control).

## 2. Global Rules for Agents
1.  **Strict Typing:** No `any`. Zod validation for all inputs (IPC and User).
2.  **Premium UI/UX:**
    *   Aesthetics: "Modern Clean". High whitespace, subtle borders, "Chip" tags for context.
    *   No "Hacker Terminal" vibes; think "Apple Spotlight" or "Raycast".
3.  **Secure IPC:** Data crossing the bridge must be sanitized.
4.  **Offline First:** The app must be fully functional perceiving zero internet connectivity (except for AI features).

## 3. Core Directory Map
```text
/src
  /main
    /services     # Business Logic (RevenueEngine, AutomationService)
    /db           # Drizzle Schema (Complex Billing Models)
  /renderer
    /components   # UI (CommandBar, Glass Cards)
    /features     # Domain modules (Timer, AI, Dashboard)
    /store        # Zustand State
```

## 4. The "North Star"
**We are building the "Valute" Master Specification.**
The immediate focus is the **Command Bar (UI)** and the **Multi-Model Database Implemetation**. The app must handle complex billing scenarios (e.g., "Subscription + Hourly Fix + Unit Work") seamlessly.

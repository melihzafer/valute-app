# 🛠️ Technical Roadmap: Valute Architecture

## 1. System Architecture

### 1.1 The "Engines" Pattern

The application core is divided into specialized "Engines" running in the Main Process to handle complex logic decoupled from the UI.

- **Revenue Engine:** Handles the math for Unit, Hourly, Fixed, and Subscription models.
- **Automation Engine:** Uses Node.js `child_process` to script OS actions (App launch, Kill process).
- **Intelligence Engine:** Interface for OpenAI API (BYOK) and local template processing.
- **Vault Engine:** Manages file system links (`fs.stat`, shell execution) and Encryption (`crypto` module).

## 2. Data Layer (Drizzle/SQLite) Updates

To support Multi-Model billing, the schema must evolve:

```typescript
// Conceptual Schema
interface Project {
  id: string
  defaultMode: 'hourly' | 'fixed' | 'retainer'
}

interface ServiceItem {
  id: string
  projectId: string
  type: 'unit' | 'hourly' | 'subscription'
  name: string // e.g. "SEO Monthly"
  rate: number
  unitName?: string // e.g. "Page", "Video"
  recurringDay?: number // for Subscriptions
}

interface WorkLog {
  id: string
  type: 'time' | 'unit_completion' | 'expense'
  value: number // Duration (ms) OR Unit Count (int) OR Cost (float)
  revenueSnapshot: number // Value locked at time of creation
}
```

## 3. The Command Bar (UI/UX)

- **Library:** `cmdk`.
- **Visuals:** Custom CSS for "Chip" rendering.
- **Input Parsing:** Regex-based tokenizer to split `Input` into `[Command] [Context] [Arguments]`.

## 4. AI Integration Strategy

- **Security:** API Keys stored in `Electron SafeStorage` (System Keychain).
- **Transport:** Direct calls from Main Process to OpenAI. No middle-man server.
- **Context Window:** Logic to feed only relevant "Logs" to the LLM to minimize token costs.

## 5. Automation Strategy

- **Windows:** PowerShell scripts via `spawn`.
- **macOS:** AppleScript (`osascript`) via `spawn`.
- **Safety:** Whitelist of allowed applications to launch/kill.

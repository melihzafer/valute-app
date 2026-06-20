// src/main/services/CompanionService.ts
// M12 — Companion & Sync foundation. A lightweight, token-protected HTTP server
// on the local network that lets a phone (or any browser on the same Wi-Fi)
// do quick capture, see today's agenda, and control the timer. The desktop app
// remains the single source of truth — the companion just writes to the same DB.

import * as http from 'http'
import * as os from 'os'
import { v4 as uuidv4 } from 'uuid'
import { getSetting, setSetting } from './SettingsService'
import { getProjects } from './ProjectService'
import * as CalendarService from './CalendarService'
import * as TaskService from './TaskService'
import { createNote } from './NotesService'
import * as AIService from './AIService'

let server: http.Server | null = null
let currentPort = 0
let token = ''

export interface CompanionStatus {
  running: boolean
  port: number
  token: string
  urls: string[]
}

function lanAddresses(): string[] {
  const out: string[] = []
  const ifaces = os.networkInterfaces()
  for (const name of Object.keys(ifaces)) {
    for (const ni of ifaces[name] || []) {
      if (ni.family === 'IPv4' && !ni.internal) out.push(ni.address)
    }
  }
  return out
}

async function ensureToken(): Promise<string> {
  if (token) return token
  try {
    const raw = await getSetting('companion.token')
    if (raw) token = JSON.parse(raw)
  } catch {
    /* ignore */
  }
  if (!token) {
    token = uuidv4().replace(/-/g, '').slice(0, 16)
    await setSetting('companion.token', JSON.stringify(token))
  }
  return token
}

function send(
  res: http.ServerResponse,
  status: number,
  body: unknown,
  contentType = 'application/json'
): void {
  const payload = contentType === 'application/json' ? JSON.stringify(body) : String(body)
  res.writeHead(status, { 'Content-Type': contentType, 'Cache-Control': 'no-store' })
  res.end(payload)
}

function readBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
      if (data.length > 1_000_000) req.destroy() // 1MB cap
    })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch {
        resolve({})
      }
    })
    req.on('error', () => resolve({}))
  })
}

async function handleApi(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: URL
): Promise<void> {
  // Auth — token via query or header
  const provided = url.searchParams.get('token') || req.headers['x-token']
  if (provided !== token) {
    send(res, 401, { error: 'unauthorized' })
    return
  }

  const path = url.pathname

  if (path === '/api/state' && req.method === 'GET') {
    // Lazily require handlers to avoid a circular import at module load.
    const { getTimerStateMain } = require('../handlers')
    const timer = getTimerStateMain()
    const projects = (await getProjects())
      .filter((p: any) => p.status === 'active')
      .map((p: any) => ({ id: p.id, name: p.name }))
    let upcoming: any[] = []
    try {
      upcoming = (await CalendarService.getUpcoming(3)).slice(0, 8).map((i) => ({
        title: i.title,
        date: i.date,
        source: i.source
      }))
    } catch {
      /* ignore */
    }
    send(res, 200, { timer, projects, upcoming })
    return
  }

  if (path === '/api/timer' && req.method === 'POST') {
    const body = await readBody(req)
    const handlers = require('../handlers')
    if (body.action === 'start' && body.projectId) {
      await handlers.startProjectTimerMain(body.projectId)
    } else if (body.action === 'toggle') {
      await handlers.toggleTimerMain()
    }
    const { updateTrayMenu } = require('../index')
    try {
      await updateTrayMenu()
    } catch {
      /* ignore */
    }
    send(res, 200, { timer: handlers.getTimerStateMain() })
    return
  }

  if (path === '/api/capture' && req.method === 'POST') {
    const body = await readBody(req)
    const text = (body.text || '').toString().trim()
    if (!text) {
      send(res, 400, { error: 'empty' })
      return
    }
    const kind = body.kind || 'auto'
    try {
      if (kind === 'task') {
        await TaskService.createTask({ title: text, area: 'general', priority: 'medium' })
        send(res, 200, { ok: true, summary: `Added task “${text}”` })
      } else if (kind === 'note') {
        await createNote({ title: text.slice(0, 60), content: text, area: 'general' })
        send(res, 200, { ok: true, summary: 'Saved note' })
      } else {
        // auto — use AI quick-add if configured, else fall back to a task
        const status = await AIService.getStatus()
        if (status.configured) {
          const r = await AIService.quickAdd(text)
          send(res, 200, { ok: r.created, summary: r.summary })
        } else {
          await TaskService.createTask({ title: text, area: 'general', priority: 'medium' })
          send(res, 200, { ok: true, summary: `Added task “${text}”` })
        }
      }
    } catch (err) {
      send(res, 500, { error: err instanceof Error ? err.message : 'failed' })
    }
    return
  }

  send(res, 404, { error: 'not found' })
}

function pageHtml(): string {
  // Minimal mobile-first page; talks to the API with the token in the query string.
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Valute Companion</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,system-ui,sans-serif;background:#0e0e12;color:#e8e8ef;padding:16px;max-width:520px;margin:0 auto}
h1{font-size:20px;margin:8px 0 16px}
.card{background:#1a1a22;border:1px solid #2a2a36;border-radius:14px;padding:14px;margin-bottom:14px}
.timer{font-size:30px;font-weight:700;font-variant-numeric:tabular-nums}
.muted{color:#9a9ab0;font-size:13px}
input,select,button,textarea{font:inherit}
input,textarea,select{width:100%;padding:11px;border-radius:10px;border:1px solid #2a2a36;background:#13131a;color:#e8e8ef;margin-top:8px}
button{background:#6c5ce7;color:#fff;border:none;border-radius:10px;padding:11px 14px;font-weight:600;cursor:pointer}
button.sec{background:#2a2a36}
.row{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
.row button{flex:1}
.item{padding:8px 0;border-bottom:1px solid #2a2a36;font-size:14px}
.item:last-child{border:none}
</style></head><body>
<h1>⚡ Valute Companion</h1>
<div class="card">
  <div class="muted">Timer</div>
  <div class="timer" id="timer">--:--:--</div>
  <div class="muted" id="proj">No active session</div>
  <select id="projsel"></select>
  <div class="row">
    <button onclick="startTimer()">Start</button>
    <button class="sec" onclick="toggleTimer()">Pause / Resume</button>
  </div>
</div>
<div class="card">
  <div class="muted">Quick capture</div>
  <textarea id="cap" rows="2" placeholder="e.g. call dentist tomorrow 3pm"></textarea>
  <div class="row">
    <button onclick="capture('auto')">Add</button>
    <button class="sec" onclick="capture('note')">Save as note</button>
  </div>
  <div class="muted" id="capmsg"></div>
</div>
<div class="card">
  <div class="muted">Next 3 days</div>
  <div id="upcoming"></div>
</div>
<script>
const qs=new URLSearchParams(location.search);const token=qs.get('token')||'';
const api=(p,o={})=>fetch('/api'+p+(p.includes('?')?'&':'?')+'token='+token,o).then(r=>r.json());
function fmt(s){s=Math.max(0,s|0);const h=(s/3600|0),m=(s%3600/60|0),x=s%60;const p=n=>String(n).padStart(2,'0');return p(h)+':'+p(m)+':'+p(x)}
let projects=[];
async function refresh(){try{const d=await api('/state');
 document.getElementById('timer').textContent=fmt(d.timer.elapsedSeconds);
 document.getElementById('proj').textContent=d.timer.isRunning?('Running · '+(d.timer.currentProjectName||'')):'No active session';
 if(JSON.stringify(projects)!==JSON.stringify(d.projects)){projects=d.projects;const sel=document.getElementById('projsel');sel.innerHTML=projects.map(p=>'<option value="'+p.id+'">'+p.name+'</option>').join('')}
 document.getElementById('upcoming').innerHTML=d.upcoming.length?d.upcoming.map(u=>'<div class="item">'+u.date.slice(0,10)+' · '+u.title+' <span class="muted">('+u.source+')</span></div>').join(''):'<div class="muted">Nothing scheduled</div>';
}catch(e){}}
async function startTimer(){const id=document.getElementById('projsel').value;if(!id)return;await api('/timer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start',projectId:id})});refresh()}
async function toggleTimer(){await api('/timer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'toggle'})});refresh()}
async function capture(kind){const t=document.getElementById('cap').value.trim();if(!t)return;const r=await api('/capture',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:t,kind})});document.getElementById('capmsg').textContent=r.summary||r.error||'';if(r.ok){document.getElementById('cap').value=''}refresh()}
refresh();setInterval(refresh,3000);
</script></body></html>`
}

export function getStatus(): CompanionStatus {
  return {
    running: !!server,
    port: currentPort,
    token,
    urls: server ? lanAddresses().map((ip) => `http://${ip}:${currentPort}/?token=${token}`) : []
  }
}

export async function start(port = 8723): Promise<CompanionStatus> {
  await ensureToken()
  if (server) return getStatus()
  await new Promise<void>((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      try {
        const url = new URL(req.url || '/', `http://localhost:${port}`)
        if (url.pathname.startsWith('/api/')) {
          void handleApi(req, res, url)
        } else if (url.pathname === '/' || url.pathname === '') {
          send(res, 200, pageHtml(), 'text/html; charset=utf-8')
        } else {
          send(res, 404, { error: 'not found' })
        }
      } catch (err) {
        send(res, 500, { error: err instanceof Error ? err.message : 'error' })
      }
    })
    srv.on('error', reject)
    // Bind to all interfaces so phones on the LAN can reach it.
    srv.listen(port, '0.0.0.0', () => {
      server = srv
      currentPort = port
      resolve()
    })
  })
  await setSetting('companion.enabled', JSON.stringify(true))
  return getStatus()
}

export async function stop(): Promise<CompanionStatus> {
  if (server) {
    await new Promise<void>((resolve) => server!.close(() => resolve()))
    server = null
    currentPort = 0
  }
  await setSetting('companion.enabled', JSON.stringify(false))
  return getStatus()
}

/** Start the companion automatically on launch if the user enabled it last time. */
export async function autoStartIfEnabled(): Promise<void> {
  try {
    const raw = await getSetting('companion.enabled')
    if (raw && JSON.parse(raw) === true) {
      await start()
      console.log('[Companion] auto-started:', getStatus().urls)
    }
  } catch (err) {
    console.error('[Companion] auto-start failed:', err)
  }
}

// Pauta — store v4 (modelo final: blocks com sessions, lifecycle, filtros)
// Persistido em localStorage.

const { useState, useEffect, useRef, useCallback, useMemo } = React;

const STORAGE_KEY = "pauta.v4";

// ─── HELPERS ───────────────────────────────────────────────
function pad(n) { return n < 10 ? "0" + n : "" + n; }
function fmtClock(ts) { const d = new Date(ts); return pad(d.getHours()) + ":" + pad(d.getMinutes()); }
function fmtDuration(ms, opts = {}) {
  const secs = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (opts.timer) {
    if (h > 0) return h + ":" + pad(m) + ":" + pad(s);
    return pad(m) + ":" + pad(s);
  }
  if (h > 0) return h + "h" + pad(m);
  return m + " min";
}
function dayKeyOf(ts) {
  const d = new Date(ts);
  return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate());
}
function dayKeyFromYMD(y, m, d) { return y + "-" + pad(m+1) + "-" + pad(d); }
function tsFromDayKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m-1, d).getTime();
}
function monthKeyOf(ts) {
  const d = new Date(ts);
  return d.getFullYear() + "-" + pad(d.getMonth()+1);
}
function daysInMonth(year, monthIdx /* 0-11 */) {
  return new Date(year, monthIdx + 1, 0).getDate();
}
function fmtDateLong(ts) {
  const d = new Date(ts);
  const days = ["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
  const months = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return days[d.getDay()] + ", " + d.getDate() + " " + months[d.getMonth()];
}
function fmtDateShort(ts) {
  const d = new Date(ts);
  const months = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return d.getDate() + " " + months[d.getMonth()];
}
function fmtMonthYear(ts) {
  const d = new Date(ts);
  const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  return months[d.getMonth()] + " · " + d.getFullYear();
}
function fmtMonthShort(y, m /* 0-11 */) {
  const months = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return months[m];
}
function fmtMonthLong(y, m /* 0-11 */) {
  const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  return months[m];
}
// Day count between two dayKeys (inclusive of both, used for "days observed")
function daysBetween(fromKey, toKey) {
  // Use UTC math to avoid DST-induced off-by-one (spring forward / fall back
  // makes local-midnight diffs ±1h, which Math.floor would drop a whole day).
  const [ay, am, ad] = fromKey.split("-").map(Number);
  const [by, bm, bd] = toKey.split("-").map(Number);
  const a = Date.UTC(ay, am - 1, ad);
  const b = Date.UTC(by, bm - 1, bd);
  return Math.round((b - a) / 86400000) + 1;
}
function addDaysToKey(key, n) {
  // Use UTC math so DST transitions don't cause off-by-one when stepping by 86400000ms.
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d) + n * 86400000);
  return dt.getUTCFullYear() + "-" + pad(dt.getUTCMonth() + 1) + "-" + pad(dt.getUTCDate());
}
const uid = (prefix) => prefix + Date.now() + Math.floor(Math.random()*1000);

// ─── PREFS ──────────────────────────────────────────────────
// App-level preferences (theme, haptics, reminders, onboarding).
// Persisted with the rest of the state and carried through export/import.
function defaultPrefs() {
  return {
    lang: (typeof window !== "undefined" && window.PAUTA_LANG) || "pt", // "pt" | "en"
    theme: "auto",          // "auto" | "light" | "dark"
    haptics: true,
    onboardingSeen: false,
    reminders: {
      enabled: false,
      habitsTime: "09:00",      // daily nudge while habits are still pending
      reflectionTime: "21:30",  // evening reflection nudge
    },
  };
}
function mergePrefs(p) {
  const d = defaultPrefs();
  const out = { ...d, ...(p || {}) };
  out.reminders = { ...d.reminders, ...((p && p.reminders) || {}) };
  return out;
}

// Quarter helpers for long-term goals.
function quarterOf(ts) {
  const d = new Date(ts);
  return d.getFullYear() + "-Q" + (Math.floor(d.getMonth() / 3) + 1);
}
function quarterLabel(q) {
  const [y, qq] = q.split("-Q");
  const names = { 1: tr("Jan–Mar"), 2: tr("Abr–Jun"), 3: tr("Jul–Set"), 4: tr("Out–Dez") };
  return "Q" + qq + " " + y + " · " + names[qq];
}

// ─── SEED ───────────────────────────────────────────────
// Realistic data so the app feels lived-in on first open.
function seed() {
  const today = new Date();
  const t = (h, m) => { const d = new Date(today); d.setHours(h, m, 0, 0); return d.getTime(); };
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const y = (h, m) => { const d = new Date(yesterday); d.setHours(h, m, 0, 0); return d.getTime(); };

  // Build a sparse log of done days going back ~30 days, with given target pct,
  // and a chosen state for today.
  const habitLog = (pct, todayDone, daysBack = 30) => {
    const log = {};
    const todayKey = dayKeyOf(Date.now());
    for (let i = daysBack - 1; i >= 0; i--) {
      const k = addDaysToKey(todayKey, -i);
      if (i === 0) { if (todayDone) log[k] = 1; continue; }
      if (Math.random() < pct/100) log[k] = 1;
    }
    return log;
  };

  const ids = { briefing: "i_briefing", ler: "i_ler", emails: "i_emails" };

  return {
    today: {
      dayKey: dayKeyOf(Date.now()),
      intentions: [
        { id: ids.briefing, text: tr("Terminar a primeira versão do briefing"), done: false, createdAt: Date.now() },
        { id: ids.ler, text: tr("Ler o capítulo 4 de 'Deep Work'"), done: false, createdAt: Date.now() },
        { id: ids.emails, text: tr("Responder e-mails pendentes"), done: true, createdAt: Date.now() },
      ],
      reflection: "",
    },
    // archive of past days (intentions + reflection)
    days: (() => {
      const out = {};
      const yKey = dayKeyOf(yesterday.getTime());
      out[yKey] = {
        intentions: [
          { id: "iy_plan", text: tr("Planear a semana"), done: true, createdAt: yesterday.getTime() },
          { id: "iy_walk", text: tr("Caminhada longa"), done: true, createdAt: yesterday.getTime() },
          { id: "iy_dishes", text: tr("Ler 30 páginas"), done: false, createdAt: yesterday.getTime() },
        ],
        reflection: tr("Dia mais leve do que parecia. A caminhada desbloqueou-me a cabeça."),
      };
      // a few more sparse days
      for (let i = 2; i <= 6; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const k = dayKeyOf(d.getTime());
        if (i % 2 === 0) {
          out[k] = {
            intentions: [
              { id: "ix"+i+"_a", text: i === 4 ? tr("Acabar o esboço da apresentação") : tr("Rever notas do livro"), done: true, createdAt: d.getTime() },
              { id: "ix"+i+"_b", text: tr("Escrever durante 45 minutos"), done: i === 2, createdAt: d.getTime() },
            ],
            reflection: i === 4 ? tr("Apresentação ficou clara. Falta cortar.") : "",
          };
        }
      }
      return out;
    })(),
    // active block id — points into blocks[]
    activeId: null,
    // blocks: each can have multiple sessions (start→pause pairs)
    // status: "active" | "paused" | "done"
    blocks: [
      {
        id: "b1", title: tr("Revisar o caderno de campo"), linkedToId: null,
        sessions: [{ startedAt: t(8,15), endedAt: t(8,47), note: "" }],
        status: "done",
        reflection: tr("Achei três links entre os ensaios que não tinha visto."),
        createdAt: t(8,15),
      },
      {
        id: "b2", title: tr("Terminar a primeira versão do briefing"), linkedToId: ids.briefing,
        sessions: [
          { startedAt: t(9,5), endedAt: t(9,45), note: tr("Estruturei o esqueleto. Encalhado no tom.") },
          { startedAt: t(11,10), endedAt: t(11,55), note: "" },
        ],
        status: "paused",
        reflection: "",
        createdAt: t(9,5),
      },
      {
        id: "b3", title: tr("Responder e-mails pendentes"), linkedToId: ids.emails,
        sessions: [{ startedAt: t(10,0), endedAt: t(10,30), note: "" }],
        status: "done",
        reflection: tr("Feito até 14:00. Inbox em 4."),
        createdAt: t(10,0),
      },
      // yesterday
      {
        id: "by1", title: tr("Planear a semana"), linkedToId: null,
        sessions: [{ startedAt: y(9,0), endedAt: y(9,40), note: "" }],
        status: "done",
        reflection: tr("Defini três objetivos. O da escrita é o mais difícil de partir em passos concretos."),
        createdAt: y(9,0),
      },
      {
        id: "by2", title: tr("Caminhada longa"), linkedToId: null,
        sessions: [{ startedAt: y(12,0), endedAt: y(12,55), note: "" }],
        status: "done",
        reflection: tr("Ouvi um podcast sobre arquitetura. Anotei uma ideia."),
        createdAt: y(12,0),
      },
      // sparse past days (for focus chart)
      ...(() => {
        const past = [];
        for (let i = 2; i <= 13; i++) {
          if (i % 2 === 0 || i === 5 || i === 9) {
            const d = new Date(); d.setDate(d.getDate() - i); d.setHours(10, 0, 0, 0);
            const dur = (25 + (i * 7) % 50) * 60 * 1000;
            past.push({
              id: "bp" + i, title: i % 3 === 0 ? tr("Escrita focada") : (i % 2 === 0 ? tr("Leitura") : tr("Trabalho profundo")),
              linkedToId: null,
              sessions: [{ startedAt: d.getTime(), endedAt: d.getTime() + dur, note: "" }],
              status: "done",
              reflection: "",
              createdAt: d.getTime(),
            });
            if (i % 4 === 0) {
              const d2 = new Date(d); d2.setHours(15, 0, 0, 0);
              const dur2 = 40 * 60 * 1000;
              past.push({
                id: "bp" + i + "b", title: tr("Sessão da tarde"), linkedToId: null,
                sessions: [{ startedAt: d2.getTime(), endedAt: d2.getTime() + dur2, note: "" }],
                status: "done",
                reflection: "",
                createdAt: d2.getTime(),
              });
            }
          }
        }
        return past;
      })(),
    ],
    habits: [
      // mature habits (60+ days old)
      { id: "h1", name: tr("Caminhada"), time: tr("manhã"), description: "",
        recurrence: "forever", endsAt: null,
        log: habitLog(87, false, 60), respiros: {},
        createdAt: Date.now() - 60*86400000 },
      { id: "h2", name: tr("Leitura"), time: tr("antes de dormir"), description: "",
        recurrence: "forever", endsAt: null,
        log: habitLog(90, true, 60), respiros: {},
        createdAt: Date.now() - 60*86400000 },
      { id: "h3", name: tr("Sem telemóvel após 22h"), time: tr("noite"), description: "",
        recurrence: "forever", endsAt: null,
        log: habitLog(57, false, 45), respiros: {},
        createdAt: Date.now() - 45*86400000 },
      { id: "h4", name: tr("Beber 2L de água"), time: tr("ao longo do dia"), description: "",
        recurrence: "forever", endsAt: null,
        log: habitLog(87, true, 90), respiros: {},
        createdAt: Date.now() - 90*86400000 },
      // young habit — shows justice rule (dia X/7, doesn't enter overall)
      { id: "h5", name: tr("Diário"), time: tr("antes de dormir"), description: "",
        recurrence: "forever", endsAt: null,
        log: habitLog(75, false, 4), respiros: {},
        createdAt: Date.now() - 4*86400000 },
    ],
    goals: [
      { id: "g1", text: tr("Terminar o primeiro rascunho do livro"), quarter: quarterOf(Date.now()), done: false, createdAt: Date.now() - 20*86400000 },
      { id: "g2", text: tr("Correr uma meia-maratona"), quarter: quarterOf(Date.now()), done: false, createdAt: Date.now() - 10*86400000 },
    ],
    prefs: defaultPrefs(),
  };
}

// ─── LOAD/SAVE ──────────────────────────────────────────────
// Migrate old habit schema (data: Array(30)) to new (log: { dayKey: 1 }).
// The old array was rolling: index 29 = today, 28 = yesterday, ..., 0 = 29 days ago.
function migrateHabit(h, todayTs = Date.now()) {
  let out = h;
  if (Array.isArray(h.data) && !h.log) {
    const log = {};
    const todayKey = dayKeyOf(todayTs);
    const len = h.data.length;
    for (let i = 0; i < len; i++) {
      if (h.data[i]) {
        const offset = (len - 1) - i;
        const k = addDaysToKey(todayKey, -offset);
        log[k] = 1;
      }
    }
    const { data, ...rest } = h;
    out = { ...rest, log };
  }
  // Defaults for new fields
  if (!out.log) out.log = {};
  if (!out.respiros) out.respiros = {};
  if (!out.recurrence) out.recurrence = "forever";
  if (!("endsAt" in out)) out.endsAt = null;
  if (!("description" in out)) out.description = "";
  // Countable habits: target per day + unit + per-day counts (sparse).
  if (!("target" in out)) out.target = null;
  if (!("unit" in out)) out.unit = "";
  if (!out.counts) out.counts = {};
  // Real preferred clock time (HH:MM), used for reminders/sorting. `time` stays free text.
  if (!("clock" in out)) out.clock = "";
  return out;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return window.PAUTA_CLEAN_START ? emptyState() : seed();
    const s = JSON.parse(raw);
    if (!s.days) s.days = {};
    const todayKey = dayKeyOf(Date.now());
    if (!s.today || s.today.dayKey !== todayKey) {
      // Archive the old day if it had any content
      if (s.today && s.today.dayKey && (
        (s.today.intentions && s.today.intentions.length > 0) ||
        (s.today.reflection && s.today.reflection.trim())
      )) {
        s.days[s.today.dayKey] = {
          intentions: s.today.intentions || [],
          reflection: s.today.reflection || "",
        };
      }
      s.today = { dayKey: todayKey, intentions: [], reflection: "" };
    }
    // Migrate habits to new schema
    if (Array.isArray(s.habits)) s.habits = s.habits.map(h => migrateHabit(h));
    if (!Array.isArray(s.goals)) s.goals = [];
    s.prefs = mergePrefs(s.prefs);
    return s;
  } catch (e) { return window.PAUTA_CLEAN_START ? emptyState() : seed(); }
}

function emptyState() {
  return {
    today: { dayKey: dayKeyOf(Date.now()), intentions: [], reflection: "" },
    days: {},
    activeId: null,
    blocks: [],
    habits: [],
    goals: [],
    prefs: defaultPrefs(),
  };
}
function saveState(s) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {} }

// ─── EXPORT / IMPORT ───────────────────────────────────────
// Backup file shape: { app:"pauta", version, exportedAt, data:<state> }.
const EXPORT_VERSION = 4;

function downloadJSON(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Rebuild a clean, current-day-normalized state from an imported object.
// Accepts either a raw state object or the wrapped backup file's `.data`.
function normalizeImported(s) {
  const todayKey = dayKeyOf(Date.now());
  const days = (s.days && typeof s.days === "object") ? { ...s.days } : {};
  let today = (s.today && s.today.dayKey)
    ? { dayKey: s.today.dayKey, intentions: s.today.intentions || [], reflection: s.today.reflection || "" }
    : { dayKey: todayKey, intentions: [], reflection: "" };
  if (today.dayKey !== todayKey) {
    if ((today.intentions && today.intentions.length > 0) || (today.reflection && today.reflection.trim())) {
      days[today.dayKey] = { intentions: today.intentions, reflection: today.reflection };
    }
    today = { dayKey: todayKey, intentions: [], reflection: "" };
  }
  const blocks = Array.isArray(s.blocks) ? s.blocks : [];
  const habits = Array.isArray(s.habits) ? s.habits.map(h => migrateHabit(h)) : [];
  const goals = Array.isArray(s.goals) ? s.goals : [];
  const prefs = mergePrefs(s.prefs);
  const activeId = blocks.some(b => b.id === s.activeId) ? s.activeId : null;
  return { today, days, activeId, blocks, habits, goals, prefs };
}

// Parse + validate backup text. Returns the normalized state or throws.
function parseBackup(text) {
  const parsed = JSON.parse(text);
  const incoming = (parsed && parsed.app === "pauta" && parsed.data) ? parsed.data : parsed;
  if (!incoming || typeof incoming !== "object") {
    throw new Error(tr("Ficheiro vazio ou inválido."));
  }
  const looksLikePauta = ("blocks" in incoming) || ("habits" in incoming) || ("today" in incoming);
  if (!looksLikePauta) {
    throw new Error(tr("Isto não parece um backup do Pauta."));
  }
  return normalizeImported(incoming);
}

// ─── DERIVED ──────────────────────────────────────────────
// Build a timeline (sorted events) from blocks
// Each event: { kind: "start"|"pause"|"resume"|"conclude", time, blockId, sessionIdx, block }
function buildTimeline(blocks, dayKey) {
  const events = [];
  for (const b of blocks) {
    b.sessions.forEach((seg, i) => {
      events.push({ kind: i === 0 ? "start" : "resume", time: seg.startedAt, blockId: b.id, sessionIdx: i, block: b, segment: seg });
      if (seg.endedAt) {
        const isLast = i === b.sessions.length - 1;
        const kind = isLast && b.status === "done" ? "conclude" : "pause";
        events.push({ kind, time: seg.endedAt, blockId: b.id, sessionIdx: i, block: b, segment: seg });
      }
    });
  }
  let filtered = events;
  if (dayKey) filtered = events.filter(e => dayKeyOf(e.time) === dayKey);
  filtered.sort((a, b) => a.time - b.time);
  return filtered;
}

function blockFocusMs(b, now = Date.now()) {
  return b.sessions.reduce((acc, seg) => acc + ((seg.endedAt || now) - seg.startedAt), 0);
}

// Focus ms across all blocks for a given dayKey (segments scoped to that day).
function dailyFocusMs(blocks, dayKey, now = Date.now()) {
  let ms = 0;
  for (const b of blocks) {
    for (const seg of b.sessions) {
      if (dayKeyOf(seg.startedAt) === dayKey) {
        ms += (seg.endedAt || now) - seg.startedAt;
      }
    }
  }
  return ms;
}

// Count distinct blocks that have at least one segment on a given day.
function dailyBlockCount(blocks, dayKey) {
  const ids = new Set();
  for (const b of blocks) {
    for (const seg of b.sessions) {
      if (dayKeyOf(seg.startedAt) === dayKey) { ids.add(b.id); break; }
    }
  }
  return ids.size;
}

// All dayKeys with blocks (timeline activity), newest first.
function blocksAllDays(blocks) {
  const set = new Set();
  for (const b of blocks) {
    for (const seg of b.sessions) set.add(dayKeyOf(seg.startedAt));
  }
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

// All archived day keys with content, newest first.
function pastDayKeys(state) {
  const days = state.days || {};
  return Object.keys(days)
    .filter(k => {
      const d = days[k];
      return (d.intentions && d.intentions.length > 0) || (d.reflection && d.reflection.trim());
    })
    .sort((a, b) => b.localeCompare(a));
}

// ─── HABIT STATS ───────────────────────────────────────────
// Habit model:
//   { id, name, time, description, createdAt,
//     recurrence: "forever" | "period" | "month",
//     endsAt: <ts | null>,  // for "period"
//     log: { 'YYYY-MM-DD': 1 },        // sparse: only done days
//     respiros: { 'YYYY-MM-DD': { reason, at } }  // sparse: only respiro days
//   }
//
// Conta para % :  pct = feitos / (observados − respiros)
// Conta para streak :  feito OU respiro continua. Não-feito (em janela activa) quebra.
const HABIT_MATURITY_DAYS = 7;

function habitCreatedKey(h) { return dayKeyOf(h.createdAt); }

// Last active day for non-recurring habits.
function habitEndKey(h) {
  if (!h) return null;
  if (h.recurrence === "month") {
    const d = new Date(h.createdAt);
    return dayKeyFromYMD(d.getFullYear(), d.getMonth(), daysInMonth(d.getFullYear(), d.getMonth()));
  }
  if (h.recurrence === "period" && h.endsAt) {
    return dayKeyOf(h.endsAt);
  }
  return null;  // "forever"
}

function habitIsActiveOn(h, dayKey) {
  const created = habitCreatedKey(h);
  if (dayKey < created) return false;
  const end = habitEndKey(h);
  if (end && dayKey > end) return false;
  return true;
}

// Has the habit's window already closed (period over / month-only past)?
function habitHasFinished(h, todayTs = Date.now()) {
  const end = habitEndKey(h);
  if (!end) return false;
  return end < dayKeyOf(todayTs);
}

// For a given month, return the range of dayKeys [start, end] this habit
// "observes". Returns null if habit didn't exist in this month at all.
function habitObservedRangeInMonth(h, year, monthIdx, todayTs = Date.now()) {
  const monthStart = dayKeyFromYMD(year, monthIdx, 1);
  const monthEnd = dayKeyFromYMD(year, monthIdx, daysInMonth(year, monthIdx));
  const todayKey = dayKeyOf(todayTs);
  const createdKey = habitCreatedKey(h);
  const habitEnd = habitEndKey(h);
  // Effective window: max(monthStart, createdKey) .. min(monthEnd, todayKey, habitEnd?)
  const start = createdKey > monthStart ? createdKey : monthStart;
  let end = monthEnd < todayKey ? monthEnd : todayKey;
  if (habitEnd && habitEnd < end) end = habitEnd;
  if (start > end) return null;
  return { start, end };
}
function habitDaysObservedInMonth(h, year, monthIdx, todayTs = Date.now()) {
  const r = habitObservedRangeInMonth(h, year, monthIdx, todayTs);
  if (!r) return 0;
  return daysBetween(r.start, r.end);
}
function habitRespirosInMonth(h, year, monthIdx, todayTs = Date.now()) {
  const r = habitObservedRangeInMonth(h, year, monthIdx, todayTs);
  if (!r || !h.respiros) return 0;
  let count = 0;
  let k = r.start;
  while (k <= r.end) {
    if (h.respiros[k]) count++;
    k = addDaysToKey(k, 1);
  }
  return count;
}
function habitDoneInMonth(h, year, monthIdx, todayTs = Date.now()) {
  const r = habitObservedRangeInMonth(h, year, monthIdx, todayTs);
  if (!r) return 0;
  let count = 0;
  let k = r.start;
  while (k <= r.end) {
    if (h.log && h.log[k]) count++;
    k = addDaysToKey(k, 1);
  }
  return count;
}
// Justice rule: respiros saem do denominador.
function habitPctInMonth(h, year, monthIdx, todayTs = Date.now()) {
  const obs = habitDaysObservedInMonth(h, year, monthIdx, todayTs);
  if (obs === 0) return null;
  const resp = habitRespirosInMonth(h, year, monthIdx, todayTs);
  const denom = obs - resp;
  if (denom <= 0) return null;  // tudo foi respiro
  return Math.round((habitDoneInMonth(h, year, monthIdx, todayTs) / denom) * 100);
}

// Overall %: média dos hábitos maduros (>= HABIT_MATURITY_DAYS observados, descontando respiros).
function overallPctInMonth(habits, year, monthIdx, todayTs = Date.now()) {
  const mature = habits
    .map(h => ({
      h,
      obs: habitDaysObservedInMonth(h, year, monthIdx, todayTs) - habitRespirosInMonth(h, year, monthIdx, todayTs),
      pct: habitPctInMonth(h, year, monthIdx, todayTs),
    }))
    .filter(x => x.pct !== null && x.obs >= HABIT_MATURITY_DAYS);
  if (mature.length === 0) return null;
  const sum = mature.reduce((a, x) => a + x.pct, 0);
  return Math.round(sum / mature.length);
}

// Streaks: respiros mantêm a streak. Não-feito quebra-a.
// Para hábitos não-recorrentes, considera apenas a janela activa.
function habitCurrentStreak(h, todayTs = Date.now()) {
  const todayKey = dayKeyOf(todayTs);
  const createdKey = habitCreatedKey(h);
  // Walk back from today (or habit's end, whichever is sooner)
  const habitEnd = habitEndKey(h);
  let k = habitEnd && habitEnd < todayKey ? habitEnd : todayKey;
  let streak = 0, respiros = 0;
  while (k >= createdKey) {
    if (h.log && h.log[k]) { streak++; }
    else if (h.respiros && h.respiros[k]) { streak++; respiros++; }
    else break;
    k = addDaysToKey(k, -1);
  }
  return { days: streak, respiros };
}
function habitBestStreak(h, todayTs = Date.now()) {
  const todayKey = dayKeyOf(todayTs);
  const createdKey = habitCreatedKey(h);
  const habitEnd = habitEndKey(h);
  const stopKey = habitEnd && habitEnd < todayKey ? habitEnd : todayKey;
  let best = 0, run = 0;
  let k = createdKey;
  while (k <= stopKey) {
    const done = (h.log && h.log[k]) || (h.respiros && h.respiros[k]);
    if (done) { run++; if (run > best) best = run; }
    else run = 0;
    k = addDaysToKey(k, 1);
  }
  return best;
}

function habitAllTimeStats(h, todayTs = Date.now()) {
  const todayKey = dayKeyOf(todayTs);
  const createdKey = habitCreatedKey(h);
  if (createdKey > todayKey) return { observed: 0, done: 0, respiros: 0, pct: null };
  const habitEnd = habitEndKey(h);
  const stopKey = habitEnd && habitEnd < todayKey ? habitEnd : todayKey;
  const observed = daysBetween(createdKey, stopKey);
  let done = 0, respiros = 0;
  let k = createdKey;
  while (k <= stopKey) {
    if (h.log && h.log[k]) done++;
    else if (h.respiros && h.respiros[k]) respiros++;
    k = addDaysToKey(k, 1);
  }
  const denom = observed - respiros;
  return { observed, done, respiros, pct: denom > 0 ? Math.round((done/denom)*100) : null };
}

// Streak tier (Onda → Oceano). Names/subtitles are stored in Portuguese (source)
// and translated at access time via trTier() so they follow live language switches.
const TIDE_TIERS = [
  { min: 360, name: "Oceano", subtitle: "já não é uma maré" },
  { min: 240, name: "Maré anual", subtitle: "quase um ano de constância" },
  { min: 120, name: "Maré viva", subtitle: "a mais forte do mês" },
  { min: 60,  name: "Maré alta", subtitle: "a corrente é forte" },
  { min: 30,  name: "Maré média", subtitle: "a corrente assentou" },
  { min: 7,   name: "Maré baixa", subtitle: "a água começou a subir" },
  { min: 1,   name: "Onda",       subtitle: "primeira agitação" },
];
// Translate a tier/level entry's display fields at render time.
function trTier(t) { return t ? { ...t, name: tr(t.name), subtitle: tr(t.subtitle) } : t; }
function tideTier(days) {
  if (days <= 0) return null;
  for (const t of TIDE_TIERS) if (days >= t.min) {
    const idx = TIDE_TIERS.indexOf(t);
    const next = idx > 0 ? TIDE_TIERS[idx - 1] : null;
    return { ...trTier(t), next: trTier(next) };
  }
  return null;
}

// User level (Aprendiz → Almirante). Based on total "feito" days across all habits.
const NAVIGATOR_LEVELS = [
  { min: 5000, name: "Almirante", subtitle: "mestre dos mares" },
  { min: 2000, name: "Navegador", subtitle: "com N maiúsculo" },
  { min: 1000, name: "Capitão",   subtitle: "comanda a sua embarcação" },
  { min: 600,  name: "Piloto",    subtitle: "lê a água e o tempo" },
  { min: 300,  name: "Timoneiro", subtitle: "leme firme" },
  { min: 100,  name: "Marujo",    subtitle: "já é da tripulação" },
  { min: 30,   name: "Grumete",   subtitle: "aprendeu as cordas" },
  { min: 0,    name: "Aprendiz",  subtitle: "pés ainda em terra firme" },
];
function navigatorLevel(totalDoneDays) {
  for (const lvl of NAVIGATOR_LEVELS) if (totalDoneDays >= lvl.min) {
    const idx = NAVIGATOR_LEVELS.indexOf(lvl);
    const next = idx > 0 ? NAVIGATOR_LEVELS[idx - 1] : null;
    return { ...trTier(lvl), next: trTier(next) };
  }
  return trTier(NAVIGATOR_LEVELS[NAVIGATOR_LEVELS.length - 1]);
}
function totalDoneDays(habits) {
  let sum = 0;
  for (const h of habits) if (h.log) sum += Object.keys(h.log).length;
  return sum;
}

// List of all months (newest first) that have data for at least one habit.
function habitsAllMonths(habits, todayTs = Date.now()) {
  if (habits.length === 0) return [{ y: new Date(todayTs).getFullYear(), m: new Date(todayTs).getMonth() }];
  let oldest = todayTs;
  for (const h of habits) if (h.createdAt < oldest) oldest = h.createdAt;
  const list = [];
  const startD = new Date(oldest); startD.setDate(1);
  const endD = new Date(todayTs);
  let y = endD.getFullYear(), m = endD.getMonth();
  const sy = startD.getFullYear(), sm = startD.getMonth();
  while (y > sy || (y === sy && m >= sm)) {
    list.push({ y, m });
    m--; if (m < 0) { m = 11; y--; }
  }
  return list;
}

// ─── INSIGHTS ──────────────────────────────────────────────
// Focus ms bucketed by hour-of-day (0–23), splitting sessions across hour
// boundaries so a 8:45→9:30 block credits both hours fairly.
function focusByHour(blocks, now = Date.now()) {
  const hours = new Array(24).fill(0);
  for (const b of blocks) {
    for (const seg of b.sessions) {
      let start = seg.startedAt;
      const end = seg.endedAt || now;
      while (start < end) {
        const d = new Date(start);
        const hr = d.getHours();
        const nextHour = new Date(d); nextHour.setMinutes(0, 0, 0); nextHour.setHours(hr + 1);
        const sliceEnd = Math.min(end, nextHour.getTime());
        hours[hr] += sliceEnd - start;
        start = sliceEnd;
      }
    }
  }
  return hours;
}
function bestHourStats(blocks, now = Date.now()) {
  const hours = focusByHour(blocks, now);
  const total = hours.reduce((a, x) => a + x, 0);
  let peak = -1, peakMs = 0;
  hours.forEach((ms, h) => { if (ms > peakMs) { peakMs = ms; peak = h; } });
  return { hours, total, peak, peakMs };
}

// For each habit, compare average daily focus on days it was done vs days it was
// missed (within its active window, last `days` days). Surfaces "on days you walk,
// you focus +30%". Only returns habits with enough samples on both sides.
function habitFocusCorrelation(habits, blocks, days = 30, now = Date.now()) {
  const todayKey = dayKeyOf(now);
  const focusCache = {};
  const focusOn = (k) => (k in focusCache) ? focusCache[k] : (focusCache[k] = dailyFocusMs(blocks, k, now));
  const out = [];
  for (const h of habits) {
    let doneSum = 0, doneN = 0, missSum = 0, missN = 0;
    for (let i = 0; i < days; i++) {
      const k = addDaysToKey(todayKey, -i);
      if (!habitIsActiveOn(h, k)) continue;
      if (h.respiros && h.respiros[k]) continue;       // respiros don't count either way
      const f = focusOn(k);
      if (h.log && h.log[k]) { doneSum += f; doneN++; }
      else { missSum += f; missN++; }
    }
    if (doneN >= 3 && missN >= 3) {
      const doneAvg = doneSum / doneN;
      const missAvg = missSum / missN;
      const deltaPct = missAvg > 0 ? Math.round(((doneAvg - missAvg) / missAvg) * 100)
                                   : (doneAvg > 0 ? 100 : 0);
      out.push({ id: h.id, name: h.name, doneAvg, missAvg, deltaPct, doneN, missN });
    }
  }
  out.sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct));
  return out;
}

// Summary of the 7 days ending at endKey (inclusive). Sunday-review friendly.
function weeklyReview(state, endKey = dayKeyOf(Date.now()), now = Date.now()) {
  const blocks = state.blocks || [];
  const habits = state.habits || [];
  const days = [];
  for (let i = 6; i >= 0; i--) days.push(addDaysToKey(endKey, -i));
  const startKey = days[0];

  let focusMs = 0, activeDays = 0, topKey = null, topMs = 0;
  for (const k of days) {
    const f = dailyFocusMs(blocks, k, now);
    focusMs += f;
    if (f > 0) activeDays++;
    if (f > topMs) { topMs = f; topKey = k; }
  }
  const blockIds = new Set();
  for (const b of blocks) for (const seg of b.sessions) {
    const k = dayKeyOf(seg.startedAt);
    if (k >= startKey && k <= endKey) { blockIds.add(b.id); break; }
  }

  // Intentions across the week (archived days + live today).
  let intTotal = 0, intDone = 0;
  for (const k of days) {
    let day = null;
    if (state.today && state.today.dayKey === k) day = state.today;
    else if (state.days && state.days[k]) day = state.days[k];
    if (day && day.intentions) { intTotal += day.intentions.length; intDone += day.intentions.filter(i => i.done).length; }
  }

  // Habits: done-day count + how many distinct habits were active.
  let habitDone = 0, habitObservedSlots = 0, respiros = 0;
  for (const h of habits) {
    for (const k of days) {
      if (!habitIsActiveOn(h, k)) continue;
      habitObservedSlots++;
      if (h.log && h.log[k]) habitDone++;
      else if (h.respiros && h.respiros[k]) respiros++;
    }
  }
  const habitPct = (habitObservedSlots - respiros) > 0
    ? Math.round((habitDone / (habitObservedSlots - respiros)) * 100) : null;

  // Reflections written this week.
  let reflections = 0;
  for (const k of days) {
    let day = null;
    if (state.today && state.today.dayKey === k) day = state.today;
    else if (state.days && state.days[k]) day = state.days[k];
    if (day && day.reflection && day.reflection.trim()) reflections++;
  }

  return {
    startKey, endKey, days,
    focusMs, activeDays, blockCount: blockIds.size, topKey, topMs,
    intTotal, intDone,
    habitDone, habitObservedSlots, respiros, habitPct,
    reflections,
  };
}

// ─── HOOK ────────────────────────────────────────────────
function useStore() {
  const [state, setState] = useState(loadState);
  useEffect(() => { saveState(state); }, [state]);

  const activeBlock = useMemo(() =>
    state.activeId ? state.blocks.find(b => b.id === state.activeId) : null,
    [state.activeId, state.blocks]);

  // ─ Hoje ─
  const addIntention = (text) => {
    const t = (text || "").trim(); if (!t) return null;
    const id = uid("i_");
    setState(s => ({ ...s, today: { ...s.today, intentions: [...s.today.intentions, { id, text: t, done: false, createdAt: Date.now() }] } }));
    return id;
  };
  const updateIntention = (id, patch) => setState(s => ({
    ...s, today: { ...s.today, intentions: s.today.intentions.map(i => i.id === id ? { ...i, ...patch } : i) }
  }));
  const removeIntention = (id) => setState(s => ({
    ...s, today: { ...s.today, intentions: s.today.intentions.filter(i => i.id !== id) }
  }));
  const toggleIntention = (id) => setState(s => ({
    ...s, today: { ...s.today, intentions: s.today.intentions.map(i => i.id === id ? { ...i, done: !i.done } : i) }
  }));
  const setReflection = (text) => setState(s => ({ ...s, today: { ...s.today, reflection: text } }));

  // ─ Pauta ─
  const startBlock = (title, linkedToId = null, opts = {}) => {
    const t = (title || "").trim(); if (!t) return null;
    const id = uid("b_");
    const project = (opts.project || "").trim() || null;
    setState(s => ({
      ...s,
      activeId: id,
      blocks: [...s.blocks, {
        id, title: t, linkedToId, project,
        sessions: [{ startedAt: Date.now(), endedAt: null, note: "" }],
        status: "active",
        reflection: "",
        createdAt: Date.now(),
      }],
    }));
    return id;
  };

  // Pause the active block (end the current session, set status=paused)
  const pauseActive = (note = "") => {
    setState(s => {
      if (!s.activeId) return s;
      const blocks = s.blocks.map(b => {
        if (b.id !== s.activeId) return b;
        const sessions = b.sessions.map((seg, i, arr) =>
          i === arr.length - 1 ? { ...seg, endedAt: Date.now(), note: (note || "").trim() } : seg);
        return { ...b, sessions, status: "paused" };
      });
      return { ...s, activeId: null, blocks };
    });
  };

  // Resume a paused block (add new session, set status=active)
  const resumeBlock = (blockId) => {
    setState(s => {
      // Auto-pause anything else active
      let blocks = s.blocks;
      if (s.activeId && s.activeId !== blockId) {
        blocks = blocks.map(b => b.id === s.activeId ? {
          ...b,
          sessions: b.sessions.map((seg, i, arr) => i === arr.length - 1 ? { ...seg, endedAt: Date.now() } : seg),
          status: "paused",
        } : b);
      }
      blocks = blocks.map(b => b.id === blockId ? {
        ...b,
        sessions: [...b.sessions, { startedAt: Date.now(), endedAt: null, note: "" }],
        status: "active",
      } : b);
      return { ...s, activeId: blockId, blocks };
    });
  };

  // Conclude active block with final reflection, optionally marking linked intention done
  const concludeActive = (reflection, opts = {}) => {
    setState(s => {
      if (!s.activeId) return s;
      const blocks = s.blocks.map(b => {
        if (b.id !== s.activeId) return b;
        const sessions = b.sessions.map((seg, i, arr) =>
          i === arr.length - 1 ? { ...seg, endedAt: Date.now() } : seg);
        return { ...b, sessions, status: "done", reflection: (reflection || "").trim() };
      });
      const concluded = blocks.find(b => b.id === s.activeId);
      let today = s.today;
      if (opts.markIntentionDone && concluded && concluded.linkedToId) {
        today = { ...today, intentions: today.intentions.map(i => i.id === concluded.linkedToId ? { ...i, done: true } : i) };
      }
      return { ...s, activeId: null, blocks, today };
    });
  };

  // Conclude a paused (non-active) block with final reflection
  const concludeBlock = (blockId, reflection, opts = {}) => {
    setState(s => {
      const blocks = s.blocks.map(b => b.id === blockId ? { ...b, status: "done", reflection: (reflection || "").trim() } : b);
      const concluded = blocks.find(b => b.id === blockId);
      let today = s.today;
      if (opts.markIntentionDone && concluded && concluded.linkedToId) {
        today = { ...today, intentions: today.intentions.map(i => i.id === concluded.linkedToId ? { ...i, done: true } : i) };
      }
      return { ...s, blocks, today };
    });
  };

  const updateBlock = (id, patch) => setState(s => ({ ...s, blocks: s.blocks.map(b => b.id === id ? { ...b, ...patch } : b) }));
  const updateSessionNote = (blockId, sessionIdx, note) => setState(s => ({
    ...s, blocks: s.blocks.map(b => b.id === blockId ? {
      ...b, sessions: b.sessions.map((sg, i) => i === sessionIdx ? { ...sg, note } : sg),
    } : b)
  }));
  const deleteBlock = (id) => setState(s => ({ ...s, blocks: s.blocks.filter(b => b.id !== id), activeId: s.activeId === id ? null : s.activeId }));

  // ─ Marés ─
  // Toggle a specific day's "done" state. No-op if outside habit window.
  // Also clears any respiro on that day (a day can't be both done and respiro).
  const toggleHabitDay = (id, dayKey) => setState(s => ({
    ...s, habits: s.habits.map(h => {
      if (h.id !== id) return h;
      if (!habitIsActiveOn(h, dayKey)) return h;
      if (dayKey > dayKeyOf(Date.now())) return h;  // can't mark future
      const log = { ...(h.log || {}) };
      const respiros = { ...(h.respiros || {}) };
      if (log[dayKey]) {
        delete log[dayKey];
      } else {
        log[dayKey] = 1;
        delete respiros[dayKey];  // toggling on → clear any respiro
      }
      return { ...h, log, respiros };
    })
  }));
  const toggleHabitToday = (id) => toggleHabitDay(id, dayKeyOf(Date.now()));

  // Mark a day as respiro (with optional reason). Clears any "done" mark.
  const markRespiro = (id, dayKey, reason = "") => setState(s => ({
    ...s, habits: s.habits.map(h => {
      if (h.id !== id) return h;
      if (!habitIsActiveOn(h, dayKey)) return h;
      if (dayKey > dayKeyOf(Date.now())) return h;
      const log = { ...(h.log || {}) }; delete log[dayKey];
      const respiros = { ...(h.respiros || {}), [dayKey]: { reason: (reason || "").trim(), at: Date.now() } };
      return { ...h, log, respiros };
    })
  }));
  const unmarkRespiro = (id, dayKey) => setState(s => ({
    ...s, habits: s.habits.map(h => {
      if (h.id !== id) return h;
      const respiros = { ...(h.respiros || {}) }; delete respiros[dayKey];
      return { ...h, respiros };
    })
  }));

  const addHabit = (name, time, opts = {}) => {
    const id = uid("h_");
    const target = opts.target != null && opts.target > 1 ? Math.round(opts.target) : null;
    setState(s => ({
      ...s, habits: [...s.habits, {
        id, name: name.trim(), time: (time || "").trim(),
        description: (opts.description || "").trim(),
        recurrence: opts.recurrence || "forever",
        endsAt: opts.endsAt || null,
        target, unit: (opts.unit || "").trim(),
        clock: (opts.clock || "").trim(),
        log: {}, respiros: {}, counts: {},
        createdAt: Date.now(),
      }]
    }));
    return id;
  };
  const removeHabit = (id) => setState(s => ({ ...s, habits: s.habits.filter(h => h.id !== id) }));
  const updateHabit = (id, patch) => setState(s => ({ ...s, habits: s.habits.map(h => h.id === id ? { ...h, ...patch } : h) }));

  // Countable habits: set the count for a day. Auto-syncs the binary `log`
  // (done when count >= target) so all existing stats/streaks keep working.
  const setHabitCount = (id, dayKey, n) => setState(s => ({
    ...s, habits: s.habits.map(h => {
      if (h.id !== id) return h;
      if (!habitIsActiveOn(h, dayKey)) return h;
      if (dayKey > dayKeyOf(Date.now())) return h;
      const target = h.target || 1;
      const count = Math.max(0, Math.round(n));
      const counts = { ...(h.counts || {}) };
      const log = { ...(h.log || {}) };
      const respiros = { ...(h.respiros || {}) };
      if (count <= 0) { delete counts[dayKey]; delete log[dayKey]; }
      else {
        counts[dayKey] = count;
        if (count >= target) { log[dayKey] = 1; delete respiros[dayKey]; }
        else delete log[dayKey];
      }
      return { ...h, counts, log, respiros };
    })
  }));
  const incHabitDay = (id, dayKey, delta = 1) => setState(s => ({
    ...s, habits: s.habits.map(h => {
      if (h.id !== id) return h;
      if (!habitIsActiveOn(h, dayKey)) return h;
      if (dayKey > dayKeyOf(Date.now())) return h;
      const target = h.target || 1;
      const cur = (h.counts && h.counts[dayKey]) || 0;
      let next = cur + delta;
      if (next > target) next = 0;       // tapping past target cycles back to 0
      if (next < 0) next = 0;
      const counts = { ...(h.counts || {}) };
      const log = { ...(h.log || {}) };
      const respiros = { ...(h.respiros || {}) };
      if (next <= 0) { delete counts[dayKey]; delete log[dayKey]; }
      else {
        counts[dayKey] = next;
        if (next >= target) { log[dayKey] = 1; delete respiros[dayKey]; }
        else delete log[dayKey];
      }
      return { ...h, counts, log, respiros };
    })
  }));

  // ─ Prefs ─
  const setPref = (key, value) => setState(s => ({ ...s, prefs: { ...mergePrefs(s.prefs), [key]: value } }));
  const setReminderPref = (key, value) => setState(s => {
    const prefs = mergePrefs(s.prefs);
    return { ...s, prefs: { ...prefs, reminders: { ...prefs.reminders, [key]: value } } };
  });

  // ─ Goals (long-term / quarterly) ─
  const addGoal = (text, quarter) => {
    const t = (text || "").trim(); if (!t) return null;
    const id = uid("g_");
    setState(s => ({ ...s, goals: [...(s.goals || []), { id, text: t, quarter: quarter || quarterOf(Date.now()), done: false, createdAt: Date.now() }] }));
    return id;
  };
  const updateGoal = (id, patch) => setState(s => ({ ...s, goals: (s.goals || []).map(g => g.id === id ? { ...g, ...patch } : g) }));
  const toggleGoal = (id) => setState(s => ({ ...s, goals: (s.goals || []).map(g => g.id === id ? { ...g, done: !g.done } : g) }));
  const removeGoal = (id) => setState(s => ({ ...s, goals: (s.goals || []).filter(g => g.id !== id) }));

  const resetAll = () => {
    if (confirm(tr("Apagar tudo e recomeçar? Isto não pode ser desfeito."))) {
      setState(s => ({
        ...emptyState(),
        prefs: s.prefs,  // keep theme/haptics/reminders prefs across a reset
      }));
    }
  };

  const reseed = () => {
    if (confirm(tr("Recarregar dados de exemplo? Isto apaga o que tem agora."))) {
      setState(seed());
    }
  };

  // ─ Backup ─
  const exportData = () => {
    const stamp = dayKeyOf(Date.now());
    downloadJSON(`pauta-backup-${stamp}.json`, {
      app: "pauta",
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      data: state,
    });
  };
  // Returns { ok } or { ok:false, error }. Caller confirms the overwrite.
  const importData = (text) => {
    try {
      const next = parseBackup(text);
      setState(next);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || tr("Não foi possível ler o ficheiro.") };
    }
  };

  return {
    state, activeBlock,
    // hoje
    addIntention, updateIntention, removeIntention, toggleIntention, setReflection,
    // pauta
    startBlock, pauseActive, resumeBlock, concludeActive, concludeBlock,
    updateBlock, updateSessionNote, deleteBlock,
    // marés
    toggleHabitToday, toggleHabitDay, markRespiro, unmarkRespiro,
    addHabit, removeHabit, updateHabit, setHabitCount, incHabitDay,
    // prefs
    setPref, setReminderPref,
    // goals
    addGoal, updateGoal, toggleGoal, removeGoal,
    // misc
    resetAll, reseed,
    // backup
    exportData, importData,
  };
}

function useNow(intervalMs = 1000, enabled = true) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
  return now;
}

Object.assign(window, {
  useStore, useNow,
  fmtClock, fmtDuration, fmtDateLong, fmtDateShort, fmtMonthYear, fmtMonthShort, fmtMonthLong,
  dayKeyOf, dayKeyFromYMD, tsFromDayKey, monthKeyOf, daysInMonth, daysBetween, addDaysToKey,
  pad, uid,
  buildTimeline, blockFocusMs, dailyFocusMs, dailyBlockCount, blocksAllDays, pastDayKeys,
  // prefs / goals / insights
  defaultPrefs, mergePrefs, quarterOf, quarterLabel,
  focusByHour, bestHourStats, habitFocusCorrelation, weeklyReview,
  // habit stats
  HABIT_MATURITY_DAYS, TIDE_TIERS, NAVIGATOR_LEVELS,
  habitCreatedKey, habitEndKey, habitIsActiveOn, habitHasFinished,
  habitObservedRangeInMonth, habitDaysObservedInMonth, habitRespirosInMonth, habitDoneInMonth,
  habitPctInMonth, overallPctInMonth, habitCurrentStreak, habitBestStreak, habitAllTimeStats,
  habitsAllMonths, tideTier, navigatorLevel, totalDoneDays,
});

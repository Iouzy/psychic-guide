// Dev-only: numerically verify the cadence stat helpers by loading the
// Babel-transformed store.jsx into a VM sandbox (React / tr stubbed). The app
// has no test runner, so this is a focused smoke test for the date math.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const Babel = require("../vendor/babel.min.js");

const src = readFileSync(new URL("../src/store.jsx", import.meta.url), "utf8");
const { code } = Babel.transform(src, { presets: ["react"], filename: "store.jsx" });

const noop = () => {};
const win = {};
const ctx = {
  React: { useState: noop, useEffect: noop, useRef: noop, useCallback: noop, useMemo: noop },
  window: win,
  tr: (s) => s, trf: (s) => s,
  localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  navigator: { language: "pt" },
  console, Date, Math, JSON, Object, Array,
};
vm.createContext(ctx);
vm.runInContext(code, ctx);
const W = win; // helpers were Object.assign'd onto window

let fails = 0;
function eq(label, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fails++; console.error(`FAIL ${label}\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`); }
  else console.log(`ok   ${label} = ${JSON.stringify(got)}`);
}

// May 2025: 5/5,12,19,26 are Mondays; 5/4,11,18,25 Sundays.
eq("weekStartKey(Wed 5/14)", W.weekStartKey("2025-05-14"), "2025-05-12");
eq("weekEndKey(Wed 5/14)", W.weekEndKey("2025-05-14"), "2025-05-18");

const weeklySun = { cadence: "weekly", anchor: 0, log: {}, respiros: {} };
eq("anchorDay weekly Sun on 5/18(Sun)", W.habitIsAnchorDay(weeklySun, "2025-05-18"), true);
eq("anchorDay weekly Sun on 5/14(Wed)", W.habitIsAnchorDay(weeklySun, "2025-05-14"), false);

const monthly31 = { cadence: "monthly", anchor: 31, log: {}, respiros: {} };
eq("anchorDay monthly 31 clamps to Apr 30", W.habitIsAnchorDay(monthly31, "2025-04-30"), true);
eq("anchorDay monthly 31 on May 31", W.habitIsAnchorDay(monthly31, "2025-05-31"), true);

// periodMark: any day in the week reflects the week's completion.
const wk = { cadence: "weekly", anchor: null, log: { "2025-05-13": 1 }, respiros: {} };
eq("periodMark Sun 5/18 sees Tue 5/13 done", W.habitPeriodMark(wk, "2025-05-18"), { kind: "done", key: "2025-05-13" });
eq("periodMark prior week empty", W.habitPeriodMark(wk, "2025-05-07"), { kind: null, key: null });

// periodStats over two weeks, one done.
eq("periodStats weekly 2 weeks 1 done",
  W.habitPeriodStats({ cadence: "weekly", anchor: null, log: { "2025-05-14": 1 }, respiros: {} }, "2025-05-05", "2025-05-18"),
  { observed: 2, done: 1, respiros: 0 });

// current streak weekly: 3 consecutive weeks incl. current → units 3, days 21.
const s3 = W.habitCurrentStreak(
  { cadence: "weekly", anchor: null, createdAt: W.tsFromDayKey("2025-04-01"),
    log: { "2025-05-21": 1, "2025-05-14": 1, "2025-05-07": 1 }, respiros: {} },
  W.tsFromDayKey("2025-05-22"));
eq("currentStreak weekly 3 incl current", { units: s3.units, days: s3.days }, { units: 3, days: 21 });

// current week empty must not break the streak (still in progress).
const s2 = W.habitCurrentStreak(
  { cadence: "weekly", anchor: null, createdAt: W.tsFromDayKey("2025-04-01"),
    log: { "2025-05-14": 1, "2025-05-07": 1 }, respiros: {} },
  W.tsFromDayKey("2025-05-22"));
eq("currentStreak weekly 2 (current week empty)", { units: s2.units }, { units: 2 });

// a missed past week breaks it.
const s1 = W.habitCurrentStreak(
  { cadence: "weekly", anchor: null, createdAt: W.tsFromDayKey("2025-04-01"),
    log: { "2025-05-14": 1 }, respiros: {} },  // week 5/5-11 missed
  W.tsFromDayKey("2025-05-22"));
eq("currentStreak weekly stops at gap", { units: s1.units }, { units: 1 });

// monthly all-time: Mar done, Apr none, May done → 2/3 = 67%.
const mAll = W.habitAllTimeStats(
  { cadence: "monthly", anchor: null, createdAt: W.tsFromDayKey("2025-03-10"),
    log: { "2025-03-15": 1, "2025-05-02": 1 }, respiros: {} },
  W.tsFromDayKey("2025-05-20"));
eq("monthly allTime observed/done/pct", { observed: mAll.observed, done: mAll.done, pct: mAll.pct }, { observed: 3, done: 2, pct: 67 });

// daily unchanged: 3-day streak.
const d = W.habitCurrentStreak(
  { cadence: "daily", createdAt: W.tsFromDayKey("2025-05-01"),
    log: { "2025-05-20": 1, "2025-05-19": 1, "2025-05-18": 1 }, respiros: {} },
  W.tsFromDayKey("2025-05-20"));
eq("daily streak unchanged", { days: d.days, units: d.units }, { days: 3, units: 3 });

console.log(fails ? `\n${fails} FAILED` : "\nall cadence checks passed");
process.exit(fails ? 1 : 0);

// Pauta — extras: onboarding, insights (revisão semanal, melhor hora,
// correlação, calendário), guia das marés, metas trimestrais, lembretes,
// e pequenos utilitários (háptico). Carregado antes de app.jsx.

// ─── Haptic feedback ────────────────────────────────────────
// Respeita prefs.haptics (espelhada em window.PAUTA_HAPTICS pelo App).
function haptic(ms = 10) {
  try { if (window.PAUTA_HAPTICS && navigator.vibrate) navigator.vibrate(ms); } catch (e) {}
}

// ─── Onboarding (primeira abertura) ─────────────────────────
// Tour com holofote: o overlay conduz pelas três tabs reais e, em cada uma,
// escurece tudo menos o controlo verdadeiro (o botão de adicionar intenção,
// começar um bloco, criar uma maré). O utilizador faz a ação a sério na app
// — o que cria fica guardado — e o passo conclui-se sozinho quando o store
// regista a mudança. No fim pode optar por manter o que criou ou começar do
// zero (isto também limpa a seed de demonstração).

// ─── Onboarding (welcome carousel) ──────────────────────────
// A calm, self-contained intro: a few swipeable cards covering the three tabs,
// then a choice to start blank or load an example. Deliberately NOT a live
// spotlight tour over the real UI — that approach was janky (rAF rect
// measuring, pointer-events juggling, slow keyboard) and could "lock" things.
// This is a plain overlay the user simply swipes through and dismisses.
function OnboardingOverlay({ onDone, accentColor, store }) {
  const [idx, setIdx] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const touchX = useRef(null);

  const cards = [
    { tag: tr("bem-vindo"), icon: "spark",
      title: <>{tr("Esta é a sua")} <em style={{ color: accentColor }}>{tr("pauta")}</em>.</>,
      body: tr("Um lugar calmo, privado e offline para o que importa. Sem conta, sem servidor — tudo fica no seu telemóvel.") },
    { tag: tr("hoje"), icon: "hoje",
      title: tr("Comece pelo que importa."),
      body: tr("Na tab Hoje, liste 1 a 4 intenções — as coisas que movem o seu dia — e reflita à noite.") },
    { tag: tr("pauta"), icon: "pauta",
      title: tr("Trabalhe em blocos."),
      body: tr("Na Pauta, inicie um bloco de foco e o tempo conta-se sozinho. Pause, retome e conclua quando quiser.") },
    { tag: tr("marés"), icon: "mares",
      title: tr("Cultive hábitos como marés."),
      body: tr("Nas Marés, marque hábitos dia a dia. A constância faz a maré subir — e os dias de descanso são honestos.") },
    { tag: tr("pronto"), icon: "check",
      title: <>{tr("Tudo")} <em style={{ color: accentColor }}>{tr("seu")}</em>.</>,
      body: tr("Comece com uma pauta em branco, ou explore com um exemplo. Muda tudo depois nas Definições.") },
  ];
  const last = idx === cards.length - 1;
  const card = cards[idx];

  const finish = (reset, seedExample) => {
    if (leaving) return;
    setLeaving(true);
    if (seedExample && store && store.reseed) store.reseed();
    setTimeout(() => onDone && onDone(reset), 280);
  };
  const next = () => { if (!last) { haptic(8); setIdx(i => Math.min(i + 1, cards.length - 1)); } };
  const prev = () => { if (idx > 0) setIdx(i => i - 1); };

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (dx < -45) next(); else if (dx > 45) prev();
  };

  const iconFor = (k) => {
    const map = { hoje: Icon.Hoje, pauta: Icon.Pauta, mares: Icon.Mares, check: Icon.Check };
    const Ic = map[k];
    return (
      <div style={{
        width: 64, height: 64, borderRadius: 18, marginBottom: 26,
        background: accentColor + "14", border: "1px solid " + accentColor + "33",
        color: accentColor, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {Ic ? <Ic size={30}/> : <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 36, lineHeight: 1 }}>✦</span>}
      </div>
    );
  };

  return (
    <div data-noswipe="true" style={{
      position: "absolute", inset: 0, zIndex: 500, background: "var(--paper)",
      display: "flex", flexDirection: "column", overflow: "hidden",
      animation: (leaving ? "fadeOut 0.28s ease forwards" : "fadeIn 0.3s ease"),
    }}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "calc(14px + env(safe-area-inset-top)) 22px 0", minHeight: 44 }}>
        {!last && (
          <button onClick={() => finish(false)} className="tap" style={{
            background: "transparent", border: "none", padding: "8px 4px", cursor: "pointer",
            fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "var(--ink-3)",
          }}>{tr("saltar")}</button>
        )}
      </div>

      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 34px" }}>
        <div key={idx} style={{ animation: "riseIn 0.35s ease both" }}>
          {iconFor(card.icon)}
          <div style={{
            fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.22em",
            textTransform: "uppercase", color: accentColor, marginBottom: 14,
          }}>{card.tag}</div>
          <h1 style={{
            fontFamily: "var(--serif)", fontSize: 38, lineHeight: 1.06, margin: 0,
            fontWeight: 400, letterSpacing: "-0.015em", color: "var(--ink)",
          }}>{card.title}</h1>
          <p style={{
            fontFamily: "var(--serif)", fontSize: 17, lineHeight: 1.5,
            color: "var(--ink-2)", marginTop: 18, maxWidth: 360,
          }}>{card.body}</p>
        </div>
      </div>

      <div style={{ padding: "0 34px calc(40px + env(safe-area-inset-bottom))", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 7, marginBottom: 22, justifyContent: "center", alignItems: "center" }}>
          {cards.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} aria-label={trf("passo {n}", { n: i + 1 })} style={{
              width: i === idx ? 22 : 7, height: 7, borderRadius: 99, padding: 0, border: "none",
              background: i === idx ? accentColor : "var(--rule)", cursor: "pointer", transition: "width 0.25s, background 0.25s",
            }}/>
          ))}
        </div>
        {!last ? (
          <Button onClick={next} accentColor={accentColor} style={{ width: "100%" }}>{tr("Seguir")}</Button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Button onClick={() => finish(true)} accentColor={accentColor}>{tr("Começar em branco")}</Button>
            <button onClick={() => finish(false, true)} className="tap" style={{
              background: "transparent", border: "1px solid var(--rule)", borderRadius: 10,
              padding: "12px 14px", cursor: "pointer", fontFamily: "var(--mono)",
              fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-2)",
            }}>{tr("Explorar com um exemplo")}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Guia das marés (tooltip/explicação dos tiers) ──────────
function TierGuideSheet({ open, onClose, accentColor }) {
  if (!open) return null;
  return (
    <Sheet open={open} onClose={onClose} title={tr("Como funcionam as marés")}>
      <div style={{ padding: "8px 24px 28px" }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: 20, lineHeight: 1.3, color: "var(--ink)", marginBottom: 6 }}>
          {tr("Cada hábito tem uma maré.")}
        </div>
        <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14, color: "var(--ink-3)", marginBottom: 20, lineHeight: 1.45 }}>
          {tr("Quanto mais dias seguidos, mais sobe. Um respiro honesto não a quebra — só um dia falhado é que faz a maré recuar.")}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {TIDE_TIERS.slice().reverse().map((t, i, arr) => (
            <div key={t.name} style={{
              display: "flex", alignItems: "baseline", gap: 12,
              padding: "11px 0",
              borderBottom: i < arr.length - 1 ? "1px solid var(--rule)" : "none",
            }}>
              <div style={{ width: 52, flexShrink: 0, fontFamily: "var(--mono)", fontSize: 11, color: accentColor }}>
                {trf("{min}+ d", { min: t.min })}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: 17, color: "var(--ink)" }}>{tr(t.name)}</div>
                <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink-3)", marginTop: 1 }}>{tr(t.subtitle)}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: 18, padding: "12px 14px", background: "var(--paper-2)",
          border: "1px solid var(--rule)", borderRadius: 10,
          fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13,
          color: "var(--ink-2)", lineHeight: 1.5,
        }}>
          {tr("À medida que acumula dias feitos em todos os hábitos, sobe também de posto — de Aprendiz a Almirante. Encontra-o em \"Marés Passadas\".")}
        </div>
      </div>
    </Sheet>
  );
}

// ─── Melhor hora do dia ─────────────────────────────────────
function BestHourChart({ blocks, accentColor }) {
  const { hours, total, peak } = useMemo(() => bestHourStats(blocks), [blocks]);
  if (total <= 0) {
    return (
      <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14, color: "var(--ink-3)", padding: "8px 0" }}>
        {tr("Ainda sem blocos suficientes para encontrar a sua melhor hora.")}
      </div>
    );
  }
  const max = Math.max(...hours);
  // Compact view: 6h–24h range (skip the dead early hours unless used).
  const startH = Math.min(6, hours.findIndex(x => x > 0) < 0 ? 6 : hours.findIndex(x => x > 0));
  const cells = [];
  for (let h = startH; h < 24; h++) cells.push(h);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: 22, color: accentColor }}>
          {pad(peak)}:00–{pad((peak + 1) % 24)}:00
        </div>
        <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink-3)" }}>
          {tr("a sua hora mais focada")}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 70 }}>
        {cells.map(h => {
          const v = hours[h];
          const ht = max > 0 ? Math.max(v > 0 ? 3 : 0, (v / max) * 64) : 0;
          return (
            <div key={h} title={pad(h) + ":00 · " + fmtDuration(v)}
              style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "stretch", height: "100%" }}>
              <div style={{
                height: ht, borderRadius: "2px 2px 0 0",
                background: h === peak ? accentColor : "var(--ink)",
                opacity: h === peak ? 1 : 0.5,
              }}/>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
        {cells.map(h => (
          <div key={h} style={{
            flex: 1, textAlign: "center", fontFamily: "var(--mono)", fontSize: 8,
            color: h === peak ? accentColor : "var(--ink-4)",
          }}>{(h % 6 === 0 || h === peak) ? pad(h) : ""}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Correlação hábitos ↔ foco ──────────────────────────────
function CorrelationList({ habits, blocks, accentColor }) {
  const rows = useMemo(() => habitFocusCorrelation(habits, blocks, 30), [habits, blocks]);
  if (rows.length === 0) {
    return (
      <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14, color: "var(--ink-3)", padding: "8px 0", lineHeight: 1.5 }}>
        {tr("Sem padrões suficientes ainda. Continue a registar hábitos e blocos — em poucas semanas aparecem aqui ligações.")}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.slice(0, 4).map(r => {
        const up = r.deltaPct >= 0;
        return (
          <div key={r.id} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0, fontFamily: "var(--serif)", fontSize: 15, color: "var(--ink)", lineHeight: 1.35 }}>
              {tr("Nos dias com")} <span style={{ fontStyle: "italic" }}>{r.name}</span>{tr(", foca")}{" "}
              <span style={{ color: up ? accentColor : "var(--ink-2)", fontWeight: 500 }}>
                {up ? "+" : ""}{r.deltaPct}%
              </span>.
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-3)", flexShrink: 0, textAlign: "right" }}>
              {fmtDuration(r.doneAvg)}<br/>vs {fmtDuration(r.missAvg)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Calendário do Pauta (foco por dia, mês) ────────────────
function FocusCalendar({ blocks, accentColor }) {
  const now = new Date();
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const todayKey = dayKeyOf(Date.now());

  const { cells, maxMs, totalMs, activeDays } = useMemo(() => {
    const nd = daysInMonth(view.y, view.m);
    const firstDow = new Date(view.y, view.m, 1).getDay(); // 0=dom
    const arr = [];
    for (let i = 0; i < firstDow; i++) arr.push(null);
    let mx = 0, tot = 0, act = 0;
    for (let d = 1; d <= nd; d++) {
      const key = dayKeyFromYMD(view.y, view.m, d);
      const ms = dailyFocusMs(blocks, key);
      if (ms > mx) mx = ms;
      tot += ms; if (ms > 0) act++;
      arr.push({ d, key, ms, isToday: key === todayKey, future: key > todayKey });
    }
    return { cells: arr, maxMs: mx, totalMs: tot, activeDays: act };
  }, [blocks, view, todayKey]);

  const shift = (n) => setView(v => {
    let m = v.m + n, y = v.y;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    return { y, m };
  });
  const level = (ms) => {
    if (!ms) return 0;
    if (maxMs <= 0) return 1;
    const r = ms / maxMs;
    return r > 0.66 ? 4 : r > 0.33 ? 3 : 2;
  };
  const bgFor = (lv) => lv === 0 ? "transparent"
    : `color-mix(in srgb, ${accentColor} ${[0,25,45,70,100][lv]}%, var(--paper))`;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button onClick={() => shift(-1)} className="tap" style={navBtn}>‹</button>
        <div style={{ fontFamily: "var(--serif)", fontSize: 17, color: "var(--ink)" }}>
          {fmtMonthLong(view.y, view.m)} <span style={{ color: "var(--ink-3)", fontSize: 13 }}>'{String(view.y).slice(2)}</span>
        </div>
        <button onClick={() => shift(1)} className="tap" style={navBtn}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {tr("d,s,t,q,q,s,s").split(",").map((l, i) => (
          <div key={i} style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: 8, color: "var(--ink-4)", textTransform: "uppercase" }}>{l}</div>
        ))}
        {cells.map((c, i) => {
          if (!c) return <div key={"e"+i}/>;
          const lv = level(c.ms);
          return (
            <div key={c.key} title={fmtDateShort(tsFromDayKey(c.key)) + " · " + fmtDuration(c.ms)}
              style={{
                aspectRatio: "1", borderRadius: 6,
                background: bgFor(lv),
                border: c.isToday ? `1.5px solid ${accentColor}` : (lv === 0 ? "1px solid var(--rule)" : "none"),
                opacity: c.future ? 0.4 : 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--mono)", fontSize: 10,
                color: lv >= 3 ? "var(--on-dark)" : "var(--ink-3)",
              }}>{c.d}</div>
          );
        })}
      </div>
      <div style={{ marginTop: 10, fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)", textAlign: "center", letterSpacing: "0.04em" }}>
        {trf("{focus} em foco · {days} {label}", { focus: fmtDuration(totalMs), days: activeDays, label: activeDays === 1 ? tr("dia activo") : tr("dias activos") })}
      </div>
    </div>
  );
}
const navBtn = {
  width: 30, height: 30, borderRadius: 8, border: "1px solid var(--rule)",
  background: "transparent", color: "var(--ink-2)", cursor: "pointer",
  fontSize: 18, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center",
};

// ─── Revisão semanal ────────────────────────────────────────
function WeekReview({ store, accentColor }) {
  const { state } = store;
  const r = useMemo(() => weeklyReview(state), [state]);
  const big = (v) => ({ fontFamily: "var(--serif)", fontSize: 24, color: "var(--ink)", lineHeight: 1 });
  const cap = { fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)", marginTop: 4 };
  return (
    <div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", color: "var(--ink-3)", marginBottom: 12 }}>
        {fmtDateShort(tsFromDayKey(r.startKey))} – {fmtDateShort(tsFromDayKey(r.endKey))}
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1,
        background: "var(--rule)", border: "1px solid var(--rule)", borderRadius: 10, overflow: "hidden",
      }}>
        <div style={{ background: "var(--paper)", padding: "14px 14px" }}>
          <div style={{ ...big(), color: accentColor }}>{fmtDuration(r.focusMs)}</div>
          <div style={cap}>{trf("foco · {n} {label}", { n: r.blockCount, label: r.blockCount === 1 ? tr("bloco") : tr("blocos") })}</div>
        </div>
        <div style={{ background: "var(--paper)", padding: "14px 14px" }}>
          <div style={big()}>{r.activeDays}<span style={{ fontSize: 13, color: "var(--ink-3)" }}>/7</span></div>
          <div style={cap}>{tr("dias activos")}</div>
        </div>
        <div style={{ background: "var(--paper)", padding: "14px 14px" }}>
          <div style={big()}>{r.intDone}<span style={{ fontSize: 13, color: "var(--ink-3)" }}>/{r.intTotal || 0}</span></div>
          <div style={cap}>{tr("intenções feitas")}</div>
        </div>
        <div style={{ background: "var(--paper)", padding: "14px 14px" }}>
          <div style={{ ...big(), color: r.habitPct === null ? "var(--ink-3)" : accentColor }}>
            {r.habitPct === null ? "—" : r.habitPct + "%"}
          </div>
          <div style={cap}>{trf("hábitos · {n} feitos", { n: r.habitDone })}</div>
        </div>
      </div>
      {r.topKey && r.topMs > 0 && (
        <div style={{ marginTop: 14, fontFamily: "var(--serif)", fontSize: 15, color: "var(--ink-2)", lineHeight: 1.45 }}>
          {tr("O seu pico foi")} <span style={{ fontStyle: "italic" }}>{fmtDateLong(tsFromDayKey(r.topKey)).split(",")[0]}</span>,
          {tr("com")} <span style={{ color: accentColor }}>{fmtDuration(r.topMs)}</span> {tr("em foco.")}
          {r.reflections > 0 && <> {trf("Escreveu {n} {label}.", { n: r.reflections, label: r.reflections === 1 ? tr("reflexão") : tr("reflexões") })}</>}
        </div>
      )}
    </div>
  );
}

// ─── Insights sheet (hub de análise) ────────────────────────
function InsightsSheet({ open, onClose, store, accentColor }) {
  if (!open) return null;
  const { state } = store;
  const Section = ({ label, children }) => (
    <div style={{ marginTop: 26 }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 12 }}>{label}</div>
      {children}
    </div>
  );
  return (
    <Sheet open={open} onClose={onClose} title={tr("Revisão")}>
      <div style={{ padding: "8px 24px 28px" }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: 24, lineHeight: 1.2, color: "var(--ink)", letterSpacing: "-0.01em" }}>
          {tr("A sua semana, de relance.")}
        </div>
        <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14, color: "var(--ink-3)", marginTop: 4, marginBottom: 18 }}>
          {tr("Sem julgamento. Só o que aconteceu, para reparar no padrão.")}
        </div>
        <WeekReview store={store} accentColor={accentColor}/>
        <Section label={tr("Melhor hora do dia")}>
          <BestHourChart blocks={state.blocks} accentColor={accentColor}/>
        </Section>
        <Section label={tr("Hábitos × foco")}>
          <CorrelationList habits={state.habits} blocks={state.blocks} accentColor={accentColor}/>
        </Section>
        <Section label={tr("Calendário de foco")}>
          <FocusCalendar blocks={state.blocks} accentColor={accentColor}/>
        </Section>
      </div>
    </Sheet>
  );
}

// ─── Metas trimestrais (secção do Hoje) ─────────────────────
function GoalsSection({ store, accentColor }) {
  const { state, addGoal, updateGoal, toggleGoal, removeGoal, reorderGoals } = store;
  const goals = state.goals || [];
  const [q, setQ] = useState(quarterOf(Date.now()));
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [histOpen, setHistOpen] = useState(false);

  const current = quarterOf(Date.now());
  const list = goals.filter(g => g.quarter === q);
  const done = list.filter(g => g.done).length;

  const listIds = list.map(g => g.id);
  const { dragId, start } = useDragReorder(listIds, (ids) => reorderGoals(q, ids));

  const history = useMemo(() => {
    const map = {};
    goals.forEach(g => {
      const m = map[g.quarter] || (map[g.quarter] = { total: 0, done: 0 });
      m.total++; if (g.done) m.done++;
    });
    return Object.keys(map).sort().reverse().map(qk => ({ q: qk, ...map[qk] }));
  }, [goals]);

  const commit = () => {
    if (text.trim()) { addGoal(text, q); haptic(8); }
    setText(""); setAdding(false);
  };
  const startEdit = (g) => { setEditId(g.id); setEditText(g.text); };
  const commitEdit = () => {
    if (editId) { const t = editText.trim(); if (t) updateGoal(editId, { text: t }); }
    setEditId(null); setEditText("");
  };
  const carryOver = (g) => { updateGoal(g.id, { quarter: nextQuarter(g.quarter) }); haptic(8); };

  const navBtn = (onClick, children, title) => (
    <button onClick={onClick} className="tap" title={title}
      style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--rule)", background: "transparent",
        color: "var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
      {children}
    </button>
  );

  return (
    <div style={{ marginTop: 32, padding: "20px 22px", background: "var(--paper-2)", borderRadius: 14, border: "1px solid var(--rule)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-3)" }}>
          {tr("Metas do trimestre")}
        </div>
        {list.length > 0 && (
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)" }}>{done}/{list.length}</div>
        )}
      </div>

      {/* Quarter navigator (free: past & future) */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        {navBtn(() => setQ(prevQuarter(q)), <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}><Icon.Chevron size={13}/></span>, tr("trimestre anterior"))}
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--ink)" }}>{quarterLabel(q).split(" · ")[0]}</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.08em", color: "var(--ink-3)" }}>
            {quarterLabel(q).split(" · ")[1]}{q === current ? " · " + tr("atual") : ""}
          </div>
        </div>
        {navBtn(() => setQ(nextQuarter(q)), <Icon.Chevron size={13}/>, tr("trimestre seguinte"))}
      </div>

      {list.length === 0 && !adding && (
        <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14, color: "var(--ink-3)", lineHeight: 1.4, marginBottom: 8 }}>
          {trf("O que quer ter feito até ao fim de {q}? Uma ou duas coisas grandes.", { q: quarterLabel(q).split(" · ")[1] })}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {list.map(g => (
          <div key={g.id} data-drag-id={g.id} className="goal-row"
            style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 0", borderBottom: "1px solid var(--rule)",
              background: dragId === g.id ? "var(--paper)" : "transparent", opacity: dragId === g.id ? 0.7 : 1,
              borderRadius: dragId === g.id ? 10 : 0, transition: "background 0.12s" }}>
            <button onPointerDown={(e) => start(e, g.id)} className="tap" title={tr("arrastar para reordenar")}
              style={{ width: 20, alignSelf: "stretch", border: "none", background: "transparent", color: "var(--ink-4)",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab", padding: 0, touchAction: "none", flexShrink: 0 }}>
              <Icon.Grip size={12}/>
            </button>
            <div style={{ paddingTop: 1 }}>
              <Check checked={g.done} onChange={() => { toggleGoal(g.id); haptic(8); }} size={20} accentColor={accentColor}/>
            </div>
            {editId === g.id ? (
              <input autoFocus value={editText} onChange={e => setEditText(e.target.value)} onBlur={commitEdit}
                onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") { setEditId(null); setEditText(""); } }}
                style={{ flex: 1, border: "none", borderBottom: "1px solid var(--rule)", background: "transparent", padding: "0 0 2px", fontSize: 16, color: "var(--ink)", fontFamily: "var(--serif)" }}/>
            ) : (
              <div onClick={() => startEdit(g)} title={tr("tocar para editar")} style={{
                flex: 1, fontFamily: "var(--serif)", fontSize: 16, lineHeight: 1.3, cursor: "text",
                color: g.done ? "var(--ink-3)" : "var(--ink)",
                textDecoration: g.done ? "line-through" : "none", textDecorationColor: "var(--ink-3)",
              }}>{g.text}</div>
            )}
            {!g.done && editId !== g.id && (
              <button onClick={() => carryOver(g)} className="tap" title={trf("mover para {q}", { q: quarterLabel(nextQuarter(g.quarter)).split(" · ")[0] })}
                style={{ border: "none", background: "transparent", color: "var(--ink-4)", cursor: "pointer", padding: 2, display: "flex" }}>
                <Icon.Chevron size={13}/>
              </button>
            )}
            <button onClick={() => removeGoal(g.id)} className="tap" title={tr("remover")}
              style={{ border: "none", background: "transparent", color: "var(--ink-4)", cursor: "pointer", padding: 2, display: "flex" }}>
              <Icon.Trash size={13}/>
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <input autoFocus value={text} onChange={e => setText(e.target.value)} onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setText(""); setAdding(false); } }}
          placeholder={tr("Nova meta…")}
          style={{ width: "100%", border: "none", borderBottom: "1px solid var(--rule)", background: "transparent", padding: "10px 0", fontSize: 16, color: "var(--ink)", fontFamily: "var(--serif)" }}/>
      ) : (
        <button onClick={() => setAdding(true)} className="tap" style={{
          marginTop: 8, background: "transparent", border: "none", padding: "8px 0",
          display: "flex", alignItems: "center", gap: 10, color: "var(--ink-3)", fontSize: 14, cursor: "pointer",
        }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", border: "1.5px dashed var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon.Plus size={11}/>
          </div>
          {tr("adicionar meta")}
        </button>
      )}

      {/* Histórico de trimestres */}
      {history.length > 0 && (
        <div style={{ marginTop: 16, borderTop: "1px solid var(--rule)", paddingTop: 12 }}>
          <button onClick={() => setHistOpen(o => !o)} className="tap"
            style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
              fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-3)" }}>
            <span style={{ display: "inline-flex", transform: histOpen ? "rotate(90deg)" : "none", transition: "transform 0.12s" }}><Icon.Chevron size={11}/></span>
            {tr("Histórico")}
          </button>
          {histOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 10 }}>
              {history.map(h => (
                <button key={h.q} onClick={() => { setQ(h.q); haptic(6); }} className="tap"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
                    border: "none", background: h.q === q ? `${accentColor}11` : "transparent",
                    borderRadius: 8, padding: "8px 10px", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: h.q === q ? accentColor : "var(--ink-2)" }}>
                    {quarterLabel(h.q).split(" · ")[0]}{h.q === current ? " · " + tr("atual") : ""}
                  </span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: h.done === h.total ? accentColor : "var(--ink-3)" }}>
                    {trf("{d}/{t} cumpridas", { d: h.done, t: h.total })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Notificações (capacidade + disparo, multi-plataforma) ───
// O problema do "este dispositivo não suporta notificações": dentro da WebView
// nativa do Android (o APK), `window.Notification` NÃO existe — logo a app dizia
// que o telemóvel não suportava, quando o que falta é a API web, não o sistema.
// Resolvemos detectando e disparando pelo melhor canal disponível:
//   1) o plugin nativo FocusActivity (quando corre dentro da app),
//   2) o service worker numa PWA instalada (mais fiável no Android que `new
//      Notification`),
//   3) `new Notification` como último recurso (browser de secretária).

// A correr dentro do APK nativo (Capacitor)?
function isNativeApp() {
  return !!(window.FocusActivity && window.FocusActivity.isNative);
}
// O service worker consegue mostrar notificações? (PWA instalada)
function swNotifyAvailable() {
  return !!(navigator.serviceWorker && window.ServiceWorkerRegistration &&
    "showNotification" in window.ServiceWorkerRegistration.prototype);
}
// Há ALGUM canal de notificações neste dispositivo?
function notifySupported() {
  return isNativeApp() || (typeof Notification !== "undefined") || swNotifyAvailable();
}
// Pede a permissão pelo canal certo. Devolve { ok, reason? }.
async function enableNotifications() {
  if (isNativeApp()) {
    // Android: POST_NOTIFICATIONS através do plugin nativo.
    try {
      const r = await window.FocusActivity.requestPermission();
      return (r && r.granted) ? { ok: true } : { ok: false, reason: "denied" };
    } catch (e) { return { ok: false, reason: "denied" }; }
  }
  if (typeof Notification === "undefined" && !swNotifyAvailable()) {
    return { ok: false, reason: "unsupported" };
  }
  let perm = (typeof Notification !== "undefined") ? Notification.permission : "default";
  if (perm === "default" && typeof Notification !== "undefined") {
    try { perm = await Notification.requestPermission(); } catch (e) {}
  }
  return perm === "granted" ? { ok: true } : { ok: false, reason: "denied" };
}
// Dispara uma notificação pelo melhor canal. Devolve true se foi mostrada.
async function fireReminder(title, body, tag) {
  // 1) Nativo (funciona na WebView, onde as notificações web não funcionam).
  if (isNativeApp() && typeof window.FocusActivity.notify === "function") {
    try { await window.FocusActivity.notify({ title, body, tag }); return true; } catch (e) {}
  }
  // 2) PWA instalada: pelo service worker.
  if (swNotifyAvailable()) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body, tag, renotify: true,
        icon: "./icons/icon-192.png", badge: "./icons/icon-192.png",
      });
      return true;
    } catch (e) {}
  }
  // 3) Último recurso: notificação simples da página.
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try { new Notification(title, { body, tag }); return true; } catch (e) {}
  }
  return false;
}

// ─── Lembretes locais (sem servidor; só com a app aberta) ───
// Dispara notificações enquanto a página está aberta: nudge de hábitos
// pendentes e da reflexão noturna, uma vez por dia, à hora preferida.
// Drop "pauta.reminded.<kind>.<dayKey>" flags older than a couple of days.
// These are written once per fired reminder and were never cleaned up, so they
// accumulated forever — a slow localStorage leak. dayKeys are zero-padded
// YYYY-MM-DD, so a lexicographic compare against a cutoff is safe.
// Apagar marcas "pauta.reminded.…" antigas para não acumularem indefinidamente.
function pruneStaleReminderFlags() {
  try {
    const cutoff = addDaysToKey(dayKeyOf(Date.now()), -2);
    const stale = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || k.indexOf("pauta.reminded.") !== 0) continue;
      const dayKey = k.slice(k.lastIndexOf(".") + 1);
      if (dayKey < cutoff) stale.push(k);
    }
    stale.forEach((k) => localStorage.removeItem(k));
  } catch (_) {}
}

function useReminders(store) {
  const { state } = store;
  const prefs = state.prefs || {};
  const rem = prefs.reminders || {};
  // Sweep accumulated reminder flags once on mount (runs regardless of whether
  // reminders are currently enabled, so leftover keys still get cleaned up).
  useEffect(() => { pruneStaleReminderFlags(); }, []);
  useEffect(() => {
    if (!rem.enabled) return;
    if (!notifySupported()) return;

    const firedKey = (kind, dayKey) => "pauta.reminded." + kind + "." + dayKey;
    const tryFire = async () => {
      const now = new Date();
      const dayKey = dayKeyOf(now.getTime());
      const hhmm = pad(now.getHours()) + ":" + pad(now.getMinutes());

      // Habits nudge
      if (rem.habitsTime && hhmm >= rem.habitsTime) {
        const pending = (state.habits || []).filter(h =>
          habitIsActiveOn(h, dayKey) && !(h.log && h.log[dayKey]) && !(h.respiros && h.respiros[dayKey])
        );
        if (pending.length > 0 && !localStorage.getItem(firedKey("habits", dayKey))) {
          const ok = await fireReminder(
            tr("Pauta · marés de hoje"),
            pending.length === 1
              ? trf('Falta "{name}".', { name: pending[0].name })
              : trf("Faltam {n} hábitos hoje.", { n: pending.length }),
            "pauta-habits"
          );
          if (ok) localStorage.setItem(firedKey("habits", dayKey), "1");
        }
      }
      // Evening reflection nudge
      if (rem.reflectionTime && hhmm >= rem.reflectionTime) {
        const noReflection = !(state.today && state.today.dayKey === dayKey && state.today.reflection && state.today.reflection.trim());
        if (noReflection && !localStorage.getItem(firedKey("reflection", dayKey))) {
          const ok = await fireReminder(
            tr("Pauta · reflexão da noite"),
            tr("O que valeu hoje? Escreva uma linha."),
            "pauta-reflection"
          );
          if (ok) localStorage.setItem(firedKey("reflection", dayKey), "1");
        }
      }
    };
    tryFire();
    const id = setInterval(tryFire, 60000);
    return () => clearInterval(id);
  }, [rem.enabled, rem.habitsTime, rem.reflectionTime, state.habits, state.today]);
}

// ─── Native focus timer notification (Android island) ────────
// Drives the FocusActivity Capacitor plugin while a block is running.
// Falls back silently in plain PWA / browser contexts where the plugin is absent.
function useFocusActivity(store) {
  const { activeBlock, state, pauseActive, resumeBlock, concludeActive } = store;
  // Track the last known active block id so the receiver can resume it by id.
  const lastIdRef = useRef(null);

  // Wire native notification button taps → store actions (once on mount).
  useEffect(() => {
    const h = window.FocusActivity.addListener("action", ({ kind }) => {
      if (kind === "pause")   pauseActive("");
      else if (kind === "resume" && lastIdRef.current) resumeBlock(lastIdRef.current);
      else if (kind === "conclude") concludeActive("");
    });
    return () => { try { h.remove(); } catch (_) {} };
  }, []);

  // Start the foreground service AND make sure the notification can actually be
  // shown. On Android 13+ the service runs without POST_NOTIFICATIONS but its
  // notification is suppressed — so we ask for the permission right here (the
  // first time the user starts a block) and, if it's only just been granted,
  // re-post so the timer notification appears immediately.
  const startNative = (opts) => {
    window.FocusActivity.start(opts);
    if (!window.FocusActivity.isNative) return;
    try {
      window.FocusActivity.checkPermission().then((r) => {
        if (r && r.granted) return;
        window.FocusActivity.requestPermission().then((res) => {
          if (res && res.granted) window.FocusActivity.start(opts);
        }).catch(() => {});
      }).catch(() => {});
    } catch (_) {}
  };

  // Sync native service state with activeBlock changes.
  // Deps: block id changes on start/switch; sessions.length changes on resume.
  useEffect(() => {
    if (activeBlock) {
      lastIdRef.current = activeBlock.id;
      const lastSeg  = activeBlock.sessions[activeBlock.sessions.length - 1];
      const elapsedMs = activeBlock.sessions.reduce(
        (acc, s) => acc + ((s.endedAt || Date.now()) - s.startedAt), 0
      );
      // start() handles both "new block" and "resumed block": it resets the
      // chronometer base to now − elapsedMs so the total accumulated time shows.
      startNative({ title: activeBlock.title, startedAt: lastSeg.startedAt, elapsedMs });
    } else {
      const blockId = lastIdRef.current;
      if (!blockId) return;
      const block = (state.blocks || []).find(b => b.id === blockId);
      if (block?.status === "paused") {
        const elapsedMs = block.sessions.reduce(
          (acc, s) => acc + ((s.endedAt || Date.now()) - s.startedAt), 0
        );
        window.FocusActivity.update({ elapsedMs, paused: true });
      } else {
        // concluded or deleted
        lastIdRef.current = null;
        window.FocusActivity.stop();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBlock?.id, activeBlock?.sessions?.length]);
}

// ─── Auto-backup loop ────────────────────────────────────────
// Writes a timestamped snapshot of the latest backup object on the cadence the
// user picked, plus opportunistically when the tab is hidden / closing (the
// moments most likely to precede data loss). The actual storage lives in
// readAutoBackup/writeAutoBackup (store.jsx); this only schedules the writes.
function useAutoBackup(store) {
  const freq = store.state.prefs.autoBackup || "off";
  // Keep a live reference to the latest serializer so the interval always
  // captures current state without re-subscribing on every keystroke.
  const serializeRef = useRef(store.serializeBackup);
  serializeRef.current = store.serializeBackup;

  useEffect(() => {
    if (freq === "off") return;
    const ms = window.autoBackupIntervalMs(freq);
    if (!ms) return;
    const tick = () => {
      const last = window.readAutoBackup();
      if (!last || (Date.now() - last.ts) >= ms) {
        window.writeAutoBackup(serializeRef.current());
      }
    };
    // Check on a coarse timer (between 1 and 5 min) rather than exactly every
    // `ms`, so a daily/weekly cadence doesn't keep a multi-hour timer alive.
    const checkEvery = Math.min(Math.max(ms, 60000), 5 * 60000);
    const id = setInterval(tick, checkEvery);
    const onVis = () => { if (document.visibilityState === "hidden") tick(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("beforeunload", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", tick);
    };
  }, [freq]);
}

// ─── Screen wake lock ────────────────────────────────────────
// Holds a screen wake lock while `active` so the phone doesn't sleep mid-block.
// The lock is auto-dropped by the browser when the tab hides; re-acquire on
// return. No-ops where the API is unavailable (e.g. iOS Safari < 16.4).
function useWakeLock(active) {
  useEffect(() => {
    if (!active || !navigator.wakeLock) return;
    let lock = null, cancelled = false;
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
        lock.addEventListener && lock.addEventListener("release", () => { lock = null; });
      } catch (e) {}
    };
    request();
    const onVis = () => {
      if (document.visibilityState === "visible" && !lock && !cancelled) request();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      try { if (lock) lock.release(); } catch (e) {}
    };
  }, [active]);
}

// ─── Completion chime ────────────────────────────────────────
// A short, soft three-note arpeggio via Web Audio (no asset to ship). Callers
// gate on prefs.sound. Wrapped in try/catch so it never blocks the action.
function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const t0 = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = t0 + i * 0.11;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.16, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(start); osc.stop(start + 0.56);
    });
    setTimeout(() => { try { ctx.close(); } catch (e) {} }, 1300);
  } catch (e) {}
}

// ─── Shareable "day card" ────────────────────────────────────
// Renders today's summary to a 1080² PNG (on-brand: paper, ink, accent, serif
// wordmark) and offers it via the Web Share API, falling back to a download.
// Fully local — no upload. Caller passes already-translated label strings.
async function shareDayCard({ dateLabel, focusValue, focusCaption, ratioValue, ratioCaption, tagline, accent }) {
  try {
    const W = 1080, H = 1080;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const cs = getComputedStyle(document.documentElement);
    const v = (name, fb) => (cs.getPropertyValue(name).trim() || fb);
    const paper = v("--paper", "#F5F1EA"), ink = v("--ink", "#1A1815"), ink3 = v("--ink-3", "#8A8275");
    const accentCol = accent || v("--accent", "#B8533A");

    ctx.fillStyle = paper; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = accentCol; ctx.fillRect(0, 0, W, 18);
    ctx.textBaseline = "top";

    ctx.fillStyle = ink3; ctx.font = "500 34px Geist, system-ui, sans-serif";
    ctx.fillText((dateLabel || "").toUpperCase(), 96, 150);
    ctx.fillStyle = ink; ctx.font = "italic 100px 'Instrument Serif', Georgia, serif";
    ctx.fillText("Pauta", 92, 196);

    ctx.fillStyle = accentCol; ctx.font = "600 150px Geist, system-ui, sans-serif";
    ctx.fillText(focusValue || "", 96, 400);
    ctx.fillStyle = ink3; ctx.font = "400 42px Geist, system-ui, sans-serif";
    ctx.fillText(focusCaption || "", 100, 580);

    ctx.fillStyle = ink; ctx.font = "600 96px Geist, system-ui, sans-serif";
    ctx.fillText(ratioValue || "", 96, 700);
    ctx.fillStyle = ink3; ctx.font = "400 42px Geist, system-ui, sans-serif";
    ctx.fillText(ratioCaption || "", 100, 824);

    ctx.fillStyle = ink3; ctx.font = "italic 38px 'Instrument Serif', Georgia, serif";
    ctx.fillText(tagline || "", 96, H - 130);

    const blob = await new Promise(res => c.toBlob(res, "image/png"));
    if (!blob) return;
    const file = new File([blob], "pauta-hoje.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "Pauta" });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "pauta-hoje.png";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  } catch (e) {}
}

// ─── Share backup to the cloud (lightweight) ─────────────────
// Hands the backup JSON to the OS share sheet so the user can drop it into
// Google Drive / Dropbox / Files — no account or API keys, fits the offline
// ethos. Falls back to a normal download where file-sharing isn't available.
async function shareBackupFile(backupObj) {
  const name = "pauta-backup-" + new Date().toISOString().slice(0, 10) + ".json";
  const json = JSON.stringify(backupObj, null, 2);
  try {
    const file = new File([json], name, { type: "application/json" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "Pauta", text: "Pauta backup" });
      return { ok: true, shared: true };
    }
  } catch (e) {
    if (e && e.name === "AbortError") return { ok: true, shared: false }; // user cancelled
  }
  // Fallback: download (Android saves to Downloads; the user can upload it).
  try {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true, shared: false };
  } catch (e) { return { ok: false }; }
}

Object.assign(window, {
  haptic, OnboardingOverlay, TierGuideSheet,
  BestHourChart, CorrelationList, FocusCalendar, WeekReview, InsightsSheet,
  GoalsSection, useReminders, useFocusActivity,
  useAutoBackup, useWakeLock, playChime, shareDayCard, shareBackupFile,
  notifySupported, enableNotifications, fireReminder,
});

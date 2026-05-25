// Pauta — extras: onboarding, insights (revisão semanal, melhor hora,
// correlação, calendário), guia das marés, metas trimestrais, lembretes,
// e pequenos utilitários (háptico). Carregado antes de app.jsx.

// ─── Haptic feedback ────────────────────────────────────────
// Respeita prefs.haptics (espelhada em window.PAUTA_HAPTICS pelo App).
function haptic(ms = 10) {
  try { if (window.PAUTA_HAPTICS && navigator.vibrate) navigator.vibrate(ms); } catch (e) {}
}

// ─── Onboarding (primeira abertura) ─────────────────────────
function OnboardingOverlay({ onDone, accentColor }) {
  const [step, setStep] = useState(0);
  const slides = [
    {
      tag: tr("bem-vindo"),
      title: <>{tr("Esta é a sua")} <em style={{ color: accentColor }}>{tr("pauta")}</em>.</>,
      body: tr("Um lugar calmo para o que importa: intenções, foco e hábitos. Sem pontos, sem pressão — só ritmo."),
    },
    {
      tag: tr("hoje"),
      title: <>{tr("Comece pelo")} <em style={{ color: accentColor }}>{tr("Hoje")}</em>.</>,
      body: tr("Liste 1 a 4 coisas que movem o seu dia. À noite, escreva uma reflexão curta. Amanhã, recomeça."),
    },
    {
      tag: tr("pauta"),
      title: <>{tr("Foque em")} <em style={{ color: accentColor }}>{tr("blocos")}</em>.</>,
      body: tr("Inicie um bloco, pause, troque ou conclua. A linha temporal mostra o ritmo real do seu dia."),
    },
    {
      tag: tr("marés"),
      title: <>{tr("Cultive")} <em style={{ color: accentColor }}>{tr("marés")}</em>.</>,
      body: tr("Hábitos que sobem e descem como a maré. Um respiro honesto não quebra a corrente — recuar é respirar."),
    },
  ];
  const s = slides[step];
  const last = step === slides.length - 1;
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 400,
      background: "var(--paper)",
      display: "flex", flexDirection: "column",
      animation: "fadeIn 0.3s ease",
    }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 32px" }}>
        <div style={{
          fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.2em",
          textTransform: "uppercase", color: accentColor, marginBottom: 14,
        }}>{s.tag}</div>
        <h1 style={{
          fontFamily: "var(--serif)", fontSize: 40, lineHeight: 1.05,
          margin: 0, fontWeight: 400, letterSpacing: "-0.015em", color: "var(--ink)",
        }}>{s.title}</h1>
        <p style={{
          fontFamily: "var(--serif)", fontSize: 17, lineHeight: 1.5,
          color: "var(--ink-2)", marginTop: 18, maxWidth: 360,
        }}>{s.body}</p>
      </div>
      <div style={{ padding: "0 32px 40px" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {slides.map((_, i) => (
            <div key={i} style={{
              height: 3, flex: 1, borderRadius: 2,
              background: i <= step ? accentColor : "var(--rule)",
              transition: "background 0.2s",
            }}/>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={onDone} className="tap" style={{
            background: "transparent", border: "none", padding: "12px 0",
            fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "var(--ink-3)", cursor: "pointer",
          }}>{tr("saltar")}</button>
          <Button onClick={() => { haptic(8); last ? onDone() : setStep(step + 1); }}
            accentColor={accentColor} style={{ flex: 1 }}>
            {last ? tr("Começar") : tr("Continuar")}
          </Button>
        </div>
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
                <div style={{ fontFamily: "var(--serif)", fontSize: 17, color: "var(--ink)" }}>{t.name}</div>
                <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink-3)", marginTop: 1 }}>{t.subtitle}</div>
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
  const { state, addGoal, toggleGoal, removeGoal } = store;
  const goals = state.goals || [];
  const [q, setQ] = useState(quarterOf(Date.now()));
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");

  const quarters = useMemo(() => {
    const set = new Set(goals.map(g => g.quarter));
    set.add(quarterOf(Date.now()));
    return Array.from(set).sort().reverse();
  }, [goals]);

  const list = goals.filter(g => g.quarter === q);
  const done = list.filter(g => g.done).length;

  const commit = () => {
    if (text.trim()) { addGoal(text, q); haptic(8); }
    setText(""); setAdding(false);
  };

  return (
    <div style={{ marginTop: 32, padding: "20px 22px", background: "var(--paper-2)", borderRadius: 14, border: "1px solid var(--rule)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-3)" }}>
          {tr("Metas do trimestre")}
        </div>
        {list.length > 0 && (
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)" }}>{done}/{list.length}</div>
        )}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {quarters.map(qq => (
          <button key={qq} onClick={() => setQ(qq)} className="tap" style={{
            border: "1px solid " + (qq === q ? accentColor : "var(--rule)"),
            background: qq === q ? `${accentColor}11` : "transparent",
            color: qq === q ? accentColor : "var(--ink-3)",
            borderRadius: 999, padding: "4px 10px",
            fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.06em", cursor: "pointer",
          }}>{quarterLabel(qq).split(" · ")[0]}</button>
        ))}
      </div>

      {list.length === 0 && !adding && (
        <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14, color: "var(--ink-3)", lineHeight: 1.4, marginBottom: 8 }}>
          {trf("O que quer ter feito até ao fim de {q}? Uma ou duas coisas grandes.", { q: quarterLabel(q).split(" · ")[1] })}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {list.map(g => (
          <div key={g.id} className="goal-row" style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--rule)" }}>
            <div style={{ paddingTop: 1 }}>
              <Check checked={g.done} onChange={() => { toggleGoal(g.id); haptic(8); }} size={20} accentColor={accentColor}/>
            </div>
            <div style={{
              flex: 1, fontFamily: "var(--serif)", fontSize: 16, lineHeight: 1.3,
              color: g.done ? "var(--ink-3)" : "var(--ink)",
              textDecoration: g.done ? "line-through" : "none", textDecorationColor: "var(--ink-3)",
            }}>{g.text}</div>
            <button onClick={() => removeGoal(g.id)} className="tap" title={tr("remover")}
              style={{ border: "none", background: "transparent", color: "var(--ink-4)", cursor: "pointer", padding: 2 }}>
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
    </div>
  );
}

// ─── Lembretes locais (sem servidor; só com a app aberta) ───
// Dispara notificações enquanto a página está aberta: nudge de hábitos
// pendentes e da reflexão noturna, uma vez por dia, à hora preferida.
function useReminders(store) {
  const { state } = store;
  const prefs = state.prefs || {};
  const rem = prefs.reminders || {};
  useEffect(() => {
    if (!rem.enabled) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    const firedKey = (kind, dayKey) => "pauta.reminded." + kind + "." + dayKey;
    const tryFire = () => {
      const now = new Date();
      const dayKey = dayKeyOf(now.getTime());
      const hhmm = pad(now.getHours()) + ":" + pad(now.getMinutes());

      // Habits nudge
      if (rem.habitsTime && hhmm >= rem.habitsTime) {
        const pending = (state.habits || []).filter(h =>
          habitIsActiveOn(h, dayKey) && !(h.log && h.log[dayKey]) && !(h.respiros && h.respiros[dayKey])
        );
        if (pending.length > 0 && !localStorage.getItem(firedKey("habits", dayKey))) {
          try {
            new Notification(tr("Pauta · marés de hoje"), {
              body: pending.length === 1
                ? trf('Falta "{name}".', { name: pending[0].name })
                : trf("Faltam {n} hábitos hoje.", { n: pending.length }),
              tag: "pauta-habits",
            });
            localStorage.setItem(firedKey("habits", dayKey), "1");
          } catch (e) {}
        }
      }
      // Evening reflection nudge
      if (rem.reflectionTime && hhmm >= rem.reflectionTime) {
        const noReflection = !(state.today && state.today.dayKey === dayKey && state.today.reflection && state.today.reflection.trim());
        if (noReflection && !localStorage.getItem(firedKey("reflection", dayKey))) {
          try {
            new Notification(tr("Pauta · reflexão da noite"), {
              body: tr("O que valeu hoje? Escreva uma linha."),
              tag: "pauta-reflection",
            });
            localStorage.setItem(firedKey("reflection", dayKey), "1");
          } catch (e) {}
        }
      }
    };
    tryFire();
    const id = setInterval(tryFire, 60000);
    return () => clearInterval(id);
  }, [rem.enabled, rem.habitsTime, rem.reflectionTime, state.habits, state.today]);
}

Object.assign(window, {
  haptic, OnboardingOverlay, TierGuideSheet,
  BestHourChart, CorrelationList, FocusCalendar, WeekReview, InsightsSheet,
  GoalsSection, useReminders,
});

// Pauta — Marés sheets: TrendSheet (12-month wave) + HabitDetailSheet (heatmap + edit)

// ─── Marés Passadas (12-month wave trend) ────────────────────
function TrendSheet({ open, onClose, habits, accentColor, todayTs, onPickMonth }) {
  if (!open) return null;

  const todayD = new Date(todayTs);

  // Show months from earliest habit creation → today (capped to 18 most recent).
  // If user has < 3 months of history, pad with a couple of leading months so the
  // chart has visual room without bunching points to the right.
  const months = useMemo(() => {
    const all = habitsAllMonths(habits, todayTs); // newest → oldest
    let subset = all.slice(0, 18).reverse();      // oldest → newest
    while (subset.length < 3) {
      const first = subset[0] || { y: todayD.getFullYear(), m: todayD.getMonth() };
      let y = first.y, m = first.m - 1;
      if (m < 0) { m = 11; y--; }
      subset = [{ y, m }, ...subset];
    }
    return subset.map(({ y, m }) => ({
      y, m,
      pct: overallPctInMonth(habits, y, m, todayTs),
    }));
  }, [habits, todayTs]);

  const validPoints = months.filter(p => p.pct !== null);
  const best = validPoints.length > 0 ? validPoints.reduce((a, b) => b.pct > a.pct ? b : a) : null;
  const worst = validPoints.length > 0 ? validPoints.reduce((a, b) => b.pct < a.pct ? b : a) : null;
  const avg = validPoints.length > 0 ? Math.round(validPoints.reduce((s, p) => s + p.pct, 0) / validPoints.length) : null;

  // Drill-down: which month is currently expanded inside this sheet
  const [picked, setPicked] = useState(null); // { y, m }

  // Navigator level
  const totalDone = totalDoneDays(habits);
  const level = navigatorLevel(totalDone);

  return (
    <Sheet open={open} onClose={onClose} title={tr("Marés Passadas")}>
      <div style={{ padding: "8px 24px 24px" }}>
        <div style={{
          fontFamily: "var(--serif)", fontSize: 22, lineHeight: 1.25,
          color: "var(--ink)", marginBottom: 4, letterSpacing: "-0.01em",
        }}>
          {tr("As suas marés ao longo do ano.")}
        </div>
        <div style={{
          fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14,
          color: "var(--ink-3)", marginBottom: 24,
        }}>
          {tr("Sobem e descem. Cada onda é um mês. Toque para ver as marés desse mês.")}
        </div>

        {validPoints.length < 2 ? (
          <div style={{
            padding: "40px 0", textAlign: "center",
            fontFamily: "var(--serif)", fontStyle: "italic",
            fontSize: 15, color: "var(--ink-3)",
          }}>
            {tr("Ainda não há marés suficientes para mostrar uma onda.")}<br/>
            {tr("Volte aqui dentro de alguns meses.")}
          </div>
        ) : (
          <>
            <WaveChart
              months={months}
              accentColor={accentColor}
              picked={picked}
              onPick={(y, m) => {
                setPicked(prev => (prev && prev.y === y && prev.m === m) ? null : { y, m });
              }}
            />

            {/* Drill-down: habits inside the picked month */}
            {picked && (
              <MonthDrillDown
                year={picked.y}
                monthIdx={picked.m}
                habits={habits}
                accentColor={accentColor}
                todayTs={todayTs}
                onOpen={() => onPickMonth && onPickMonth(picked.y, picked.m)}
                onClose={() => setPicked(null)}
              />
            )}

            <div style={{
              marginTop: 28, display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
              gap: 1, background: "var(--rule)",
              border: "1px solid var(--rule)", borderRadius: 8,
              overflow: "hidden",
            }}>
              <Stat label={tr("Maré média")} value={avg !== null ? avg + "%" : "—"} accentColor={accentColor}/>
              <Stat label={tr("Maré alta")} value={best ? best.pct + "%" : "—"}
                hint={best ? fmtMonthShort(best.y, best.m) : ""} accentColor={accentColor}/>
              <Stat label={tr("Maré baixa")} value={worst ? worst.pct + "%" : "—"}
                hint={worst ? fmtMonthShort(worst.y, worst.m) : ""} accentColor={accentColor}/>
            </div>
          </>
        )}

        {/* Navigator level — escondido como pequeno tesouro */}
        <div style={{
          marginTop: 32, padding: "18px 18px",
          border: "1px solid var(--rule)", borderRadius: 12,
          background: "var(--paper-2)",
        }}>
          <div style={{
            fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.16em",
            textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6,
          }}>
            {tr("o seu posto")}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div>
              <div style={{
                fontFamily: "var(--serif)", fontSize: 26, lineHeight: 1,
                color: accentColor, letterSpacing: "-0.01em",
              }}>
                {level.name}
              </div>
              <div style={{
                fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13,
                color: "var(--ink-3)", marginTop: 4,
              }}>
                {level.subtitle}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 18, color: "var(--ink)" }}>
                {totalDone}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.1em", color: "var(--ink-3)", textTransform: "uppercase" }}>
                {tr("dias feitos")}
              </div>
            </div>
          </div>
          {level.next && (
            <div style={{
              marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--rule)",
              fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)",
              letterSpacing: "0.04em",
            }}>
              {trf("faltam {n} dias para", { n: level.next.min - totalDone })} <span style={{ color: "var(--ink-2)" }}>{level.next.name}</span>
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}

function Stat({ label, value, hint, accentColor }) {
  return (
    <div style={{
      padding: "14px 12px",
      background: "var(--paper)",
      textAlign: "center",
    }}>
      <div style={{
        fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.15em",
        textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6,
      }}>{label}</div>
      <div style={{ fontFamily: "var(--serif)", fontSize: 22, color: "var(--ink)", lineHeight: 1 }}>
        {value}
      </div>
      {hint && (
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-3)", marginTop: 4 }}>{hint}</div>
      )}
    </div>
  );
}

// ─── Wave chart ─────────────────────────────────────────
function WaveChart({ months, accentColor, onPick, picked }) {
  const W = 320, H = 180, PAD_X = 16, PAD_Y = 24;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y * 2;

  const points = months.map((p, i) => {
    const cx = PAD_X + (months.length === 1 ? innerW / 2 : (i / (months.length - 1)) * innerW);
    const cy = p.pct === null ? null : PAD_Y + (1 - p.pct/100) * innerH;
    const isPicked = picked && picked.y === p.y && picked.m === p.m;
    return { ...p, cx, cy, isPicked };
  });

  const segments = [];
  let curr = [];
  for (const p of points) {
    if (p.cy === null) {
      if (curr.length >= 2) segments.push(curr);
      curr = [];
    } else curr.push(p);
  }
  if (curr.length >= 2) segments.push(curr);

  function smoothPath(pts) {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].cx},${pts[0].cy}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i-1)];
      const p1 = pts[i];
      const p2 = pts[i+1];
      const p3 = pts[Math.min(pts.length-1, i+2)];
      const cp1x = p1.cx + (p2.cx - p0.cx) / 6;
      const cp1y = p1.cy + (p2.cy - p0.cy) / 6;
      const cp2x = p2.cx - (p3.cx - p1.cx) / 6;
      const cp2y = p2.cy - (p3.cy - p1.cy) / 6;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.cx},${p2.cy}`;
    }
    return d;
  }

  const baseY = H - PAD_Y;

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none"
        style={{ display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id="waveFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.28"/>
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.02"/>
          </linearGradient>
        </defs>

        {[25, 50, 75].map(v => {
          const y = PAD_Y + (1 - v/100) * innerH;
          return (
            <line key={v} x1={PAD_X} y1={y} x2={W - PAD_X} y2={y}
              stroke="var(--rule)" strokeWidth="0.5" strokeDasharray="2 3"/>
          );
        })}

        {segments.map((seg, i) => {
          const path = smoothPath(seg);
          const fillPath = path + ` L ${seg[seg.length-1].cx},${baseY} L ${seg[0].cx},${baseY} Z`;
          return (
            <g key={i}>
              <path d={fillPath} fill="url(#waveFill)"/>
              <path d={path} fill="none" stroke={accentColor} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"/>
            </g>
          );
        })}

        {points.map((p, i) => {
          if (p.cy === null) return null;
          return (
            <g key={i} style={{ cursor: "pointer" }}
              onClick={() => onPick && onPick(p.y, p.m)}>
              <circle cx={p.cx} cy={p.cy} r="10" fill="transparent"/>
              {p.isPicked && (
                <circle cx={p.cx} cy={p.cy} r="8" fill={accentColor} opacity="0.18"/>
              )}
              <circle cx={p.cx} cy={p.cy} r={p.isPicked ? 4.5 : 3}
                fill={p.isPicked ? accentColor : "var(--paper)"}
                stroke={accentColor} strokeWidth="1.5"/>
            </g>
          );
        })}
      </svg>

      <div style={{
        display: "flex", marginTop: 8, padding: `0 ${PAD_X}px`,
      }}>
        {points.map((p, i) => {
          const isPicked = p.isPicked;
          return (
            <button
              key={i}
              onClick={() => onPick && onPick(p.y, p.m)}
              className="tap"
              style={{
                flex: 1, border: "none", background: "transparent",
                fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.05em",
                color: isPicked ? accentColor :
                       (p.pct === null ? "var(--ink-4, #c8bdaa)" : "var(--ink-3)"),
                fontWeight: isPicked ? 600 : 400,
                cursor: p.pct === null ? "default" : "pointer",
                padding: "4px 2px",
                textAlign: "center",
                opacity: p.pct === null ? 0.45 : 1,
              }}>
              <div>{fmtMonthShort(p.y, p.m)}</div>
              {p.pct !== null && (
                <div style={{
                  marginTop: 2,
                  color: isPicked ? accentColor : "var(--ink-2)",
                  fontSize: 10,
                }}>{p.pct}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Month drill-down (inside trend sheet) ──────────────
function MonthDrillDown({ year, monthIdx, habits, accentColor, todayTs, onOpen, onClose }) {
  // Habits that existed at any point in this month
  const rows = useMemo(() => {
    return habits
      .map(h => {
        const r = habitObservedRangeInMonth(h, year, monthIdx, todayTs);
        if (!r) return null;
        const pct = habitPctInMonth(h, year, monthIdx, todayTs);
        const done = habitDoneInMonth(h, year, monthIdx, todayTs);
        const obs = habitDaysObservedInMonth(h, year, monthIdx, todayTs);
        const resp = habitRespirosInMonth(h, year, monthIdx, todayTs);
        return { h, pct, done, obs, resp };
      })
      .filter(Boolean)
      .sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));
  }, [habits, year, monthIdx, todayTs]);

  const overall = overallPctInMonth(habits, year, monthIdx, todayTs);

  return (
    <div style={{
      marginTop: 18,
      border: `1px solid ${accentColor}33`,
      borderRadius: 12,
      background: `${accentColor}06`,
      overflow: "hidden",
      animation: "fadeIn 0.2s ease",
    }}>
      <div style={{
        padding: "14px 16px 12px",
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        gap: 12,
        borderBottom: `1px solid ${accentColor}22`,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.15em",
            textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4,
          }}>
            {tr("maré de")}
          </div>
          <div style={{
            fontFamily: "var(--serif)", fontSize: 22, lineHeight: 1.05,
            color: "var(--ink)", letterSpacing: "-0.01em",
          }}>
            {fmtMonthLong(year, monthIdx)}{" "}
            <span style={{ color: "var(--ink-3)", fontSize: 14 }}>'{String(year).slice(2)}</span>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{
            fontFamily: "var(--serif)", fontSize: 26, lineHeight: 1,
            color: overall === null ? "var(--ink-3)" : accentColor,
          }}>
            {overall === null ? "—" : overall}
            {overall !== null && <span style={{ fontSize: 12, color: "var(--ink-3)" }}>%</span>}
          </div>
          <div style={{
            fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-3)",
            letterSpacing: "0.1em", marginTop: 2,
          }}>
            {tr("no total")}
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div style={{
          padding: "20px 16px",
          fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13,
          color: "var(--ink-3)", textAlign: "center", lineHeight: 1.4,
        }}>
          {tr("Nenhuma maré existia neste mês.")}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {rows.map(({ h, pct, done, obs, resp }, i) => (
            <div key={h.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 16px",
              borderTop: i === 0 ? "none" : "1px solid var(--rule)",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14, color: "var(--ink)", lineHeight: 1.15,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {h.name}
                </div>
                <div style={{
                  fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-3)",
                  letterSpacing: "0.04em", marginTop: 2,
                }}>
                  {done}/{obs - resp} {(obs - resp) === 1 ? tr("dia") : tr("dias")}
                  {resp > 0 && (
                    <span style={{ fontStyle: "italic", marginLeft: 6 }}>
                      · {resp} {resp === 1 ? tr("respiro") : tr("respiros")}
                    </span>
                  )}
                </div>
              </div>
              <MiniBar pct={pct} accentColor={accentColor}/>
              <div style={{
                width: 38, textAlign: "right", flexShrink: 0,
                fontFamily: "var(--mono)", fontSize: 12,
                color: pct === null ? "var(--ink-3)" : "var(--ink)",
              }}>
                {pct === null ? "—" : pct + "%"}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{
        padding: "10px 12px",
        borderTop: `1px solid ${accentColor}22`,
        display: "flex", gap: 8,
      }}>
        <button onClick={onClose} className="tap"
          style={{
            flex: 1, border: "1px solid var(--rule)",
            background: "transparent", borderRadius: 8,
            padding: "8px 10px",
            fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.08em",
            color: "var(--ink-3)", textTransform: "uppercase",
            cursor: "pointer",
          }}>
          {tr("fechar")}
        </button>
        <button onClick={onOpen} className="tap"
          style={{
            flex: 2, border: `1px solid ${accentColor}`,
            background: accentColor, borderRadius: 8,
            padding: "8px 10px",
            fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.08em",
            color: "var(--paper)", textTransform: "uppercase",
            cursor: "pointer",
          }}>
          {tr("abrir grelha do mês →")}
        </button>
      </div>
    </div>
  );
}

function MiniBar({ pct, accentColor }) {
  const w = 56, h = 6;
  if (pct === null) {
    return (
      <div style={{ width: w, height: h, borderRadius: 3, background: "var(--rule)", opacity: 0.4, flexShrink: 0 }}/>
    );
  }
  return (
    <div style={{ width: w, height: h, borderRadius: 3, background: "var(--rule)", flexShrink: 0, overflow: "hidden", position: "relative" }}>
      <div style={{
        position: "absolute", inset: 0,
        width: `${pct}%`,
        background: accentColor,
        borderRadius: 3,
      }}/>
    </div>
  );
}

function stepBtn(accentColor, primary) {
  return {
    width: 40, height: 40, borderRadius: "50%",
    border: primary ? "none" : "1px solid var(--rule)",
    background: primary ? accentColor : "transparent",
    color: primary ? "var(--on-dark)" : "var(--ink-2)",
    fontSize: 22, lineHeight: 1, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  };
}

// ─── Habit Detail Sheet ────────────────────────────────────
function HabitDetailSheet({ open, onClose, habit, accentColor, todayTs,
  onToggleDay, onIncDay, onSetCount, onMarkRespiro, onUnmarkRespiro, onUpdate, onRemove }) {
  if (!open || !habit) return null;
  const isCount = !!habit.target;
  const todayKey = dayKeyOf(todayTs);
  const todayCount = (habit.counts && habit.counts[todayKey]) || 0;

  const stats = habitAllTimeStats(habit, todayTs);
  const current = habitCurrentStreak(habit, todayTs);
  const best = habitBestStreak(habit, todayTs);
  const tier = tideTier(current.days);
  // Cadence-aware unit for the streak displays ("d" / "sem" / "mês").
  const unit = cadenceUnitShort(habitCadence(habit));
  const perLen = unit === "sem" ? 7 : unit === "mês" ? 30 : 1;
  const curCount = current.units != null ? current.units : current.days;

  const [editing, setEditing] = useState(false);
  const [respiroAt, setRespiroAt] = useState(null);  // dayKey when picking reason
  const [respiroNote, setRespiroNote] = useState(null);  // viewing existing respiro

  const headerPhrase = useMemo(() => pickPhrase("detailHeader", habit.id.length), [habit.id]);

  return (
    <Sheet open={open} onClose={onClose} title={tr("Histórico da maré")}>
      <div style={{ padding: "8px 24px 24px" }}>
        {/* Editable header */}
        {editing ? (
          <HabitEditForm
            habit={habit}
            accentColor={accentColor}
            onSave={(patch) => { onUpdate(patch); setEditing(false); }}
            onCancel={() => setEditing(false)}
            onRemove={onRemove}
          />
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "var(--serif)", fontSize: 26, lineHeight: 1.1,
                    color: "var(--ink)", letterSpacing: "-0.01em",
                  }}>
                    {habit.name}
                  </div>
                  {habit.time && (
                    <div style={{
                      fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14,
                      color: "var(--ink-3)", marginTop: 2,
                    }}>
                      {habit.time}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    <div style={{
                      fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em",
                      color: "var(--ink-3)",
                    }}>
                      {trf("desde {date} · {n} {unit}", { date: fmtDateShort(habit.createdAt), n: stats.observed, unit: stats.observed === 1 ? tr("dia") : tr("dias") })}
                    </div>
                    <RecurrenceChip habit={habit} accentColor={accentColor} todayTs={todayTs}/>
                  </div>
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="tap"
                  title={tr("editar")}
                  style={{
                    border: "1px solid var(--rule)",
                    background: "transparent",
                    borderRadius: 8,
                    padding: "6px 10px",
                    fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.08em",
                    color: "var(--ink-3)", textTransform: "uppercase",
                    cursor: "pointer", flexShrink: 0,
                  }}>
                  {tr("editar")}
                </button>
              </div>
              {habit.description && (
                <div style={{
                  marginTop: 12, padding: "10px 12px",
                  background: "var(--paper-2)", borderRadius: 8,
                  fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14,
                  color: "var(--ink-2)", lineHeight: 1.5,
                }}>
                  {habit.description}
                </div>
              )}
              <div style={{
                marginTop: 14,
                fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13,
                color: "var(--ink-3)", lineHeight: 1.4,
              }}>
                {tr(headerPhrase)}
              </div>
            </div>

            {/* Tier badge (if active streak) */}
            {tier && (
              <div style={{
                marginBottom: 18, padding: "12px 14px",
                background: `${accentColor}0a`,
                border: `1px solid ${accentColor}33`,
                borderRadius: 10,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div style={{
                    fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.1em",
                    color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 4,
                  }}>
                    {tr("maré actual")}
                  </div>
                  <div style={{
                    fontFamily: "var(--serif)", fontSize: 22, color: accentColor, lineHeight: 1,
                  }}>
                    {tier.name}
                  </div>
                  <div style={{
                    fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 12,
                    color: "var(--ink-3)", marginTop: 2,
                  }}>
                    {tier.subtitle}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 20, color: "var(--ink)" }}>
                    {curCount}<span style={{ fontSize: 11, color: "var(--ink-3)" }}> {unit}</span>
                  </div>
                  {current.respiros > 0 && (
                    <div style={{
                      fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-3)",
                      marginTop: 2, fontStyle: "italic",
                    }}>
                      {current.respiros} {current.respiros === 1 ? tr("respiro") : tr("respiros")}
                    </div>
                  )}
                  {tier.next && (
                    <div style={{
                      fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-3)",
                      marginTop: 4,
                    }}>
                      {unit === "d"
                        ? trf("→ {name} em {n}d", { name: tier.next.name, n: tier.next.min - current.days })
                        : trf("→ {name} em {n} {u}", { name: tier.next.name, n: Math.max(1, Math.ceil((tier.next.min - current.days) / perLen)), u: unit })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Today's count stepper (countable habits) */}
            {isCount && habitIsActiveOn(habit, todayKey) && (
              <div style={{
                marginBottom: 18, padding: "14px 16px",
                background: "var(--paper-2)", border: "1px solid var(--rule)", borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              }}>
                <div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>
                    {tr("hoje")}
                  </div>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 22, color: todayCount >= habit.target ? accentColor : "var(--ink)" }}>
                    {todayCount} <span style={{ fontSize: 14, color: "var(--ink-3)" }}>/ {habit.target}{habit.unit ? " " + habit.unit : ""}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button onClick={() => { haptic(8); onSetCount(todayKey, Math.max(0, todayCount - 1)); }} className="tap"
                    style={stepBtn(accentColor)} disabled={todayCount <= 0}>−</button>
                  <button onClick={() => { haptic(8); onSetCount(todayKey, todayCount + 1); }} className="tap"
                    style={stepBtn(accentColor, true)}>+</button>
                </div>
              </div>
            )}

            {/* Heatmap */}
            <HeatmapAllTime
              habit={habit}
              accentColor={accentColor}
              todayTs={todayTs}
              isCount={isCount}
              onToggleDay={onToggleDay}
              onIncDay={onIncDay}
              onLongPress={(dayKey) => setRespiroAt(dayKey)}
              onShowRespiro={(dayKey) => setRespiroNote(dayKey)}
              onUnmarkRespiro={onUnmarkRespiro}
            />

            {/* Stats */}
            <div style={{
              marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: 1, background: "var(--rule)",
              border: "1px solid var(--rule)", borderRadius: 8,
              overflow: "hidden",
            }}>
              <Stat label={tr("Total")} value={stats.pct === null ? "—" : stats.pct + "%"} accentColor={accentColor}/>
              <Stat label={tr("Actual")} value={curCount > 0 ? curCount + " " + unit : "—"} accentColor={accentColor}/>
              <Stat label={tr("Melhor")} value={best > 0 ? best + " " + unit : "—"} accentColor={accentColor}/>
              <Stat label={tr("Respiros")} value={stats.respiros > 0 ? stats.respiros : "—"} accentColor={accentColor}/>
            </div>

            {/* Recent respiros list */}
            {Object.keys(habit.respiros || {}).length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{
                  fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.15em",
                  color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 10,
                }}>
                  {tr("respiros")}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {Object.entries(habit.respiros)
                    .sort((a, b) => b[0].localeCompare(a[0]))
                    .slice(0, 8)
                    .map(([dk, r]) => (
                      <div key={dk} style={{
                        display: "flex", gap: 12,
                        padding: "8px 12px",
                        background: "var(--paper-2)",
                        borderRadius: 8,
                        alignItems: "flex-start",
                      }}>
                        <div style={{
                          width: 36, flexShrink: 0,
                          fontFamily: "var(--mono)", fontSize: 10, color: accentColor,
                          letterSpacing: "0.04em",
                        }}>
                          {fmtDateShort(tsFromDayKey(dk))}
                        </div>
                        <div style={{
                          flex: 1, minWidth: 0,
                          fontFamily: "var(--serif)", fontSize: 13, color: "var(--ink-2)",
                          fontStyle: r.reason ? "normal" : "italic",
                        }}>
                          {r.reason || tr("sem motivo")}
                        </div>
                        <button
                          onClick={() => onUnmarkRespiro(dk)}
                          className="tap"
                          title={tr("remover respiro")}
                          style={{
                            border: "none", background: "transparent",
                            color: "var(--ink-3)", cursor: "pointer", padding: 4,
                            fontFamily: "var(--mono)", fontSize: 10,
                          }}>
                          ×
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div style={{
              marginTop: 18,
              fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 12,
              color: "var(--ink-3)", textAlign: "center", lineHeight: 1.5,
            }}>
              {tr("Toque num dia para marcar como feito.")}<br/>
              {tr("Pressão longa num dia falhado para marcar respiro.")}
            </div>
          </>
        )}
      </div>

      {/* Respiro picker (from heatmap long-press) */}
      {respiroAt && (
        <RespiroPickerInline
          dayKey={respiroAt}
          accentColor={accentColor}
          onClose={() => setRespiroAt(null)}
          onConfirm={(reason) => { onMarkRespiro(respiroAt, reason); setRespiroAt(null); }}
        />
      )}
    </Sheet>
  );
}

// Inline respiro picker (used in detail sheet)
function RespiroPickerInline({ dayKey, accentColor, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  return (
    <>
      <div onClick={onClose} style={{
        position: "absolute", inset: 0, zIndex: 300,
        background: "rgba(20,15,10,0.35)",
      }}/>
      <div style={{
        position: "absolute",
        left: "50%", top: "50%", transform: "translate(-50%, -50%)",
        zIndex: 301,
        width: "min(320px, calc(100% - 48px))",
        background: "var(--paper)",
        border: "1px solid var(--rule)",
        borderRadius: 14,
        padding: "18px 18px 16px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
      }}>
        <div style={{
          fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.16em",
          textTransform: "uppercase", color: accentColor, marginBottom: 8,
        }}>
          {fmtDateShort(tsFromDayKey(dayKey))}
        </div>
        <div style={{
          fontFamily: "var(--serif)", fontSize: 19, lineHeight: 1.25,
          color: "var(--ink)", marginBottom: 6,
        }}>
          {tr("Marcar como")} <em style={{ color: accentColor }}>{tr("respiro")}</em>?
        </div>
        <div style={{
          fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13,
          color: "var(--ink-3)", marginBottom: 14,
        }}>
          {tr("A maré também recua. O dia não conta como falha, e a sua maré continua.")}
        </div>
        <input
          autoFocus value={reason}
          onChange={e => setReason(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") onConfirm(reason); }}
          placeholder={tr("motivo (opcional)")}
          style={{
            width: "100%", border: "1px solid var(--rule)",
            background: "var(--paper-2)", borderRadius: 8,
            padding: "10px 12px", fontSize: 14, color: "var(--ink)",
            marginBottom: 14,
          }}/>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>{tr("Cancelar")}</Button>
          <Button onClick={() => onConfirm(reason)} accentColor={accentColor} style={{ flex: 1 }}>
            {tr("Marcar respiro")}
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── Habit edit form ─────────────────────────────────────
function HabitEditForm({ habit, accentColor, onSave, onCancel, onRemove }) {
  const [name, setName] = useState(habit.name || "");
  const [time, setTime] = useState(habit.time || "");
  const [clock, setClock] = useState(habit.clock || "");
  const [description, setDescription] = useState(habit.description || "");
  const [recurrence, setRecurrence] = useState(habit.recurrence || "forever");
  const [countable, setCountable] = useState(!!habit.target);
  const [target, setTarget] = useState(habit.target || 3);
  const [unit, setUnit] = useState(habit.unit || "");
  const [periodDays, setPeriodDays] = useState(() => {
    if (habit.endsAt) return Math.max(1, Math.round((habit.endsAt - habit.createdAt) / 86400000) + 1);
    return 30;
  });

  const save = () => {
    let endsAt = habit.endsAt;
    if (recurrence === "period") {
      endsAt = habit.createdAt + (periodDays - 1) * 86400000;
    } else if (recurrence === "forever") {
      endsAt = null;
    } else if (recurrence === "month") {
      endsAt = null;
    }
    onSave({ name, time, clock, description, recurrence, endsAt,
      target: countable ? Math.max(2, target) : null, unit: countable ? unit : "" });
  };

  return (
    <div style={{ padding: "4px 0" }}>
      <div style={{
        fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em",
        color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 8,
      }}>
        {tr("nome")}
      </div>
      <input value={name} onChange={e => setName(e.target.value)}
        style={{
          width: "100%", border: "1px solid var(--rule)",
          background: "var(--paper-2)", borderRadius: 8,
          padding: "10px 12px", fontSize: 16, color: "var(--ink)",
          marginBottom: 16,
        }}/>

      <div style={{
        fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em",
        color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 8,
      }}>
        {tr("quando")}
      </div>
      <input value={time} onChange={e => setTime(e.target.value)}
        placeholder={tr("ex.: manhã, antes de dormir")}
        style={{
          width: "100%", border: "1px solid var(--rule)",
          background: "var(--paper-2)", borderRadius: 8,
          padding: "10px 12px", fontSize: 14, color: "var(--ink-2)",
          fontFamily: "var(--serif)", fontStyle: "italic",
          marginBottom: 16,
        }}/>

      <div style={{
        fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em",
        color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 8,
      }}>
        {tr("hora certa")}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <input type="time" value={clock} onChange={e => setClock(e.target.value)}
          style={{ border: "1px solid var(--rule)", background: "var(--paper-2)", borderRadius: 8, padding: "8px 10px", fontFamily: "var(--mono)", fontSize: 14, color: "var(--ink)" }}/>
        {clock && (
          <button onClick={() => setClock("")} className="tap" style={{ border: "none", background: "transparent", color: "var(--ink-3)", cursor: "pointer", fontFamily: "var(--mono)", fontSize: 11 }}>{tr("limpar")}</button>
        )}
      </div>

      <div style={{
        fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em",
        color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 8,
      }}>
        {tr("contável")}
      </div>
      <button onClick={() => setCountable(c => !c)} className="tap"
        style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: countable ? 10 : 16,
          border: "none", background: "transparent", cursor: "pointer", padding: 0,
          fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink-2)",
        }}>
        <span style={{
          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
          border: `1.5px solid ${countable ? accentColor : "var(--ink-3)"}`,
          background: countable ? accentColor : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{countable && <Icon.Check size={9} color="var(--on-dark)"/>}</span>
        {tr("meta com quantidade (ex.: 2L de água, 3 treinos)")}
      </button>
      {countable && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <input type="number" min="2" max="99" value={target}
            onChange={e => setTarget(Math.max(2, parseInt(e.target.value) || 2))}
            style={{ width: 56, padding: "6px 8px", border: "1px solid var(--rule)", borderRadius: 6, background: "var(--paper-2)", fontFamily: "var(--mono)", fontSize: 13, color: "var(--ink)" }}/>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>×</span>
          <input value={unit} onChange={e => setUnit(e.target.value)}
            placeholder={tr("unidade")}
            style={{ flex: 1, minWidth: 0, padding: "6px 8px", border: "1px solid var(--rule)", borderRadius: 6, background: "var(--paper-2)", fontSize: 13, color: "var(--ink-2)" }}/>
        </div>
      )}

      <div style={{
        fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em",
        color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 8,
      }}>
        {tr("descrição · porquê esta maré?")}
      </div>
      <textarea value={description} onChange={e => setDescription(e.target.value)}
        placeholder={tr("A intenção, o motivo, o sentimento que quer cultivar.")}
        style={{
          width: "100%", border: "1px solid var(--rule)",
          background: "var(--paper-2)", borderRadius: 8,
          padding: "10px 12px", fontSize: 14, color: "var(--ink-2)",
          fontFamily: "var(--serif)", fontStyle: "italic",
          resize: "vertical", minHeight: 60,
          marginBottom: 16,
        }}/>

      <div style={{
        fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em",
        color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 8,
      }}>
        {tr("recorrência")}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {[
          { key: "forever", label: tr("permanente") },
          { key: "period",  label: tr("por um período") },
          { key: "month",   label: tr("só este mês") },
        ].map(opt => (
          <button key={opt.key}
            onClick={() => setRecurrence(opt.key)}
            className="tap"
            style={{
              flex: 1, minWidth: 90,
              padding: "8px 6px",
              border: `1px solid ${recurrence === opt.key ? accentColor : "var(--rule)"}`,
              background: recurrence === opt.key ? `${accentColor}11` : "var(--paper)",
              color: recurrence === opt.key ? accentColor : "var(--ink-2)",
              borderRadius: 6,
              fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.04em",
              cursor: "pointer",
            }}>
            {opt.label}
          </button>
        ))}
      </div>
      {recurrence === "period" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>
            {tr("durante")}
          </span>
          <input type="number" min="1" max="365" value={periodDays}
            onChange={e => setPeriodDays(Math.max(1, parseInt(e.target.value) || 1))}
            style={{
              width: 60, padding: "4px 8px",
              border: "1px solid var(--rule)", borderRadius: 6,
              background: "var(--paper)",
              fontFamily: "var(--mono)", fontSize: 13, color: "var(--ink)",
            }}/>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>
            {tr("dias a contar da criação")}
          </span>
        </div>
      )}

      <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
        <Button variant="ghost" onClick={onCancel} style={{ flex: 1 }}>{tr("Cancelar")}</Button>
        <Button onClick={save} accentColor={accentColor} disabled={!name.trim()} style={{ flex: 1 }}>{tr("Guardar")}</Button>
      </div>

      <button
        onClick={onRemove}
        className="tap"
        style={{
          marginTop: 14, width: "100%",
          border: "none", background: "transparent",
          padding: "10px",
          fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em",
          color: "var(--ink-3)", textTransform: "uppercase",
          cursor: "pointer",
        }}>
        {tr("remover esta maré")}
      </button>
    </div>
  );
}

// ─── Heatmap (all-time, GitHub-style, weeks as columns) ───
function HeatmapAllTime({ habit, accentColor, todayTs, isCount, onToggleDay, onIncDay, onLongPress, onShowRespiro, onUnmarkRespiro }) {
  const [hover, setHover] = useState(null);

  const todayKey = dayKeyOf(todayTs);
  const createdKey = habitCreatedKey(habit);
  const habitEnd = habitEndKey(habit);

  const { columns, monthLabels } = useMemo(() => {
    const createdTs = tsFromDayKey(createdKey);
    const startD = new Date(createdTs);
    startD.setDate(startD.getDate() - startD.getDay());
    const endD = new Date(todayTs);
    endD.setDate(endD.getDate() + (6 - endD.getDay()));

    const totalDays = Math.floor((endD - startD) / 86400000) + 1;
    const totalWeeks = Math.ceil(totalDays / 7);

    const cols = [];
    const labels = [];
    let lastMonth = -1;
    for (let w = 0; w < totalWeeks; w++) {
      const col = [];
      for (let day = 0; day < 7; day++) {
        const cellD = new Date(startD); cellD.setDate(startD.getDate() + w*7 + day);
        const key = dayKeyOf(cellD);
        let state;
        if (key > todayKey) state = "future";
        else if (key < createdKey) state = "pre";
        else if (habitEnd && key > habitEnd) state = "after";
        else if (habit.log && habit.log[key]) state = "done";
        else if (habit.respiros && habit.respiros[key]) state = "respiro";
        else if (isCount && habit.counts && habit.counts[key] > 0) state = "partial";
        else state = "empty";
        const count = (isCount && habit.counts && habit.counts[key]) || 0;
        col.push({ key, state, isToday: key === todayKey, date: cellD, count });

        if (day === 0) {
          const m = cellD.getMonth();
          if (m !== lastMonth) {
            labels.push({ weekIdx: w, label: fmtMonthShort(cellD.getFullYear(), m) });
            lastMonth = m;
          }
        }
      }
      cols.push(col);
    }
    return { columns: cols, monthLabels: labels };
  }, [habit, todayTs, createdKey, todayKey, habitEnd, isCount]);

  const CELL = 11, GAP = 3;

  return (
    <div style={{ overflowX: "auto", paddingBottom: 6 }}>
      <div style={{ display: "inline-block", minWidth: "100%" }}>
        <div style={{
          position: "relative", height: 14,
          marginLeft: 16,
        }}>
          {monthLabels.map((ml, i) => (
            <div key={i} style={{
              position: "absolute",
              left: ml.weekIdx * (CELL + GAP),
              fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-3)",
              letterSpacing: "0.05em",
            }}>{ml.label}</div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
          <div style={{
            display: "flex", flexDirection: "column", gap: GAP,
            width: 12, fontFamily: "var(--mono)", fontSize: 8,
            color: "var(--ink-3)", paddingTop: 0,
          }}>
            {["", tr("s"), "", tr("q"), "", tr("s"), ""].map((lbl, i) => (
              <div key={i} style={{ height: CELL, lineHeight: CELL + "px" }}>{lbl}</div>
            ))}
          </div>

          <div style={{ display: "flex", gap: GAP, position: "relative" }}>
            {columns.map((col, w) => (
              <div key={w} style={{ display: "flex", flexDirection: "column", gap: GAP }}>
                {col.map((cell, day) => (
                  <HeatmapCell
                    key={day}
                    cell={cell}
                    accentColor={accentColor}
                    cellSize={CELL}
                    target={isCount ? habit.target : null}
                    onTap={() => {
                      if (isCount) {
                        if (cell.state === "respiro") onUnmarkRespiro(cell.key);
                        else onIncDay(cell.key);
                      } else {
                        if (cell.state === "empty") onToggleDay(cell.key);
                        else if (cell.state === "done") onToggleDay(cell.key);
                        else if (cell.state === "respiro") onUnmarkRespiro(cell.key);
                      }
                    }}
                    onLongPress={() => { if (cell.state === "empty") onLongPress(cell.key); }}
                    onHover={setHover}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {hover && (
        <div style={{
          marginTop: 10,
          fontFamily: "var(--mono)", fontSize: 10,
          color: "var(--ink-2)", textAlign: "center",
        }}>
          {fmtDateShort(hover.date.getTime())}
          {hover.state === "done" && (isCount ? ` · ${habit.target}/${habit.target}` : " · " + tr("feito"))}
          {hover.state === "partial" && ` · ${hover.count}/${habit.target}`}
          {hover.state === "empty" && " · " + tr("não feito")}
          {hover.state === "respiro" && " · " + tr("respiro")
            + (habit.respiros[hover.key]?.reason ? ` — ${habit.respiros[hover.key].reason}` : "")}
          {hover.state === "pre" && " · " + tr("antes da maré")}
          {hover.state === "after" && " · " + tr("maré já terminou")}
          {hover.state === "future" && " · " + tr("ainda não chegou")}
        </div>
      )}
    </div>
  );
}

function HeatmapCell({ cell, accentColor, cellSize, target, onTap, onLongPress, onHover }) {
  const pressTimer = useRef(null);
  const pressed = useRef(false);
  const startPress = () => {
    if (cell.state !== "empty") return;
    pressed.current = false;
    pressTimer.current = setTimeout(() => { pressed.current = true; onLongPress(); }, 450);
  };
  const endPress = () => { if (pressTimer.current) clearTimeout(pressTimer.current); pressTimer.current = null; };
  const isPartial = cell.state === "partial";
  const partialFrac = isPartial && target ? Math.min(1, cell.count / target) : 0;
  const clickable = cell.state === "empty" || cell.state === "done" || cell.state === "respiro" || isPartial;

  return (
    <div
      onClick={() => { if (pressed.current) { pressed.current = false; return; } if (clickable) { if (window.haptic) window.haptic(8); onTap(); } }}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={() => { endPress(); onHover(null); }}
      onMouseEnter={() => onHover(cell)}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchMove={endPress}
      onContextMenu={(e) => { if (cell.state === "empty") { e.preventDefault(); pressed.current = true; onLongPress(); } }}
      style={{
        width: cellSize, height: cellSize, borderRadius: 2,
        background:
          cell.state === "done" ? (cell.isToday ? accentColor : "var(--ink)") :
          "transparent",
        border:
          cell.state === "empty" ? "1px solid var(--ink-3)" :
          cell.state === "pre"   ? "1px solid var(--ink-3)" :
          cell.state === "after" ? "1px solid var(--rule)" :
          cell.state === "future" ? "1px dashed var(--rule)" :
          cell.state === "respiro" ? "1px solid var(--ink-3)" :
          isPartial ? "1px solid var(--ink-3)" :
          "none",
        boxSizing: "border-box",
        opacity:
          cell.state === "future" ? 0.35 :
          cell.state === "pre" ? 0.55 :
          cell.state === "after" ? 0.35 : 1,
        boxShadow: cell.isToday && cell.state === "done" ? `0 0 0 2px ${accentColor}33` :
                   (cell.isToday && cell.state !== "done" ? `inset 0 0 0 1px ${accentColor}88` : "none"),
        cursor: clickable ? "pointer" : "default",
        transition: "background 0.15s",
        display: "flex", alignItems: "center", justifyContent: "center",
        userSelect: "none", WebkitUserSelect: "none",
        position: "relative",
        overflow: "hidden",
      }}>
      {cell.state === "pre" && (
        <div style={{
          width: 3, height: 3, borderRadius: "50%",
          background: "var(--ink-3)", opacity: 0.7,
        }}/>
      )}
      {cell.state === "respiro" && (
        <RespiroPattern color={accentColor}/>
      )}
      {isPartial && (
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          height: `${Math.max(15, partialFrac * 100)}%`,
          background: accentColor, opacity: 0.55,
        }}/>
      )}
    </div>
  );
}

Object.assign(window, { TrendSheet, HabitDetailSheet, WaveChart, HeatmapAllTime });

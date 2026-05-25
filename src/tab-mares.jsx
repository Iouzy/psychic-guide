// Tab: MARÉS — habit tracker
//
// Modelo: meses de calendário; respiros honestos; streaks com tiers (Onda → Oceano);
//   hábitos com recorrência (permanente / período / mês único).

function TabMares({ store, accentColor }) {
  const { state, addHabit, toggleHabitDay, markRespiro, unmarkRespiro, removeHabit, updateHabit, incHabitDay, setHabitCount } = store;
  const { habits } = state;

  const now = useNow(60000, true);
  const todayKey = dayKeyOf(now);
  const todayD = new Date(now);
  const [view, setView] = useState({ y: todayD.getFullYear(), m: todayD.getMonth() });

  const [adding, setAdding] = useState(false);

  // Sheets
  const [trendOpen, setTrendOpen] = useState(false);
  const [detailHabitId, setDetailHabitId] = useState(null);
  // Respiro popover: { habitId, dayKey, anchorRect }
  const [respiroAt, setRespiroAt] = useState(null);

  // Filter habits to those that existed at any point in the visible month
  const visibleHabits = useMemo(() => habits.filter(h => {
    const r = habitObservedRangeInMonth(h, view.y, view.m, now);
    return r !== null;
  }), [habits, view, now]);

  const overall = useMemo(() => overallPctInMonth(habits, view.y, view.m, now), [habits, view, now]);
  const homePhrase = useMemo(() => pickHomePhrase(habits, now), [habits, now]);

  const isCurrentMonth = view.y === todayD.getFullYear() && view.m === todayD.getMonth();

  return (
    <div className="scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 0 30px", position: "relative", zIndex: 1 }}>
      {/* Month strip + legend */}
      <MonthStrip
        habits={habits}
        view={view}
        setView={setView}
        accentColor={accentColor}
        todayTs={now}
      />

      <div style={{ padding: "0 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 22, marginTop: 18 }}>
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>
              {isCurrentMonth ? tr("Maré actual") : tr("Maré passada")}
            </div>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: 38, lineHeight: 1.0, margin: 0, fontWeight: 400, letterSpacing: "-0.015em" }}>
              {fmtMonthLong(view.y, view.m)}
            </h1>
          </div>
          <button
            onClick={() => setTrendOpen(true)}
            className="tap"
            title={tr("ver marés passadas")}
            style={{
              textAlign: "right",
              border: "none", background: "transparent",
              cursor: "pointer", padding: 0,
            }}>
            <div style={{ fontFamily: "var(--serif)", fontSize: 30, lineHeight: 1, color: overall === null ? "var(--ink-3)" : accentColor }}>
              {overall === null ? "—" : overall}
              {overall !== null && <span style={{ fontSize: 14, color: "var(--ink-3)" }}>%</span>}
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-3)", marginTop: 2 }}>
              {tr("marés passadas")} ↗
            </div>
          </button>
        </div>

        {/* Empty state */}
        {habits.length === 0 && !adding && (
          <div style={{
            padding: "24px 0", fontFamily: "var(--serif)", fontStyle: "italic",
            fontSize: 17, color: "var(--ink-3)", lineHeight: 1.4,
          }}>
            {pickPhrase("intro")}<br/><br/>
            <span style={{ fontSize: 14 }}>{tr("Adicione comportamentos que quer praticar regularmente. Cada mês tem o seu grid.")}</span>
          </div>
        )}

        {/* Como funciona — hint persistente, subtil */}
        {habits.length > 0 && (
          <div style={{
            marginBottom: 18,
            padding: "10px 12px",
            background: "var(--paper-2)",
            border: "1px solid var(--rule)",
            borderRadius: 8,
            fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.04em",
            color: "var(--ink-3)", lineHeight: 1.55,
            display: "flex", flexDirection: "column", gap: 2,
          }}>
            <div>
              <span style={{ color: "var(--ink-2)" }}>{tr("toque")}</span> {tr("marca feito")} ·{" "}
              <span style={{ color: "var(--ink-2)" }}>{tr("pressão longa")}</span> {tr("num dia vazio marca respiro")}
            </div>
            <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 12, marginTop: 2 }}>
              {tr("dias passados são editáveis — a honestidade é o melhor amigo da maré.")}
            </div>
          </div>
        )}

        {/* Habits */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {visibleHabits.map(h => (
            <HabitRow
              key={h.id}
              habit={h}
              year={view.y}
              monthIdx={view.m}
              todayTs={now}
              accentColor={accentColor}
              onToggleDay={(k) => toggleHabitDay(h.id, k)}
              onIncDay={(k) => incHabitDay(h.id, k)}
              onLongPressEmpty={(dayKey, anchorRect) => setRespiroAt({ habitId: h.id, dayKey, anchorRect })}
              onUnmarkRespiro={(dayKey) => unmarkRespiro(h.id, dayKey)}
              onOpenDetail={() => setDetailHabitId(h.id)}
              onRemove={() => { if (confirm(tr("Remover esta maré? Todo o histórico será perdido."))) removeHabit(h.id); }}
              onUpdate={(patch) => updateHabit(h.id, patch)}
            />
          ))}
        </div>

        {/* Habits not in this month */}
        {habits.length > visibleHabits.length && (
          <div style={{
            marginTop: 18, paddingTop: 12,
            borderTop: "1px solid var(--rule)",
            fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13,
            color: "var(--ink-3)", textAlign: "center", lineHeight: 1.4,
          }}>
            {habits.length - visibleHabits.length} {habits.length - visibleHabits.length === 1 ? tr("maré ainda não existia") : tr("marés ainda não existiam")} {trf("em {month}.", { month: fmtMonthLong(view.y, view.m) })}
          </div>
        )}

        {/* Add habit */}
        {isCurrentMonth && (
          adding ? (
            <NewHabitForm
              accentColor={accentColor}
              onSubmit={(data) => { addHabit(data.name, data.time, data); setAdding(false); }}
              onCancel={() => setAdding(false)}
            />
          ) : (
            <button onClick={() => setAdding(true)} className="tap"
              style={{
                marginTop: 20, width: "100%",
                border: "1.5px dashed var(--rule)", borderRadius: 12,
                padding: "16px",
                background: "transparent", color: "var(--ink-3)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                cursor: "pointer", fontSize: 14,
              }}>
              <Icon.Plus size={14}/>
              <span>{tr("adicionar maré")}</span>
            </button>
          )
        )}

        {/* Rotating mantra */}
        {habits.length > 0 && (
          <div style={{
            marginTop: 28, paddingTop: 16, borderTop: "1px solid var(--rule)",
            fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13,
            color: "var(--ink-3)", textAlign: "center", lineHeight: 1.4,
          }}>
            "{homePhrase}"
          </div>
        )}
      </div>

      {/* Sheets / popovers */}
      <TrendSheet
        open={trendOpen}
        onClose={() => setTrendOpen(false)}
        habits={habits}
        accentColor={accentColor}
        todayTs={now}
        onPickMonth={(y, m) => { setView({ y, m }); setTrendOpen(false); }}
      />
      <HabitDetailSheet
        open={!!detailHabitId}
        onClose={() => setDetailHabitId(null)}
        habit={habits.find(h => h.id === detailHabitId)}
        accentColor={accentColor}
        todayTs={now}
        onToggleDay={(k) => detailHabitId && toggleHabitDay(detailHabitId, k)}
        onIncDay={(k) => detailHabitId && incHabitDay(detailHabitId, k)}
        onSetCount={(k, n) => detailHabitId && setHabitCount(detailHabitId, k, n)}
        onMarkRespiro={(k, reason) => detailHabitId && markRespiro(detailHabitId, k, reason)}
        onUnmarkRespiro={(k) => detailHabitId && unmarkRespiro(detailHabitId, k)}
        onUpdate={(patch) => detailHabitId && updateHabit(detailHabitId, patch)}
        onRemove={() => {
          if (detailHabitId && confirm(tr("Remover esta maré? Todo o histórico será perdido."))) {
            removeHabit(detailHabitId);
            setDetailHabitId(null);
          }
        }}
      />
      <RespiroPopover
        data={respiroAt}
        accentColor={accentColor}
        onClose={() => setRespiroAt(null)}
        onConfirm={(reason) => {
          if (respiroAt) markRespiro(respiroAt.habitId, respiroAt.dayKey, reason);
          setRespiroAt(null);
        }}
      />
    </div>
  );
}

// ─── Month strip (horizontal nav) ─────────────────────────
function MonthStrip({ habits, view, setView, accentColor, todayTs }) {
  const scrollRef = useRef(null);
  const months = useMemo(() => habitsAllMonths(habits, todayTs), [habits, todayTs]);
  const todayD = new Date(todayTs);
  const isCurrentMonth = view.y === todayD.getFullYear() && view.m === todayD.getMonth();
  const ordered = useMemo(() => [...months].reverse(), [months]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current.querySelector('[data-active="true"]');
    if (el) el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [view]);

  return (
    <div style={{
      display: "flex", alignItems: "center",
      padding: "8px 24px 4px",
      gap: 12,
    }}>
      <div
        ref={scrollRef}
        data-noswipe="true"
        style={{
          display: "flex", overflowX: "auto", gap: 4,
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
          flex: 1, minWidth: 0,
        }}>
        {ordered.map(({ y, m }) => {
          const active = y === view.y && m === view.m;
          const isCurrent = y === todayD.getFullYear() && m === todayD.getMonth();
          return (
            <button
              key={`${y}-${m}`}
              data-active={active}
              onClick={() => setView({ y, m })}
              className="tap"
              style={{
                border: "none", background: "transparent",
                padding: "6px 10px", borderRadius: 8,
                fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.08em",
                textTransform: "uppercase", whiteSpace: "nowrap",
                color: active ? accentColor : (isCurrent ? "var(--ink-2)" : "var(--ink-3)"),
                fontWeight: active ? 600 : 400,
                cursor: "pointer", flexShrink: 0,
                position: "relative",
              }}>
              {fmtMonthShort(y, m)}
              <span style={{ opacity: 0.5, marginLeft: 4, fontSize: 9 }}>'{String(y).slice(2)}</span>
              {active && (
                <span style={{
                  position: "absolute", bottom: -2, left: "50%",
                  transform: "translateX(-50%)",
                  width: 4, height: 4, borderRadius: "50%",
                  background: accentColor,
                }}/>
              )}
            </button>
          );
        })}
        {!isCurrentMonth && (
          <button
            onClick={() => setView({ y: todayD.getFullYear(), m: todayD.getMonth() })}
            className="tap"
            title={tr("voltar para o mês actual")}
            style={{
              border: "none", background: "transparent",
              padding: "6px 10px", borderRadius: 8,
              fontFamily: "var(--mono)", fontSize: 11,
              color: accentColor, cursor: "pointer", flexShrink: 0,
              marginLeft: 4,
            }}>
            ↺
          </button>
        )}
      </div>

      <GridLegend accentColor={accentColor}/>
    </div>
  );
}

// ─── Grid legend ──────────────────────────────────────────
function GridLegend({ accentColor }) {
  const [open, setOpen] = useState(false);
  const Sw = ({ kind }) => (
    <div style={{
      width: 9, height: 9, borderRadius: 2,
      flexShrink: 0,
      background: kind === "done" ? "var(--ink)" : "transparent",
      border:
        kind === "empty" ? "1px solid var(--ink-3)" :
        kind === "pre" ? "1px solid var(--ink-3)" :
        kind === "future" ? "1px dashed var(--rule)" :
        "none",
      boxSizing: "border-box",
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: kind === "future" ? 0.5 : (kind === "pre" ? 0.5 : 1),
    }}>
      {kind === "pre" && (
        <div style={{
          width: 2.5, height: 2.5, borderRadius: "50%",
          background: "var(--ink-3)",
        }}/>
      )}
      {kind === "respiro" && (
        <RespiroPattern color={accentColor}/>
      )}
    </div>
  );
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="tap"
        title={tr("legenda")}
        style={{
          border: "1px solid var(--rule)",
          background: open ? "var(--paper-2)" : "transparent",
          borderRadius: 8,
          padding: "5px 8px",
          display: "flex", alignItems: "center", gap: 5,
          cursor: "pointer",
        }}>
        <Sw kind="done"/>
        <Sw kind="empty"/>
        <Sw kind="pre"/>
        <span style={{
          marginLeft: 3,
          fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.08em",
          color: "var(--ink-3)", textTransform: "uppercase",
        }}>
          {tr("legenda")}
        </span>
      </button>
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          right: 0,
          background: "var(--paper)",
          border: "1px solid var(--rule)",
          borderRadius: 10,
          padding: "12px 14px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          zIndex: 10,
          width: 210,
          fontFamily: "var(--mono)",
          fontSize: 11,
          color: "var(--ink-2)",
          letterSpacing: "0.02em",
        }}>
          <LegendRow swatch={<Sw kind="done"/>} label={tr("feito")}/>
          <LegendRow swatch={
            <div style={{
              width: 9, height: 9, borderRadius: 2,
              background: accentColor,
              boxShadow: `0 0 0 2px ${accentColor}33`,
            }}/>
          } label={tr("feito hoje")}/>
          <LegendRow swatch={<Sw kind="empty"/>} label={tr("não feito")}/>
          <LegendRow swatch={
            <div style={{
              width: 9, height: 9, borderRadius: 2,
              border: `1.5px solid ${accentColor}`,
              boxSizing: "border-box",
            }}/>
          } label={tr("hoje (por fazer)")}/>
          <LegendRow swatch={
            <div style={{
              width: 9, height: 9, borderRadius: 2,
              background: "transparent",
              border: "1px solid var(--ink-3)",
              boxSizing: "border-box",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
            }}>
              <RespiroPattern color={accentColor} small/>
            </div>
          } label={tr("respiro")}/>
          <LegendRow swatch={<Sw kind="pre"/>} label={tr("antes da maré")}/>
          <LegendRow swatch={<Sw kind="future"/>} label={tr("ainda não chegou")} last/>
          <div style={{
            marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--rule)",
            fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 11,
            color: "var(--ink-3)", lineHeight: 1.4,
          }}>
            {tr("Pressão longa num dia não feito para marcar respiro.")}
          </div>
        </div>
      )}
    </div>
  );
}

function LegendRow({ swatch, label, last }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "5px 0",
      borderBottom: last ? "none" : "1px solid var(--rule)",
    }}>
      <div style={{ width: 12, display: "flex", justifyContent: "center" }}>{swatch}</div>
      <span>{label}</span>
    </div>
  );
}

// Respiro visual: diagonal hatching pattern inside a cell.
function RespiroPattern({ color, small }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 10 10" preserveAspectRatio="none"
      style={{ display: "block" }}>
      <defs>
        <pattern id={`hatch-${color}`} patternUnits="userSpaceOnUse" width="3" height="3" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="3" stroke={color} strokeWidth={small ? "1" : "1.4"} opacity="0.7"/>
        </pattern>
      </defs>
      <rect width="10" height="10" fill={`url(#hatch-${color})`}/>
    </svg>
  );
}

// ─── Habit row (month grid) ─────────────────────────────────
function HabitRow({ habit, year, monthIdx, todayTs, accentColor,
  onToggleDay, onIncDay, onLongPressEmpty, onUnmarkRespiro, onOpenDetail, onRemove, onUpdate }) {
  const [hover, setHover] = useState(false);
  const [tooltip, setTooltip] = useState(null);

  const ndays = daysInMonth(year, monthIdx);
  const todayD = new Date(todayTs);
  const todayKey = dayKeyOf(todayTs);
  const createdKey = habitCreatedKey(habit);
  const habitEnd = habitEndKey(habit);
  const isCount = !!habit.target;
  const todayCount = (habit.counts && habit.counts[todayKey]) || 0;

  const pct = habitPctInMonth(habit, year, monthIdx, todayTs);
  const obs = habitDaysObservedInMonth(habit, year, monthIdx, todayTs) - habitRespirosInMonth(habit, year, monthIdx, todayTs);
  const isMature = obs >= HABIT_MATURITY_DAYS;

  const isCurrentMonth = year === todayD.getFullYear() && monthIdx === todayD.getMonth();
  const streak = isCurrentMonth ? habitCurrentStreak(habit, todayTs) : { days: 0, respiros: 0 };
  const bestStreak = habitBestStreak(habit, todayTs);

  const days = useMemo(() => {
    const out = [];
    for (let d = 1; d <= ndays; d++) {
      const key = dayKeyFromYMD(year, monthIdx, d);
      let state;
      if (key > todayKey) state = "future";
      else if (key < createdKey) state = "pre";
      else if (habitEnd && key > habitEnd) state = "after";
      else if (habit.log && habit.log[key]) state = "done";
      else if (habit.respiros && habit.respiros[key]) state = "respiro";
      else if (isCount && habit.counts && habit.counts[key] > 0) state = "partial";
      else state = "empty";
      const isToday = key === todayKey;
      const count = (isCount && habit.counts && habit.counts[key]) || 0;
      out.push({ d, key, state, isToday, count });
    }
    return out;
  }, [habit, year, monthIdx, ndays, todayKey, createdKey, habitEnd, isCount]);

  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setTooltip(null); }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 10 }}>
        <button
          onClick={onOpenDetail}
          className="tap"
          title={tr("ver histórico completo")}
          style={{
            flex: 1, minWidth: 0, textAlign: "left",
            border: "none", background: "transparent", padding: 0, cursor: "pointer",
          }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: "var(--ink)", lineHeight: 1.1 }}>
              {habit.name}
            </div>
            <RecurrenceChip habit={habit} accentColor={accentColor} todayTs={todayTs}/>
            {isCount && (
              <span style={{
                fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.06em",
                color: accentColor, padding: "2px 6px", borderRadius: 4,
                border: `1px solid ${accentColor}55`,
              }}>
                {todayCount}/{habit.target}{habit.unit ? " " + habit.unit : tr("×")}
              </span>
            )}
          </div>
          {(habit.time || habit.clock) && (
            <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>
              {habit.clock && <span style={{ fontFamily: "var(--mono)", fontStyle: "normal", fontSize: 11, marginRight: habit.time ? 6 : 0 }}>{habit.clock}</span>}
              {habit.time}
            </div>
          )}
        </button>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            {pct === null ? (
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)" }}>—</div>
            ) : (
              <>
                <div style={{
                  fontFamily: "var(--mono)", fontSize: 11,
                  color: isMature ? "var(--ink-2)" : "var(--ink-3)",
                  fontStyle: isMature ? "normal" : "italic",
                }}>
                  {pct}%
                </div>
                {!isMature && (
                  <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-3)", marginTop: 2 }}>
                    {trf("dia {obs}/{total}", { obs, total: HABIT_MATURITY_DAYS })}
                  </div>
                )}
                {isMature && streak.days >= 1 && (
                  <div style={{ marginTop: 4 }}>
                    <TideTierBadge streak={streak} accentColor={accentColor}/>
                  </div>
                )}
              </>
            )}
          </div>
          {hover && (
            <button onClick={onRemove} className="tap" title={tr("remover")}
              style={{ width: 24, height: 24, borderRadius: 5, border: "none", background: "transparent", color: "var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Icon.Trash size={12}/>
            </button>
          )}
        </div>
      </div>

      {/* Month strip — pulse of days */}
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", gap: 2, alignItems: "center", padding: "4px 0" }}>
          {days.map((day) => (
            <DayCell
              key={day.key}
              day={day}
              accentColor={accentColor}
              ndays={ndays}
              target={isCount ? habit.target : null}
              onTap={() => {
                if (isCount) {
                  if (day.state === "respiro") onUnmarkRespiro(day.key);
                  else onIncDay(day.key);
                } else {
                  if (day.state === "empty") onToggleDay(day.key);
                  else if (day.state === "done") onToggleDay(day.key);
                  else if (day.state === "respiro") onUnmarkRespiro(day.key);
                }
              }}
              onLongPress={(rect) => {
                if (day.state === "empty") onLongPressEmpty(day.key, rect);
              }}
              onTooltip={setTooltip}
            />
          ))}
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: "absolute",
            bottom: "calc(100% + 2px)",
            left: `${((tooltip.d - 0.5) / ndays) * 100}%`,
            transform: "translateX(-50%)",
            background: "var(--surface-dark)",
            color: "var(--on-dark)",
            padding: "3px 7px",
            borderRadius: 4,
            fontFamily: "var(--mono)",
            fontSize: 10,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 5,
          }}>
            {fmtDateShort(tsFromDayKey(tooltip.key))}
            {tooltip.state === "done" && (isCount ? ` · ${habit.target}/${habit.target}` : " · " + tr("feito"))}
            {tooltip.state === "partial" && ` · ${tooltip.count}/${habit.target}`}
            {tooltip.state === "empty" && " · " + tr("não feito")}
            {tooltip.state === "respiro" && " · " + tr("respiro")}
            {tooltip.state === "pre" && " · " + tr("antes da maré")}
            {tooltip.state === "after" && " · " + tr("maré já terminou")}
            {tooltip.state === "future" && " · " + tr("ainda não")}
          </div>
        )}
      </div>

      {/* Best streak */}
      {bestStreak >= 3 && (
        <div style={{
          marginTop: 6,
          fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-3)",
          letterSpacing: "0.08em",
        }}>
          {trf("melhor: {n} dias", { n: bestStreak })}
        </div>
      )}
    </div>
  );
}

// Individual day cell with long-press detection.
function DayCell({ day, accentColor, ndays, target, onTap, onLongPress, onTooltip }) {
  const pressTimer = useRef(null);
  const pressed = useRef(false);
  const cellRef = useRef(null);

  const isPartial = day.state === "partial";
  const clickable = day.state === "empty" || day.state === "done" || day.state === "respiro" || isPartial;
  const filled = day.state === "done";
  const isRespiro = day.state === "respiro";
  const isToday = day.isToday;
  const partialFrac = isPartial && target ? Math.min(1, day.count / target) : 0;

  const startPress = (e) => {
    if (day.state !== "empty") return;
    pressed.current = false;
    pressTimer.current = setTimeout(() => {
      pressed.current = true;
      const rect = cellRef.current?.getBoundingClientRect();
      onLongPress(rect);
    }, 450);
  };
  const endPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
    pressed.current = false;
  };

  return (
    <div
      ref={cellRef}
      onClick={(e) => {
        if (pressed.current) { pressed.current = false; return; }
        if (clickable) { if (window.haptic) window.haptic(8); onTap(); }
      }}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={() => { cancelPress(); onTooltip(null); }}
      onMouseEnter={() => onTooltip(day)}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchMove={cancelPress}
      onContextMenu={(e) => {
        if (day.state === "empty") {
          e.preventDefault();
          const rect = cellRef.current?.getBoundingClientRect();
          pressed.current = true;
          onLongPress(rect);
        }
      }}
      title={fmtDateShort(tsFromDayKey(day.key))}
      style={{
        flex: 1, aspectRatio: "1", minWidth: 0,
        borderRadius: 2,
        background: filled ? (isToday ? accentColor : "var(--ink)") : "transparent",
        // Borders per state (incl. pre-criação with outline + dot, per user request)
        border:
          day.state === "empty" ? "1px solid var(--ink-3)" :
          day.state === "pre" ? "1px solid var(--ink-3)" :
          day.state === "after" ? "1px solid var(--rule)" :
          day.state === "future" ? "1px dashed var(--rule)" :
          isRespiro ? "1px solid var(--ink-3)" :
          isPartial ? "1px solid var(--ink-3)" :
          "none",
        boxSizing: "border-box",
        opacity:
          day.state === "future" ? 0.45 :
          day.state === "pre" ? 0.55 :
          day.state === "after" ? 0.35 : 1,
        cursor: clickable ? "pointer" : "default",
        position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
        ...(isToday && !filled ? {
          border: `1.5px solid ${accentColor}`,
        } : {}),
        ...(isToday && filled ? {
          boxShadow: `0 0 0 2px ${accentColor}33`,
        } : {}),
        userSelect: "none",
        WebkitUserSelect: "none",
        transition: "background 0.15s, transform 0.08s",
      }}>
      {day.state === "pre" && (
        <div style={{
          width: "30%", height: "30%",
          borderRadius: "50%",
          background: "var(--ink-3)",
          opacity: 0.7,
        }}/>
      )}
      {isRespiro && (
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

// ─── Respiro popover ──────────────────────────────────────
function RespiroPopover({ data, accentColor, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  useEffect(() => { if (data) setReason(""); }, [data]);
  if (!data) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0, zIndex: 200,
          background: "rgba(20,15,10,0.35)",
          backdropFilter: "blur(2px)",
          animation: "fadeIn 0.18s ease",
        }}/>
      {/* Popover (centered modal) */}
      <div style={{
        position: "absolute",
        left: "50%", top: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 201,
        width: "min(320px, calc(100% - 48px))",
        background: "var(--paper)",
        border: "1px solid var(--rule)",
        borderRadius: 14,
        padding: "18px 18px 16px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
        animation: "fadeIn 0.18s ease",
      }}>
        <div style={{
          fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.16em",
          textTransform: "uppercase", color: accentColor, marginBottom: 8,
        }}>
          {fmtDateShort(tsFromDayKey(data.dayKey))}
        </div>
        <div style={{
          fontFamily: "var(--serif)", fontSize: 19, lineHeight: 1.25,
          color: "var(--ink)", marginBottom: 6, letterSpacing: "-0.01em",
        }}>
          {tr("Marcar este dia como")} <em style={{ color: accentColor }}>{tr("respiro")}</em>?
        </div>
        <div style={{
          fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13,
          color: "var(--ink-3)", marginBottom: 14, lineHeight: 1.4,
        }}>
          {tr("A maré também recua. O dia não conta como falha, e a sua maré continua.")}
        </div>
        <input
          autoFocus
          value={reason}
          onChange={e => setReason(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") onConfirm(reason); }}
          placeholder={tr("motivo (opcional) — ex.: doente, viagem, sem vontade")}
          style={{
            width: "100%", border: "1px solid var(--rule)",
            background: "var(--paper-2)",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 14,
            color: "var(--ink)",
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

// ─── New habit form ──────────────────────────────────────
function NewHabitForm({ accentColor, onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [time, setTime] = useState("");
  const [clock, setClock] = useState("");
  const [description, setDescription] = useState("");
  const [recurrence, setRecurrence] = useState("forever");
  const [periodDays, setPeriodDays] = useState(30);
  const [countable, setCountable] = useState(false);
  const [target, setTarget] = useState(3);
  const [unit, setUnit] = useState("");
  const [expanded, setExpanded] = useState(false);

  const submit = () => {
    if (!name.trim()) return;
    let endsAt = null;
    if (recurrence === "period") {
      endsAt = Date.now() + (periodDays - 1) * 86400000;
    }
    onSubmit({ name, time, clock, description, recurrence, endsAt,
      target: countable ? Math.max(2, target) : null, unit: countable ? unit : "" });
  };

  return (
    <div style={{
      marginTop: 18, padding: "16px 18px",
      border: "1px solid " + accentColor, borderRadius: 12,
      background: "var(--paper-2)",
    }}>
      <input autoFocus value={name} onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && !expanded) submit(); }}
        placeholder={tr("Nome da maré (ex.: meditar)")}
        style={{ width: "100%", border: "none", background: "transparent", padding: 0, fontSize: 16, color: "var(--ink)", marginBottom: 10 }}/>
      <input value={time} onChange={e => setTime(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && !expanded) submit(); }}
        placeholder={tr("Quando? (opcional, ex.: manhã)")}
        style={{ width: "100%", border: "none", background: "transparent", padding: 0, fontSize: 13, color: "var(--ink-2)", fontFamily: "var(--serif)", fontStyle: "italic", marginBottom: 10 }}/>

      {!expanded && (
        <button onClick={() => setExpanded(true)} className="tap"
          style={{
            background: "transparent", border: "none",
            fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em",
            color: "var(--ink-3)", textTransform: "uppercase", cursor: "pointer",
            padding: "4px 0",
          }}>
          {tr("+ mais opções (descrição, recorrência)")}
        </button>
      )}

      {expanded && (
        <>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder={tr("Porquê esta maré? (opcional)")}
            style={{
              width: "100%", border: "1px solid var(--rule)",
              background: "var(--paper)",
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 13,
              color: "var(--ink-2)",
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              resize: "vertical",
              minHeight: 50,
              marginBottom: 12,
            }}/>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", color: "var(--ink-3)", textTransform: "uppercase" }}>
              {tr("hora certa")}
            </span>
            <input type="time" value={clock} onChange={e => setClock(e.target.value)}
              style={{
                border: "1px solid var(--rule)", borderRadius: 6, background: "var(--paper)",
                padding: "4px 8px", fontFamily: "var(--mono)", fontSize: 13, color: "var(--ink)",
              }}/>
            <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 12, color: "var(--ink-4)" }}>{tr("opcional")}</span>
          </div>

          <div style={{
            fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.1em",
            color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 8,
          }}>
            {tr("contável")}
          </div>
          <button onClick={() => setCountable(c => !c)} className="tap"
            style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: countable ? 8 : 12,
              border: "none", background: "transparent", cursor: "pointer", padding: 0,
              fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink-2)",
            }}>
            <span style={{
              width: 16, height: 16, borderRadius: 4, flexShrink: 0,
              border: `1.5px solid ${countable ? accentColor : "var(--ink-3)"}`,
              background: countable ? accentColor : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{countable && <Icon.Check size={9} color="var(--on-dark)"/>}</span>
            {tr("uma meta com quantidade (ex.: 2L de água, 3 treinos)")}
          </button>
          {countable && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <input type="number" min="2" max="99" value={target}
                onChange={e => setTarget(Math.max(2, parseInt(e.target.value) || 2))}
                style={{ width: 56, padding: "4px 8px", border: "1px solid var(--rule)", borderRadius: 6, background: "var(--paper)", fontFamily: "var(--mono)", fontSize: 13, color: "var(--ink)" }}/>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>×</span>
              <input value={unit} onChange={e => setUnit(e.target.value)}
                placeholder={tr("unidade (copos, treinos…)")}
                style={{ flex: 1, minWidth: 0, padding: "4px 8px", border: "1px solid var(--rule)", borderRadius: 6, background: "var(--paper)", fontSize: 13, color: "var(--ink-2)" }}/>
            </div>
          )}

          <div style={{
            fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.1em",
            color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 8,
          }}>
            {tr("recorrência")}
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {[
              { key: "forever", label: tr("permanente"), hint: tr("todos os dias, sem fim") },
              { key: "period",  label: tr("por um período"), hint: tr("durante X dias") },
              { key: "month",   label: tr("só este mês"), hint: tr("termina no fim do mês") },
            ].map(opt => (
              <button key={opt.key}
                onClick={() => setRecurrence(opt.key)}
                className="tap"
                title={opt.hint}
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
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
                {tr("dias")}
              </span>
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <Button variant="ghost" onClick={onCancel} style={{ flex: 1 }}>{tr("Cancelar")}</Button>
        <Button onClick={submit} accentColor={accentColor} disabled={!name.trim()} style={{ flex: 1 }}>
          {tr("Adicionar")}
        </Button>
      </div>
    </div>
  );
}

window.TabMares = TabMares;

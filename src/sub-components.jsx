// Pauta — sub-components: ActiveBlockCard, PausedBlockCard, FilterChips,
// Timeline, StartSheet, PauseSheet, ConcludeSheet, SwitchSheet

// ─── ACTIVE BLOCK CARD ───────────────────────────────────────
function ActiveBlockCard({ block, intention, accentColor, showElapsed, onPause, onSwitch, onConclude, onCancel }) {
  const now = useNow(1000, true);
  const currentSeg = block.sessions[block.sessions.length - 1];
  const elapsed = now - currentSeg.startedAt;
  const totalElapsed = block.sessions.reduce((acc, seg) => acc + ((seg.endedAt || now) - seg.startedAt), 0);
  const hasResumed = block.sessions.length > 1;

  return (
    <div style={{
      background: "var(--surface-dark)", color: "var(--on-dark)",
      borderRadius: 16, padding: "22px 22px 18px",
      marginBottom: 22, position: "relative", overflow: "hidden",
    }}>
      {/* live dot + status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: accentColor,
            boxShadow: `0 0 10px ${accentColor}`,
            animation: "pulse 1.6s ease-in-out infinite",
          }}/>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--on-dark-2)" }}>
            {hasResumed ? tr("retomado · em curso") : tr("em curso")}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--on-dark-2)", letterSpacing: "0.06em" }}>
            {trf("início {t}", { t: fmtClock(currentSeg.startedAt) })}
          </div>
          {onCancel && (
            <button onClick={onCancel} className="tap" title={tr("descartar este bloco")}
              style={{
                width: 22, height: 22, borderRadius: "50%",
                background: "rgba(245,241,234,0.08)", border: "none",
                color: "var(--on-dark-2)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              <Icon.X size={10}/>
            </button>
          )}
        </div>
      </div>

      {intention && (
        <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13, color: "var(--on-dark-2)", marginBottom: 4 }}>
          {tr("intenção do dia →")}
        </div>
      )}
      <div style={{ fontFamily: "var(--serif)", fontSize: 24, lineHeight: 1.15, marginBottom: 18, letterSpacing: "-0.005em" }}>
        {block.title}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
        {showElapsed && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{
              fontFamily: "var(--mono)", fontSize: 42, fontWeight: 300,
              letterSpacing: "-0.02em", lineHeight: 0.9, fontFeatureSettings: '"tnum"',
            }}>
              {fmtDuration(elapsed, { timer: true })}
            </div>
            {hasResumed && (
              <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--on-dark-2)", letterSpacing: "0.06em" }}>
                {trf("{d} no total", { d: fmtDuration(totalElapsed) })}
              </div>
            )}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginLeft: "auto" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <DarkBtn onClick={onPause} label={tr("Pausar")} icon={<Icon.Pause size={10}/>}/>
            <DarkBtn onClick={onSwitch} label={tr("Trocar")} icon={<Icon.Chevron size={10}/>}/>
          </div>
          <button onClick={onConclude} className="tap"
            style={{
              background: accentColor, color: "var(--on-dark)",
              border: "none", borderRadius: 999, padding: "10px 16px",
              fontSize: 11, fontFamily: "var(--mono)", letterSpacing: "0.1em",
              textTransform: "uppercase", fontWeight: 500, cursor: "pointer",
            }}>{tr("Concluir")}</button>
        </div>
      </div>
    </div>
  );
}

function DarkBtn({ onClick, label, icon }) {
  return (
    <button onClick={onClick} className="tap"
      style={{
        background: "transparent", border: "1px solid rgba(245,241,234,0.22)",
        color: "var(--on-dark)", borderRadius: 999, padding: "9px 12px",
        fontSize: 10, fontFamily: "var(--mono)", letterSpacing: "0.08em",
        textTransform: "uppercase", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 6,
      }}>
      {icon}{label}
    </button>
  );
}

// ─── PAUSED BLOCK CARD ──────────────────────────────────────
function PausedBlockCard({ block, onResume, onConclude, onEdit, accentColor }) {
  const lastSeg = block.sessions[block.sessions.length - 1];
  const totalMs = block.sessions.reduce((a, s) => a + ((s.endedAt || Date.now()) - s.startedAt), 0);
  return (
    <div style={{
      background: "var(--paper-2)",
      borderRadius: 12, padding: "14px 16px",
      border: "1px solid var(--rule)",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: "var(--paper-3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--ink-2)", flexShrink: 0,
      }}>
        <Icon.Pause size={12}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {block.title}
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)", marginTop: 3, letterSpacing: "0.04em" }}>
          {trf("pausado às {t} · {d} acumulado", { t: fmtClock(lastSeg.endedAt), d: fmtDuration(totalMs) })}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button onClick={onResume} className="tap"
          title={tr("Retomar")}
          style={{
            background: accentColor, color: "var(--on-dark)",
            border: "none", borderRadius: 999, padding: "9px 14px",
            fontSize: 10, fontFamily: "var(--mono)", letterSpacing: "0.08em",
            textTransform: "uppercase", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5, fontWeight: 500,
          }}>
          <Icon.Play size={10}/> {tr("Retomar")}
        </button>
        {onEdit && (
          <button onClick={onEdit} className="tap" title={tr("editar")}
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: "transparent", border: "none", color: "var(--ink-3)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}>
            <KebabIcon/>
          </button>
        )}
      </div>
    </div>
  );
}

function KebabIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="currentColor">
      <circle cx="3" cy="7" r="1.2"/><circle cx="7" cy="7" r="1.2"/><circle cx="11" cy="7" r="1.2"/>
    </svg>
  );
}

// ─── FILTER CHIPS ───────────────────────────────────────────
function FilterChips({ intentions, blocks, projects = [], filter, setFilter, accentColor }) {
  // Build unique titles from today's blocks NOT linked to intentions
  const unlinkedTitles = useMemo(() => {
    const map = new Map();
    for (const b of blocks) {
      if (!b.linkedToId) {
        if (!map.has(b.title)) map.set(b.title, b.id);
      }
    }
    return [...map.entries()].map(([title, id]) => ({ title, id }));
  }, [blocks]);

  if (intentions.length === 0 && unlinkedTitles.length === 0 && projects.length === 0 && !filter) return null;

  return (
    <div style={{ marginTop: 8, marginBottom: 6 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {projects.map(p => {
          const active = filter?.kind === "project" && filter.id === p;
          return (
            <Chip key={"proj_" + p}
              label={"# " + p}
              active={active}
              accentColor={accentColor}
              onClick={() => setFilter(active ? null : { kind: "project", id: p, label: p })}
            />
          );
        })}
        {intentions.map(i => {
          const active = filter?.kind === "intention" && filter.id === i.id;
          return (
            <Chip key={i.id}
              label={i.text}
              active={active}
              accentColor={accentColor}
              onClick={() => setFilter(active ? null : { kind: "intention", id: i.id, label: i.text })}
            />
          );
        })}
        {unlinkedTitles.map(u => {
          const active = filter?.kind === "block" && filter.label === u.title;
          // For unlinked, we filter by exact-title match across all blocks with same title:
          return (
            <Chip key={u.id + "_unl"}
              label={u.title}
              muted={true}
              active={active}
              accentColor={accentColor}
              onClick={() => setFilter(active ? null : { kind: "block", id: u.id, label: u.title })}
            />
          );
        })}
        {filter && (
          <button onClick={() => setFilter(null)} className="tap"
            style={{
              background: "transparent", border: "none", padding: "6px 10px",
              fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)",
              cursor: "pointer", letterSpacing: "0.06em",
              display: "flex", alignItems: "center", gap: 4,
            }}>
            <Icon.X size={10}/> {tr("limpar")}
          </button>
        )}
      </div>
    </div>
  );
}

function Chip({ label, active, muted, accentColor, onClick }) {
  return (
    <button onClick={onClick} className="tap"
      style={{
        background: active ? accentColor : (muted ? "transparent" : "var(--paper-2)"),
        color: active ? "var(--on-dark)" : "var(--ink-2)",
        border: muted && !active ? "1px dashed var(--rule)" : "1px solid " + (active ? accentColor : "var(--rule)"),
        borderRadius: 999, padding: "5px 11px",
        fontSize: 11, fontFamily: "var(--sans)", fontWeight: 500,
        cursor: "pointer", letterSpacing: "0",
        maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
      {label}
    </button>
  );
}

// ─── TIMELINE ───────────────────────────────────────────────
// Groups consecutive events by block. Shows start/pause/resume/conclude markers.
function Timeline({ events, accentColor, onFilterBlock, onEditBlock }) {
  // We render each event as a row.
  // Adjacent events from same block visually share the vertical rail with a dotted continuation.
  return (
    <div style={{ position: "relative" }}>
      {events.map((e, i) => {
        const prev = events[i-1];
        const next = events[i+1];
        const sameBlockNext = next && next.blockId === e.blockId;
        const sameBlockPrev = prev && prev.blockId === e.blockId;
        return (
          <TimelineRow key={e.blockId + "_" + e.sessionIdx + "_" + e.kind}
            event={e}
            accentColor={accentColor}
            isLast={!next}
            connectDown={sameBlockNext}
            connectUp={sameBlockPrev}
            onFilter={() => onFilterBlock(e.blockId, e.block.title)}
            onEdit={() => onEditBlock(e.blockId)}
          />
        );
      })}
    </div>
  );
}

function TimelineRow({ event, accentColor, isLast, connectDown, connectUp, onFilter, onEdit }) {
  const { kind, time, block, segment, sessionIdx } = event;
  const isResumed = kind === "resume";
  const isPaused = kind === "pause";
  const isConcluded = kind === "conclude";
  const isStart = kind === "start";

  // duration tag for start/resume (segment duration)
  const segDuration = segment.endedAt ? segment.endedAt - segment.startedAt : 0;

  const markerColor = isConcluded ? accentColor : (isPaused ? "var(--ink-3)" : "var(--ink)");
  const markerBg = isConcluded ? accentColor : (isPaused ? "transparent" : (isResumed ? "transparent" : "var(--ink)"));
  const markerBorder = isPaused || isResumed ? `1.6px solid ${markerColor}` : "none";

  const labelByKind = {
    start: "iniciado",
    resume: "retomado",
    pause: "pausa",
    conclude: "concluído",
  };

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "52px 1fr",
      gap: 12,
      position: "relative",
      paddingBottom: isLast ? 0 : 16,
    }}>
      {/* time + marker column */}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-2)", marginBottom: 4, letterSpacing: "0.02em" }}>
          {fmtClock(time)}
        </div>
        <div style={{ position: "relative", flex: 1, width: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* upper line (continuation) */}
          {connectUp && (
            <div style={{ position: "absolute", top: -16, height: 16, width: 0,
              borderLeft: "1.5px dashed var(--accent)", opacity: 0.5 }}/>
          )}
          {/* marker */}
          <Marker kind={kind} color={markerColor} bg={markerBg} border={markerBorder}/>
          {/* lower line (continuation) */}
          {connectDown && (
            <div style={{ position: "absolute", top: 18, bottom: -16, width: 0,
              borderLeft: "1.5px dashed " + accentColor, opacity: 0.5 }}/>
          )}
        </div>
      </div>

      {/* body */}
      <div style={{ paddingBottom: 4, paddingTop: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", flex: 1, minWidth: 0 }}>
            <div onClick={onFilter} title={tr("filtrar por esta atividade")}
              style={{
                fontSize: 15, fontWeight: 500, color: "var(--ink)", lineHeight: 1.25,
                cursor: "pointer",
              }}>
              {block.title}
            </div>
            <KindTag kind={kind} accentColor={accentColor}/>
            {block.project && (
              <span style={{
                fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.04em",
                color: "var(--ink-3)", padding: "1px 6px", borderRadius: 4,
                border: "1px solid var(--rule)",
              }}>#{block.project}</span>
            )}
          </div>
          {onEdit && (
            <button onClick={onEdit} className="tap" title={tr("editar bloco")}
              style={{
                flexShrink: 0, width: 26, height: 26, borderRadius: 6,
                background: "transparent", border: "none",
                color: "var(--ink-3)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginTop: -2,
              }}>
              <KebabIcon size={13}/>
            </button>
          )}
        </div>
        {(isStart || isResume(kind)) && segment.endedAt && (
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)", marginTop: 4, letterSpacing: "0.04em" }}>
            └─ {fmtDuration(segDuration)}
          </div>
        )}
        {(isStart || isResume(kind)) && !segment.endedAt && (
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: accentColor, marginTop: 4, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              width: 5, height: 5, borderRadius: "50%", background: accentColor,
              animation: "pulse 1.6s ease-in-out infinite",
            }}/>
            {tr("em curso")}
          </div>
        )}
        {isPaused && segment.note && (
          <div style={{
            marginTop: 6, fontFamily: "var(--serif)", fontStyle: "italic",
            fontSize: 13, color: "var(--ink-2)", lineHeight: 1.4,
          }}>
            "{segment.note}"
          </div>
        )}
        {isConcluded && block.reflection && (
          <div style={{
            marginTop: 6, fontFamily: "var(--serif)", fontStyle: "italic",
            fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.4,
          }}>
            — {block.reflection}
          </div>
        )}
      </div>
    </div>
  );
}

function isResume(kind) { return kind === "resume"; }

function Marker({ kind, color, bg, border }) {
  const size = 14;
  if (kind === "pause") {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%", background: "var(--paper)",
        border, display: "flex", alignItems: "center", justifyContent: "center",
        color, position: "relative", zIndex: 2,
      }}>
        <svg width="6" height="6" viewBox="0 0 6 6" fill={color}><rect x="1" y="0.5" width="1.4" height="5" rx="0.4"/><rect x="3.6" y="0.5" width="1.4" height="5" rx="0.4"/></svg>
      </div>
    );
  }
  if (kind === "conclude") {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%", background: bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", zIndex: 2,
      }}>
        <Icon.Check size={8} color="var(--on-dark)"/>
      </div>
    );
  }
  if (kind === "resume") {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: "var(--paper)", border, display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", zIndex: 2,
      }}>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 1.5 A2.5 2.5 0 1 1 1.5 4"/>
          <path d="M1 1L2 1.5L1.5 2.5"/>
        </svg>
      </div>
    );
  }
  // start
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", zIndex: 2,
    }}>
      <svg width="6" height="6" viewBox="0 0 6 6" fill="var(--paper)"><path d="M1 1L5 3L1 5Z"/></svg>
    </div>
  );
}

function KindTag({ kind, accentColor }) {
  const map = {
    start: { label: tr("iniciado"), color: "var(--ink-3)" },
    resume: { label: tr("retomado"), color: accentColor },
    pause: { label: tr("pausa"), color: "var(--ink-3)" },
    conclude: { label: tr("concluído"), color: accentColor },
  };
  const { label, color } = map[kind];
  return (
    <span style={{
      fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.12em",
      textTransform: "uppercase", color, fontWeight: 500,
    }}>{label}</span>
  );
}

window.ActiveBlockCard = ActiveBlockCard;
window.PausedBlockCard = PausedBlockCard;
window.FilterChips = FilterChips;
window.Timeline = Timeline;

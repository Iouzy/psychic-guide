// Tab: PAUTA — bloco ativo + linha temporal com ciclo de vida + filtro

function TabPauta({ store, accentColor, showElapsed, pendingIntention, clearPending }) {
  const { state, activeBlock, startBlock, pauseActive, resumeBlock, concludeActive, concludeBlock, updateBlock, updateSessionNote, deleteBlock } = store;
  const { today, blocks } = state;

  // ─ Sheets state ─
  const [sheetStart, setSheetStart] = useState(null); // { intentionId? }
  const [sheetPause, setSheetPause] = useState(false);
  const [sheetConclude, setSheetConclude] = useState(null); // { blockId, afterPause? }
  const [sheetSwitch, setSheetSwitch] = useState(false);
  const [sheetEdit, setSheetEdit] = useState(null); // blockId
  const [sheetHistory, setSheetHistory] = useState(false);
  const [filter, setFilter] = useState(null); // { kind:"block"|"intention", id, label }

  // Open start sheet from Hoje
  useEffect(() => {
    if (pendingIntention) {
      setSheetStart({ intention: pendingIntention });
      if (clearPending) clearPending();
    }
  }, [pendingIntention]);

  // ─ Build today's timeline ─
  const dayK = dayKeyOf(Date.now());
  const allEvents = useMemo(() => buildTimeline(blocks, dayK), [blocks, dayK]);

  // Filter
  const events = useMemo(() => {
    if (!filter) return allEvents;
    return allEvents.filter(e => {
      if (filter.kind === "block") return e.blockId === filter.id;
      if (filter.kind === "intention") return e.block.linkedToId === filter.id;
      if (filter.kind === "project") return e.block.project === filter.id;
      return true;
    });
  }, [allEvents, filter]);

  const projects = useMemo(() => {
    const set = new Set();
    for (const b of blocks) if (b.project) set.add(b.project);
    return Array.from(set);
  }, [blocks]);

  const totalFocus = useMemo(() => {
    const set = new Set(events.map(e => e.blockId));
    return blocks.filter(b => set.has(b.id)).reduce((acc, b) => {
      // for filter we want only segments matching the day
      return acc + b.sessions.reduce((s, seg) => {
        if (dayKeyOf(seg.startedAt) !== dayK) return s;
        return s + ((seg.endedAt || Date.now()) - seg.startedAt);
      }, 0);
    }, 0);
  }, [blocks, events, dayK]);

  const distinctBlockCount = useMemo(() => new Set(events.map(e => e.blockId)).size, [events]);

  const pausedBlocks = useMemo(() =>
    blocks.filter(b => b.status === "paused" && dayKeyOf(b.createdAt) === dayK),
    [blocks, dayK]);

  // ─ Handlers ─
  const handleStart = (title, linkedToId, project) => {
    if (activeBlock) {
      // auto-pause current then start new
      pauseActive("");
      setTimeout(() => startBlock(title, linkedToId, { project }), 50);
    } else {
      startBlock(title, linkedToId, { project });
    }
    setSheetStart(null);
  };

  const handleConcludeActive = (reflection, markDone) => {
    concludeActive(reflection, { markIntentionDone: markDone });
    setSheetConclude(null);
  };

  const handleConcludeBlock = (blockId, reflection, markDone) => {
    concludeBlock(blockId, reflection, { markIntentionDone: markDone });
    setSheetConclude(null);
  };

  const handlePause = (note) => {
    pauseActive(note);
    setSheetPause(false);
  };

  const handleSwitch = (linkedToId, title) => {
    // pause active, start new with chosen intention
    if (activeBlock) pauseActive("");
    setTimeout(() => startBlock(title, linkedToId), 50);
    setSheetSwitch(false);
  };

  // intention by id
  const intentionById = useMemo(() => Object.fromEntries(today.intentions.map(i => [i.id, i])), [today.intentions]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 1, overflow: "hidden" }}>
      <div className="scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 24px 30px" }}>
        {/* Header */}
        <div style={{ paddingTop: 14, paddingBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>
              {trf("Pauta · {d}", { d: fmtDateLong(Date.now()) })}
            </div>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: 30, lineHeight: 1.0, margin: 0, fontWeight: 400, letterSpacing: "-0.01em" }}>
              {distinctBlockCount} {distinctBlockCount === 1 ? tr("bloco") : tr("blocos")}. <em style={{ color: accentColor }}>{fmtDuration(totalFocus)}</em> {tr("em foco.")}
            </h1>
          </div>
          <button onClick={() => setSheetHistory(true)} className="tap" title={tr("ver pautas anteriores")}
            style={{
              border: "1px solid var(--rule)", background: "transparent",
              borderRadius: 8, padding: "6px 10px",
              fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.14em",
              textTransform: "uppercase", color: "var(--ink-3)",
              cursor: "pointer", flexShrink: 0, marginTop: 2,
            }}>
            {tr("histórico")} ↗
          </button>
        </div>

        {/* Active block */}
        {activeBlock && (
          <ActiveBlockCard
            block={activeBlock}
            intention={activeBlock.linkedToId && intentionById[activeBlock.linkedToId]}
            accentColor={accentColor}
            showElapsed={showElapsed}
            onPause={() => setSheetPause(true)}
            onSwitch={() => setSheetSwitch(true)}
            onConclude={() => setSheetConclude({ blockId: activeBlock.id })}
            onCancel={() => {
              if (confirm(tr("Descartar este bloco? Não fica guardado."))) {
                deleteBlock(activeBlock.id);
              }
            }}
          />
        )}

        {/* Start CTA (no active) */}
        {!activeBlock && (
          <button onClick={() => setSheetStart({})} className="tap"
            style={{
              width: "100%", marginBottom: 22,
              background: "var(--surface-dark)", color: "var(--on-dark)",
              border: "none", borderRadius: 14,
              padding: "20px 22px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              cursor: "pointer",
            }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--on-dark-2)" }}>
                {tr("começar")}
              </div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 22, marginTop: 4 }}>
                {tr("Um novo bloco")}
              </div>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: accentColor, color: "var(--on-dark)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon.Play size={14}/>
            </div>
          </button>
        )}

        {/* Paused blocks (resume affordance) */}
        {pausedBlocks.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
              {tr("Em pausa")}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pausedBlocks.map(b => (
                <PausedBlockCard key={b.id} block={b} accentColor={accentColor}
                  onResume={() => resumeBlock(b.id)}
                  onConclude={() => setSheetConclude({ blockId: b.id })}
                  onEdit={() => setSheetEdit(b.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Filter chips */}
        {(today.intentions.length > 0 || filter) && (
          <FilterChips
            intentions={today.intentions}
            blocks={blocks.filter(b => dayKeyOf(b.createdAt) === dayK)}
            projects={projects}
            filter={filter}
            setFilter={setFilter}
            accentColor={accentColor}
          />
        )}

        {/* Timeline */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 14 }}>
            {filter ? tr("Filtrado") : tr("Hoje")}
          </div>
          {events.length === 0 ? (
            <div style={{ padding: "20px 0", fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--ink-3)", fontSize: 15 }}>
              {filter ? tr("Nada por aqui ainda.") : tr("Ainda nenhum bloco hoje. Comece quando quiser.")}
            </div>
          ) : (
            <Timeline events={events} accentColor={accentColor}
              onFilterBlock={(blockId, label) => setFilter({ kind: "block", id: blockId, label })}
              onEditBlock={(blockId) => setSheetEdit(blockId)}
            />
          )}
        </div>
      </div>

      {/* ─── SHEETS ─── */}
      <StartSheet
        open={!!sheetStart} onClose={() => setSheetStart(null)}
        intentions={today.intentions}
        prefilledIntention={sheetStart?.intention}
        projects={projects}
        onStart={handleStart}
        accentColor={accentColor}
        hasActive={!!activeBlock}
        activeTitle={activeBlock?.title}
      />
      <PauseSheet
        open={sheetPause} onClose={() => setSheetPause(false)}
        block={activeBlock}
        onConfirm={handlePause}
      />
      <ConcludeSheet
        open={!!sheetConclude} onClose={() => setSheetConclude(null)}
        block={sheetConclude && blocks.find(b => b.id === sheetConclude.blockId)}
        intention={sheetConclude && (() => {
          const b = blocks.find(b => b.id === sheetConclude.blockId);
          return b && b.linkedToId && intentionById[b.linkedToId];
        })()}
        onConfirm={(reflection, markDone) => {
          if (sheetConclude.blockId === activeBlock?.id) {
            handleConcludeActive(reflection, markDone);
          } else {
            handleConcludeBlock(sheetConclude.blockId, reflection, markDone);
          }
        }}
        accentColor={accentColor}
      />
      <SwitchSheet
        open={sheetSwitch} onClose={() => setSheetSwitch(false)}
        intentions={today.intentions}
        currentBlock={activeBlock}
        onPick={handleSwitch}
        onConcludeFirst={() => { setSheetSwitch(false); setSheetConclude({ blockId: activeBlock.id }); }}
        accentColor={accentColor}
      />
      <EditBlockSheet
        open={!!sheetEdit} onClose={() => setSheetEdit(null)}
        block={sheetEdit && blocks.find(b => b.id === sheetEdit)}
        onUpdateBlock={updateBlock}
        onUpdateSessionNote={updateSessionNote}
        onDelete={deleteBlock}
        accentColor={accentColor}
      />
      <PautaHistorySheet
        open={sheetHistory} onClose={() => setSheetHistory(false)}
        blocks={blocks}
        accentColor={accentColor}
      />
    </div>
  );
}

window.TabPauta = TabPauta;

// ─── Pauta history sheet ──────────────────────────────────
function PautaHistorySheet({ open, onClose, blocks, accentColor }) {
  const [pickedKey, setPickedKey] = useState(null);

  // Last 14 days, including today, oldest-first for the chart
  const todayKey = dayKeyOf(Date.now());
  const chartDays = useMemo(() => {
    const out = [];
    for (let i = 13; i >= 0; i--) {
      const k = addDaysToKey(todayKey, -i);
      out.push({
        key: k,
        focusMs: dailyFocusMs(blocks, k),
        blockCount: dailyBlockCount(blocks, k),
        isToday: i === 0,
      });
    }
    return out;
  }, [blocks, todayKey, open]);

  // All days with activity, newest first
  const allDays = useMemo(() => blocksAllDays(blocks), [blocks, open]);

  const maxMs = Math.max(1, ...chartDays.map(d => d.focusMs));
  const totalMs = chartDays.reduce((a, d) => a + d.focusMs, 0);
  const activeDays = chartDays.filter(d => d.focusMs > 0).length;
  const avgMs = activeDays > 0 ? Math.round(totalMs / activeDays) : 0;

  if (!open) return null;

  const opened = pickedKey;
  const openedDate = opened ? tsFromDayKey(opened) : null;
  const openedEvents = opened ? buildTimeline(blocks, opened) : [];
  const openedFocus = opened ? dailyFocusMs(blocks, opened) : 0;
  const openedCount = opened ? dailyBlockCount(blocks, opened) : 0;

  return (
    <Sheet open={open} onClose={() => { setPickedKey(null); onClose(); }} title={tr("Pautas anteriores")}>
      <div style={{ padding: "8px 24px 24px" }}>
        {opened ? (
          <div>
            <button onClick={() => setPickedKey(null)} className="tap"
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                border: "1px solid var(--rule)", background: "var(--paper-2)",
                borderRadius: 999, padding: "9px 15px 9px 11px",
                fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.08em",
                color: "var(--ink-2)", textTransform: "uppercase", cursor: "pointer",
                marginBottom: 16,
              }}>
              <span style={{ fontSize: 17, lineHeight: 1, marginTop: -2 }}>‹</span>
              {tr("histórico")}
            </button>
            <div style={{
              fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.16em",
              textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4,
            }}>
              {fmtDateLong(openedDate)}
            </div>
            <h2 style={{
              fontFamily: "var(--serif)", fontSize: 26, lineHeight: 1.1,
              margin: 0, fontWeight: 400, letterSpacing: "-0.01em",
              color: "var(--ink)", marginBottom: 16,
            }}>
              {openedCount} {openedCount === 1 ? tr("bloco") : tr("blocos")}. <em style={{ color: accentColor }}>{fmtDuration(openedFocus)}</em>.
            </h2>
            {openedEvents.length === 0 ? (
              <div style={{
                padding: "24px 0", textAlign: "center",
                fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14,
                color: "var(--ink-3)",
              }}>
                {tr("Sem blocos nesse dia.")}
              </div>
            ) : (
              <Timeline events={openedEvents} accentColor={accentColor}
                onFilterBlock={() => {}}
                onEditBlock={() => {}}
              />
            )}
          </div>
        ) : (
          <>
            <div style={{
              fontFamily: "var(--serif)", fontSize: 20, lineHeight: 1.25,
              color: "var(--ink)", marginBottom: 4, letterSpacing: "-0.01em",
            }}>
              {tr("O ritmo dos seus dias.")}
            </div>
            <div style={{
              fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13,
              color: "var(--ink-3)", marginBottom: 22,
            }}>
              {tr("Cada barra é um dia. Toque para ver os blocos desse dia.")}
            </div>

            <FocusBars days={chartDays} maxMs={maxMs} accentColor={accentColor}
              onPick={(k) => setPickedKey(k)}/>

            <div style={{
              marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
              gap: 1, background: "var(--rule)",
              border: "1px solid var(--rule)", borderRadius: 8, overflow: "hidden",
              marginBottom: 24,
            }}>
              <PStat label={tr("Total 14d")} value={fmtDuration(totalMs)}/>
              <PStat label={tr("Média/dia activo")} value={activeDays > 0 ? fmtDuration(avgMs) : "—"}/>
              <PStat label={tr("Dias activos")} value={activeDays + "/14"}/>
            </div>

            <div style={{
              fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.15em",
              textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10,
            }}>
              {tr("todos os dias com blocos")}
            </div>
            {allDays.length === 0 ? (
              <div style={{
                fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14,
                color: "var(--ink-3)", padding: "12px 0",
              }}>
                {tr("Ainda nenhuma pauta passada.")}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {allDays.map(k => {
                  const focusMs = dailyFocusMs(blocks, k);
                  const count = dailyBlockCount(blocks, k);
                  const isToday = k === todayKey;
                  return (
                    <button key={k} onClick={() => setPickedKey(k)} className="tap"
                      style={{
                        textAlign: "left", border: "1px solid var(--rule)",
                        background: isToday ? `${accentColor}08` : "var(--paper)",
                        borderRadius: 8, padding: "10px 14px", cursor: "pointer",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        gap: 10,
                      }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontFamily: "var(--serif)", fontSize: 16, color: "var(--ink)",
                          letterSpacing: "-0.01em",
                        }}>
                          {fmtDateLong(tsFromDayKey(k))}
                          {isToday && (
                            <span style={{
                              marginLeft: 8, fontFamily: "var(--mono)", fontSize: 9,
                              color: accentColor, letterSpacing: "0.1em",
                              textTransform: "uppercase",
                            }}>· {tr("hoje")}</span>
                          )}
                        </div>
                        <div style={{
                          fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)",
                          letterSpacing: "0.06em", marginTop: 2,
                        }}>
                          {count} {count === 1 ? tr("bloco") : tr("blocos")}
                        </div>
                      </div>
                      <div style={{
                        fontFamily: "var(--mono)", fontSize: 13,
                        color: accentColor, flexShrink: 0,
                      }}>
                        {fmtDuration(focusMs)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </Sheet>
  );
}

function FocusBars({ days, maxMs, accentColor, onPick }) {
  const H = 120;
  return (
    <div>
      <div style={{
        display: "flex", alignItems: "flex-end", gap: 4,
        height: H, padding: "0 2px", borderBottom: "1px solid var(--rule)",
        position: "relative",
      }}>
        {days.map((d, i) => {
          const h = maxMs > 0 && d.focusMs > 0 ? Math.max(3, (d.focusMs / maxMs) * (H - 16)) : 0;
          const empty = d.focusMs === 0;
          return (
            <button key={d.key}
              onClick={() => onPick && onPick(d.key)}
              className="tap"
              title={fmtDateLong(tsFromDayKey(d.key)) + " · " + fmtDuration(d.focusMs)}
              style={{
                flex: 1, height: "100%", padding: 0, border: "none",
                background: "transparent", cursor: "pointer",
                display: "flex", flexDirection: "column", justifyContent: "flex-end",
                alignItems: "stretch", position: "relative",
              }}>
              {!empty && (
                <div style={{
                  height: h,
                  background: d.isToday ? accentColor : "var(--ink)",
                  borderRadius: "2px 2px 0 0",
                  opacity: d.isToday ? 1 : 0.78,
                  transition: "opacity 0.15s",
                }}/>
              )}
              {empty && (
                <div style={{
                  height: 3,
                  background: "var(--rule)",
                  borderRadius: 2,
                }}/>
              )}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 4, padding: "6px 2px 0" }}>
        {days.map((d, i) => {
          const date = new Date(tsFromDayKey(d.key));
          const showLabel = i === 0 || i === days.length - 1 || i === Math.floor(days.length / 2) || d.isToday;
          return (
            <div key={d.key} style={{
              flex: 1, textAlign: "center",
              fontFamily: "var(--mono)", fontSize: 8,
              color: d.isToday ? accentColor : "var(--ink-3)",
              letterSpacing: "0.04em",
              fontWeight: d.isToday ? 600 : 400,
            }}>
              {showLabel && pad(date.getDate())}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PStat({ label, value }) {
  return (
    <div style={{
      padding: "12px 10px", background: "var(--paper)", textAlign: "center",
    }}>
      <div style={{
        fontFamily: "var(--mono)", fontSize: 8, letterSpacing: "0.15em",
        textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 5,
      }}>{label}</div>
      <div style={{
        fontFamily: "var(--serif)", fontSize: 18, color: "var(--ink)", lineHeight: 1,
        letterSpacing: "-0.01em",
      }}>
        {value}
      </div>
    </div>
  );
}

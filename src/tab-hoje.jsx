// Tab: HOJE — intenções do dia + reflexão noturna

function TabHoje({ store, accentColor, onJumpToPauta }) {
  const { state, addIntention, updateIntention, toggleIntention, removeIntention, setReflection } = store;
  const { today, blocks } = state;
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyDayKey, setHistoryDayKey] = useState(null);

  const totalFocusToday = useMemo(() => {
    const key = dayKeyOf(Date.now());
    return blocks
      .filter(b => dayKeyOf(b.createdAt) === key)
      .reduce((acc, b) => acc + blockFocusMs(b), 0);
  }, [blocks]);

  const focusByIntention = useMemo(() => {
    const map = {};
    for (const b of blocks) {
      if (b.linkedToId) {
        map[b.linkedToId] = (map[b.linkedToId] || 0) + blockFocusMs(b);
      }
    }
    return map;
  }, [blocks]);

  const pastKeys = useMemo(() => pastDayKeys(state), [state.days]);

  const commitNew = () => {
    if (newText.trim()) addIntention(newText);
    setNewText("");
    setAdding(false);
  };

  return (
    <div className="scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 24px 40px", position: "relative", zIndex: 1 }}>
      {/* Header */}
      <div style={{ paddingTop: 16, paddingBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>
            {fmtDateLong(Date.now())}
          </div>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: 44, lineHeight: 1.0, margin: 0, fontWeight: 400, letterSpacing: "-0.015em" }}>
            {tr("O que importa")} <em style={{ color: accentColor }}>{tr("hoje")}</em>?
          </h1>
          {totalFocusToday > 0 && (
            <div style={{ marginTop: 10, fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>
              {trf("{d} em foco até agora", { d: fmtDuration(totalFocusToday) })}
            </div>
          )}
        </div>
        <button onClick={() => setHistoryOpen(true)} className="tap" title={tr("ver dias anteriores")}
          style={{
            border: "1px solid var(--rule)", background: "transparent",
            borderRadius: 8, padding: "6px 10px",
            fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "var(--ink-3)",
            cursor: "pointer", flexShrink: 0, marginTop: 2,
          }}>
          {tr("dias anteriores")} ↗
        </button>
      </div>

      {/* Intentions */}
      {today.intentions.length === 0 && !adding && (
        <div style={{
          padding: "24px 0", textAlign: "left",
          fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 18,
          color: "var(--ink-3)", lineHeight: 1.4,
        }}>
          {tr("Comece por listar 1 a 4 coisas que importam hoje.")}<br/>
          {tr("Não tarefas de rotina — coisas que")} <em>{tr("movem")}</em> {tr("o seu dia.")}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {today.intentions.map((it, i) => (
          <IntentionRow
            key={it.id}
            intention={it}
            isPrimary={i === 0}
            focusMs={focusByIntention[it.id] || 0}
            onToggle={() => toggleIntention(it.id)}
            onChange={text => updateIntention(it.id, { text })}
            onRemove={() => removeIntention(it.id)}
            onStart={() => onJumpToPauta && onJumpToPauta({ intention: it })}
            accentColor={accentColor}
          />
        ))}
      </div>

      {/* Add new */}
      {adding ? (
        <div style={{
          marginTop: 8, padding: "14px 0 14px 34px",
          borderBottom: "1px solid var(--rule)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <input autoFocus value={newText}
            onChange={e => setNewText(e.target.value)}
            onBlur={commitNew}
            onKeyDown={e => { if (e.key === "Enter") commitNew(); if (e.key === "Escape") { setNewText(""); setAdding(false); } }}
            placeholder={tr("Nova intenção…")}
            style={{
              flex: 1, border: "none", background: "transparent", padding: 0,
              fontSize: 16, color: "var(--ink)", lineHeight: 1.35,
            }}/>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="tap"
          style={{
            marginTop: 12, background: "transparent", border: "none",
            padding: "10px 0", display: "flex", alignItems: "center", gap: 10,
            color: "var(--ink-3)", fontSize: 14, cursor: "pointer",
          }}>
          <div style={{
            width: 22, height: 22, borderRadius: "50%",
            border: "1.5px dashed var(--ink-3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon.Plus size={12}/>
          </div>
          {tr("adicionar intenção")}
        </button>
      )}

      {/* Evening reflection */}
      <div style={{ marginTop: 40, padding: "24px 22px", background: "var(--paper-2)", borderRadius: 14, border: "1px solid var(--rule)" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8 }}>
          {tr("Reflexão da noite")}
        </div>
        <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 18, color: "var(--ink-2)", marginBottom: 12 }}>
          "{tr("O que valeu hoje?")}"
        </div>
        <AutoTextarea
          value={today.reflection}
          onChange={setReflection}
          placeholder={tr("Escreva quando quiser. Não precisa de ser longo.")}
          minRows={2}
          style={{
            fontSize: 15, lineHeight: 1.5, color: "var(--ink)",
            fontFamily: "var(--serif)",
          }}
        />
      </div>

      {/* Quarterly goals */}
      <GoalsSection store={store} accentColor={accentColor}/>

      <div style={{
        marginTop: 32, fontFamily: "var(--mono)", fontSize: 10,
        color: "var(--ink-4)", letterSpacing: "0.04em", textAlign: "center",
      }}>
        {tr("amanhã, recomeça.")}
      </div>

      {/* History sheet */}
      <HojeHistorySheet
        open={historyOpen}
        onClose={() => { setHistoryOpen(false); setHistoryDayKey(null); }}
        days={state.days || {}}
        blocks={blocks}
        keys={pastKeys}
        openedDayKey={historyDayKey}
        onOpenDay={setHistoryDayKey}
        accentColor={accentColor}
      />
    </div>
  );
}

// ─── History sheet (past days) ─────────────────────────────
function HojeHistorySheet({ open, onClose, days, blocks, keys, openedDayKey, onOpenDay, accentColor }) {
  const [query, setQuery] = useState("");
  useEffect(() => { if (!open) setQuery(""); }, [open]);
  if (!open) return null;
  const opened = openedDayKey && days[openedDayKey];

  const q = query.trim().toLowerCase();
  const filteredKeys = q ? keys.filter(k => {
    const d = days[k];
    const inIntentions = (d.intentions || []).some(i => (i.text || "").toLowerCase().includes(q));
    const inReflection = (d.reflection || "").toLowerCase().includes(q);
    return inIntentions || inReflection;
  }) : keys;

  return (
    <Sheet open={open} onClose={onClose} title={tr("Dias anteriores")}>
      <div style={{ padding: "8px 24px 24px" }}>
        {opened ? (
          <HojeHistoryDetail
            dayKey={openedDayKey}
            day={opened}
            blocks={blocks}
            accentColor={accentColor}
            onBack={() => onOpenDay(null)}
          />
        ) : (
          <>
            <div style={{
              fontFamily: "var(--serif)", fontSize: 20, lineHeight: 1.25,
              color: "var(--ink)", marginBottom: 4, letterSpacing: "-0.01em",
            }}>
              {tr("O que importou nos dias anteriores.")}
            </div>
            <div style={{
              fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13,
              color: "var(--ink-3)", marginBottom: 14,
            }}>
              {tr("As intenções e a reflexão de cada dia ficam guardadas. Toque para reler.")}
            </div>
            {keys.length > 0 && (
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder={tr("procurar nas reflexões e intenções…")}
                style={{
                  width: "100%", border: "1px solid var(--rule)", background: "var(--paper-2)",
                  borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "var(--ink)",
                  marginBottom: 16, fontFamily: "var(--sans)",
                }}/>
            )}
            {keys.length === 0 ? (
              <div style={{
                padding: "32px 0", textAlign: "center",
                fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14,
                color: "var(--ink-3)",
              }}>
                {tr("Ainda não há dias arquivados.")}<br/>
                {tr("Volte aqui amanhã.")}
              </div>
            ) : filteredKeys.length === 0 ? (
              <div style={{
                padding: "28px 0", textAlign: "center",
                fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14,
                color: "var(--ink-3)",
              }}>
                {trf('Nada encontrado para "{q}".', { q: query.trim() })}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredKeys.map(k => {
                  const d = days[k];
                  const total = d.intentions.length;
                  const done = d.intentions.filter(i => i.done).length;
                  const focusMs = dailyFocusMs(blocks, k);
                  return (
                    <button key={k} onClick={() => onOpenDay(k)} className="tap"
                      style={{
                        textAlign: "left", border: "1px solid var(--rule)",
                        background: "var(--paper)", borderRadius: 10,
                        padding: "12px 14px", cursor: "pointer",
                        display: "flex", flexDirection: "column", gap: 6,
                      }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                        <div style={{
                          fontFamily: "var(--serif)", fontSize: 18, color: "var(--ink)",
                          letterSpacing: "-0.01em",
                        }}>
                          {fmtDateLong(tsFromDayKey(k))}
                        </div>
                        <div style={{
                          fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)",
                          letterSpacing: "0.06em", flexShrink: 0,
                        }}>
                          {total > 0 && <>{done === 1 ? trf("{done}/{total} feito", { done, total }) : trf("{done}/{total} feitos", { done, total })}</>}
                          {focusMs > 0 && total > 0 && " · "}
                          {focusMs > 0 && trf("{d} foco", { d: fmtDuration(focusMs) })}
                        </div>
                      </div>
                      {d.reflection && d.reflection.trim() && (
                        <div style={{
                          fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13,
                          color: "var(--ink-2)", lineHeight: 1.4,
                          overflow: "hidden", display: "-webkit-box",
                          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                        }}>
                          "{d.reflection.trim()}"
                        </div>
                      )}
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

function HojeHistoryDetail({ dayKey, day, blocks, accentColor, onBack }) {
  const focusMs = dailyFocusMs(blocks, dayKey);
  const blocksDay = blocks.filter(b => b.sessions.some(s => dayKeyOf(s.startedAt) === dayKey));
  return (
    <div>
      <button onClick={onBack} className="tap"
        style={{
          border: "none", background: "transparent", padding: "4px 0",
          fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em",
          color: "var(--ink-3)", textTransform: "uppercase", cursor: "pointer",
          marginBottom: 12,
        }}>
        ← {tr("dias")}
      </button>
      <div style={{
        fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.16em",
        textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4,
      }}>
        {fmtDateLong(tsFromDayKey(dayKey))}
      </div>
      <div style={{
        fontFamily: "var(--serif)", fontSize: 24, lineHeight: 1.15,
        color: "var(--ink)", letterSpacing: "-0.01em", marginBottom: 18,
      }}>
        {tr("O que importou nesse dia.")}
      </div>

      {day.intentions.length === 0 ? (
        <div style={{
          fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14,
          color: "var(--ink-3)", marginBottom: 18,
        }}>
          {tr("Sem intenções registadas.")}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", marginBottom: 18 }}>
          {day.intentions.map((it, i) => (
            <div key={it.id} style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              padding: "10px 0", borderBottom: i < day.intentions.length - 1 ? "1px solid var(--rule)" : "none",
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%",
                border: `1.5px solid ${it.done ? accentColor : "var(--ink-3)"}`,
                background: it.done ? accentColor : "transparent",
                flexShrink: 0, marginTop: 2,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {it.done && (
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5.5L4 7.5L8 3" stroke="var(--paper)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div style={{
                flex: 1, fontSize: i === 0 ? 18 : 15,
                fontFamily: i === 0 ? "var(--serif)" : "var(--sans)",
                color: it.done ? "var(--ink-3)" : "var(--ink)",
                textDecoration: it.done ? "line-through" : "none",
                lineHeight: 1.3,
              }}>
                {it.text || <em style={{ color: "var(--ink-3)" }}>{tr("(intenção sem texto)")}</em>}
              </div>
            </div>
          ))}
        </div>
      )}

      {day.reflection && day.reflection.trim() && (
        <div style={{
          padding: "16px 18px", background: "var(--paper-2)",
          borderRadius: 12, border: "1px solid var(--rule)",
          marginBottom: 16,
        }}>
          <div style={{
            fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.2em",
            textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8,
          }}>
            {tr("reflexão da noite")}
          </div>
          <div style={{
            fontFamily: "var(--serif)", fontSize: 16, lineHeight: 1.5,
            color: "var(--ink)",
          }}>
            {day.reflection}
          </div>
        </div>
      )}

      {focusMs > 0 && (
        <div style={{
          padding: "12px 14px", border: "1px solid var(--rule)",
          borderRadius: 10, display: "flex", justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <div style={{
              fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.16em",
              textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 3,
            }}>
              {tr("tempo em foco")}
            </div>
            <div style={{
              fontFamily: "var(--serif)", fontSize: 22, color: accentColor,
              letterSpacing: "-0.01em",
            }}>
              {fmtDuration(focusMs)}
            </div>
          </div>
          <div style={{
            fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)",
            letterSpacing: "0.06em", textAlign: "right",
          }}>
            {blocksDay.length} {blocksDay.length === 1 ? tr("bloco") : tr("blocos")}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Intention row ─────────────────────────────────────────
function IntentionRow({ intention, isPrimary, focusMs, onToggle, onChange, onRemove, onStart, accentColor }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "14px 0", borderBottom: "1px solid var(--rule)",
      }}>
      <div style={{ paddingTop: 1 }}>
        <Check checked={intention.done} onChange={onToggle} accentColor={accentColor}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <EditableText
          value={intention.text}
          onChange={onChange}
          placeholder={tr("(intenção sem texto)")}
          multiline={false}
          style={{
            display: "block",
            fontFamily: isPrimary ? "var(--serif)" : "var(--sans)",
            fontSize: isPrimary ? 22 : 16,
            lineHeight: 1.25,
            color: intention.done ? "var(--ink-3)" : "var(--ink)",
            textDecoration: intention.done ? "line-through" : "none",
            textDecorationColor: "var(--ink-3)",
            letterSpacing: isPrimary ? "-0.01em" : "0",
          }}
        />
        {(focusMs > 0 || isPrimary) && (
          <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.04em" }}>
            {isPrimary && <span style={{ color: accentColor, fontWeight: 500 }}>● {tr("principal")}</span>}
            {focusMs > 0 && <span>{trf("{d} em foco", { d: fmtDuration(focusMs) })}</span>}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 4, opacity: hover ? 1 : 0, transition: "opacity 0.12s" }}>
        <button onClick={onStart} className="tap" title={tr("iniciar bloco com esta intenção")}
          style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Icon.Play size={11}/>
        </button>
        <button onClick={onRemove} className="tap"
          style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", color: "var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Icon.Trash size={13}/>
        </button>
      </div>
    </div>
  );
}

window.TabHoje = TabHoje;

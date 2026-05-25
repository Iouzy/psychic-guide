// Pauta — sheets (bottom modals)

// ─── START SHEET ──────────────────────────────────────────
function StartSheet({ open, onClose, intentions, prefilledIntention, projects = [], onStart, accentColor, hasActive, activeTitle }) {
  const [title, setTitle] = useState("");
  const [selectedIntention, setSelectedIntention] = useState(null);
  const [project, setProject] = useState("");

  useEffect(() => {
    if (open) {
      setProject("");
      if (prefilledIntention) {
        setTitle(prefilledIntention.text);
        setSelectedIntention(prefilledIntention.id);
      } else {
        setTitle("");
        setSelectedIntention(null);
      }
    }
  }, [open, prefilledIntention]);

  const pick = (i) => {
    setSelectedIntention(i.id);
    setTitle(i.text);
  };

  const submit = () => {
    if (!title.trim()) return;
    onStart(title.trim(), selectedIntention, project.trim() || null);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Novo bloco">
      <div style={{ padding: "0 24px" }}>
        {hasActive && (
          <div style={{
            marginBottom: 14, padding: "10px 12px",
            background: "var(--paper-2)", borderRadius: 8,
            fontFamily: "var(--serif)", fontStyle: "italic",
            fontSize: 13, color: "var(--ink-2)", lineHeight: 1.4,
          }}>
            "{activeTitle}" será automaticamente pausado.
          </div>
        )}

        <div style={{ fontFamily: "var(--serif)", fontSize: 22, color: "var(--ink)", marginBottom: 4 }}>
          Em que vais focar?
        </div>
        <input autoFocus value={title} onChange={e => { setTitle(e.target.value); setSelectedIntention(null); }}
          onKeyDown={e => { if (e.key === "Enter") submit(); }}
          placeholder="ex.: escrever capítulo 3"
          style={{
            width: "100%", border: "none", borderBottom: "1.5px solid var(--ink)",
            background: "transparent", padding: "8px 0",
            fontSize: 18, color: "var(--ink)", fontFamily: "var(--sans)",
          }}/>

        {intentions.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
              ou continue com…
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {intentions.filter(i => !i.done).map(i => (
                <button key={i.id} onClick={() => pick(i)} className="tap"
                  style={{
                    textAlign: "left", display: "flex", alignItems: "center", gap: 12,
                    background: selectedIntention === i.id ? "var(--paper-2)" : "transparent",
                    border: "1px solid " + (selectedIntention === i.id ? accentColor : "var(--rule)"),
                    borderRadius: 10, padding: "12px 14px", cursor: "pointer",
                    color: "var(--ink)", fontSize: 15, fontFamily: "var(--sans)",
                  }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: "1.5px solid " + (selectedIntention === i.id ? accentColor : "var(--ink-3)"),
                    background: selectedIntention === i.id ? accentColor : "transparent",
                    flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {selectedIntention === i.id && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--paper)" }}/>}
                  </div>
                  <span style={{ flex: 1 }}>{i.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
            projecto (opcional)
          </div>
          <input value={project} onChange={e => setProject(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") submit(); }}
            placeholder="ex.: Livro, Cliente X, Casa"
            style={{
              width: "100%", border: "1px solid var(--rule)", background: "var(--paper-2)",
              borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--ink)",
            }}/>
          {projects.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {projects.map(p => (
                <button key={p} onClick={() => setProject(p)} className="tap"
                  style={{
                    border: "1px solid " + (project === p ? accentColor : "var(--rule)"),
                    background: project === p ? `${accentColor}11` : "transparent",
                    color: project === p ? accentColor : "var(--ink-2)",
                    borderRadius: 999, padding: "4px 10px", fontSize: 12, cursor: "pointer",
                  }}>{p}</button>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 22, display: "flex", gap: 10 }}>
          <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
          <Button onClick={submit} disabled={!title.trim()} accentColor={accentColor} style={{ flex: 2 }}>
            Iniciar agora
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

// ─── PAUSE SHEET ──────────────────────────────────────────
function PauseSheet({ open, onClose, block, onConfirm }) {
  const [note, setNote] = useState("");
  useEffect(() => { if (open) setNote(""); }, [open]);
  if (!block) return null;
  return (
    <Sheet open={open} onClose={onClose} title="Pausar bloco">
      <div style={{ padding: "0 24px" }}>
        <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14, color: "var(--ink-3)", marginBottom: 4 }}>
          a pausa
        </div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 22, color: "var(--ink)", lineHeight: 1.2, marginBottom: 18 }}>
          {block.title}
        </div>

        <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8 }}>
          O que ficou em mente? (opcional)
        </div>
        <AutoTextarea
          value={note} onChange={setNote}
          placeholder="ex.: travei no segundo parágrafo"
          minRows={2}
          style={{
            fontSize: 15, lineHeight: 1.4,
            padding: "12px 14px",
            background: "var(--paper-2)",
            borderRadius: 10, border: "1px solid var(--rule)",
            fontFamily: "var(--serif)",
          }}/>

        <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
          <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
          <Button variant="inkPrimary" onClick={() => onConfirm(note)} style={{ flex: 2 }}>Pausar</Button>
        </div>
      </div>
    </Sheet>
  );
}

// ─── CONCLUDE SHEET ───────────────────────────────────────
function ConcludeSheet({ open, onClose, block, intention, onConfirm, accentColor }) {
  const [reflection, setReflection] = useState("");
  const [markDone, setMarkDone] = useState(true);
  useEffect(() => {
    if (open) {
      setReflection(block?.reflection || "");
      setMarkDone(true);
    }
  }, [open, block]);
  if (!block) return null;
  const totalMs = block.sessions.reduce((a, s) => a + ((s.endedAt || Date.now()) - s.startedAt), 0);

  return (
    <Sheet open={open} onClose={onClose} title="Concluir bloco">
      <div style={{ padding: "0 24px" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: accentColor, marginBottom: 6 }}>
          ✓ {fmtDuration(totalMs)} em foco
        </div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 24, color: "var(--ink)", lineHeight: 1.2, marginBottom: 18, letterSpacing: "-0.005em" }}>
          {block.title}
        </div>

        <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8 }}>
          O que aconteceu?
        </div>
        <AutoTextarea
          value={reflection} onChange={setReflection}
          autoFocus
          placeholder="ex.: terminei o esqueleto. ficou faltando a conclusão."
          minRows={3}
          style={{
            fontSize: 15, lineHeight: 1.45,
            padding: "12px 14px",
            background: "var(--paper-2)",
            borderRadius: 10, border: "1px solid var(--rule)",
            fontFamily: "var(--serif)",
          }}/>

        {intention && !intention.done && (
          <button onClick={() => setMarkDone(!markDone)} className="tap"
            style={{
              marginTop: 14, width: "100%",
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 14px", background: "transparent",
              border: "1px solid var(--rule)", borderRadius: 10,
              cursor: "pointer", color: "var(--ink-2)", fontSize: 13.5, textAlign: "left",
            }}>
            <div style={{
              width: 18, height: 18, borderRadius: 4,
              border: `1.5px solid ${markDone ? accentColor : "var(--ink-3)"}`,
              background: markDone ? accentColor : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {markDone && <Icon.Check size={10} color="var(--paper)"/>}
            </div>
            <span>marcar <span style={{ fontFamily: "var(--serif)", fontStyle: "italic" }}>"{intention.text}"</span> como concluído no Hoje</span>
          </button>
        )}

        <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
          <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
          <Button onClick={() => onConfirm(reflection, markDone)} accentColor={accentColor} style={{ flex: 2 }}>
            Concluir
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

// ─── SWITCH SHEET ──────────────────────────────────────────
function SwitchSheet({ open, onClose, intentions, currentBlock, onPick, onConcludeFirst, accentColor }) {
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  useEffect(() => { if (open) { setNewTitle(""); setAdding(false); } }, [open]);

  const available = intentions.filter(i => !i.done && i.id !== currentBlock?.linkedToId);

  return (
    <Sheet open={open} onClose={onClose} title="Trocar foco">
      <div style={{ padding: "0 24px" }}>
        <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink-3)", marginBottom: 4 }}>
          em curso →
        </div>
        <div style={{
          fontFamily: "var(--serif)", fontSize: 20, color: "var(--ink)",
          lineHeight: 1.2, marginBottom: 18, letterSpacing: "-0.005em",
        }}>
          {currentBlock?.title}
        </div>

        <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
          Pausar e ir para…
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {available.map(i => (
            <button key={i.id} onClick={() => onPick(i.id, i.text)} className="tap"
              style={{
                textAlign: "left", display: "flex", alignItems: "center", gap: 12,
                background: "var(--paper)",
                border: "1px solid var(--rule)",
                borderRadius: 10, padding: "13px 14px", cursor: "pointer",
                color: "var(--ink)", fontSize: 15,
              }}>
              <Icon.Chevron size={12}/>
              <span style={{ flex: 1 }}>{i.text}</span>
            </button>
          ))}

          {adding ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              border: "1px solid " + accentColor, borderRadius: 10,
              padding: "12px 14px", background: "var(--paper)",
            }}>
              <input autoFocus value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && newTitle.trim()) onPick(null, newTitle.trim()); if (e.key === "Escape") setAdding(false); }}
                placeholder="ex.: revisar PRs"
                style={{
                  flex: 1, border: "none", background: "transparent",
                  padding: 0, fontSize: 15, color: "var(--ink)",
                }}/>
              <button onClick={() => newTitle.trim() && onPick(null, newTitle.trim())} className="tap"
                disabled={!newTitle.trim()}
                style={{
                  background: accentColor, color: "var(--paper)", border: "none",
                  borderRadius: 999, padding: "6px 12px", fontSize: 11,
                  fontFamily: "var(--mono)", letterSpacing: "0.08em",
                  textTransform: "uppercase", cursor: "pointer", opacity: newTitle.trim() ? 1 : 0.4,
                }}>OK</button>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} className="tap"
              style={{
                textAlign: "left", display: "flex", alignItems: "center", gap: 12,
                background: "transparent",
                border: "1px dashed var(--rule)",
                borderRadius: 10, padding: "13px 14px", cursor: "pointer",
                color: "var(--ink-3)", fontSize: 14,
              }}>
              <Icon.Plus size={12}/>
              <span>algo novo (não está no Hoje)</span>
            </button>
          )}
        </div>

        <div style={{ marginTop: 22, paddingTop: 16, borderTop: "1px solid var(--rule)" }}>
          <button onClick={onConcludeFirst} className="tap"
            style={{
              width: "100%", textAlign: "left",
              display: "flex", alignItems: "center", gap: 10,
              background: "transparent", border: "none", padding: "8px 0",
              color: "var(--ink-2)", fontSize: 14, cursor: "pointer",
            }}>
            <Icon.Check size={12}/>
            <span>ou concluir <em style={{ fontFamily: "var(--serif)" }}>"{currentBlock?.title}"</em> primeiro</span>
          </button>
        </div>

        <div style={{ marginTop: 14 }}>
          <Button variant="ghost" onClick={onClose} style={{ width: "100%" }}>Cancelar</Button>
        </div>
      </div>
    </Sheet>
  );
}

window.StartSheet = StartSheet;
window.PauseSheet = PauseSheet;
window.ConcludeSheet = ConcludeSheet;
window.SwitchSheet = SwitchSheet;
window.EditBlockSheet = EditBlockSheet;

// ─── EDIT BLOCK SHEET ──────────────────────────────────────
// Universal editor: title, reflection, per-session notes, delete.
function EditBlockSheet({ open, onClose, block, onUpdateBlock, onUpdateSessionNote, onDelete, accentColor }) {
  const [title, setTitle] = useState("");
  const [reflection, setReflection] = useState("");
  const [project, setProject] = useState("");
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    if (open && block) {
      setTitle(block.title);
      setReflection(block.reflection || "");
      setProject(block.project || "");
      setNotes(block.sessions.map(s => s.note || ""));
    }
  }, [open, block]);

  if (!block) return null;

  const totalMs = block.sessions.reduce((a, s) => a + ((s.endedAt || Date.now()) - s.startedAt), 0);

  const save = () => {
    const patch = {};
    if (title.trim() && title.trim() !== block.title) patch.title = title.trim();
    if (reflection !== (block.reflection || "")) patch.reflection = reflection;
    const proj = project.trim() || null;
    if (proj !== (block.project || null)) patch.project = proj;
    if (Object.keys(patch).length) onUpdateBlock(block.id, patch);
    notes.forEach((n, i) => {
      if (n !== (block.sessions[i]?.note || "")) onUpdateSessionNote(block.id, i, n);
    });
    onClose();
  };

  const remove = () => {
    if (confirm("Apagar este bloco? Não dá pra desfazer.")) {
      onDelete(block.id);
      onClose();
    }
  };

  const statusLabel = block.status === "done" ? "concluído" : (block.status === "paused" ? "pausado" : "em curso");

  return (
    <Sheet open={open} onClose={onClose} title="Editar bloco">
      <div style={{ padding: "0 24px" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>
          {statusLabel} · {fmtDuration(totalMs)}
        </div>

        {/* Title */}
        <div style={{ marginBottom: 18 }}>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="título do bloco"
            style={{
              width: "100%", border: "none", borderBottom: "1.5px solid var(--ink)",
              background: "transparent", padding: "8px 0",
              fontFamily: "var(--serif)", fontSize: 22, color: "var(--ink)",
              lineHeight: 1.2, letterSpacing: "-0.005em",
            }}/>
        </div>

        {/* Project */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8 }}>
            Projecto
          </div>
          <input value={project} onChange={e => setProject(e.target.value)}
            placeholder="(sem projecto)"
            style={{
              width: "100%", border: "1px solid var(--rule)", background: "var(--paper-2)",
              borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--ink)",
            }}/>
        </div>

        {/* Reflection (only for done blocks, but allow setting for paused too) */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8 }}>
            Reflexão
          </div>
          <AutoTextarea value={reflection} onChange={setReflection}
            placeholder={block.status === "done" ? "o que aconteceu?" : "ainda não concluído"}
            minRows={2}
            style={{
              fontSize: 15, lineHeight: 1.45,
              padding: "12px 14px",
              background: "var(--paper-2)",
              borderRadius: 10, border: "1px solid var(--rule)",
              fontFamily: "var(--serif)",
            }}/>
        </div>

        {/* Sessions / notes */}
        {block.sessions.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8 }}>
              Sessões ({block.sessions.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {block.sessions.map((seg, i) => {
                const dur = seg.endedAt ? (seg.endedAt - seg.startedAt) : (Date.now() - seg.startedAt);
                return (
                  <div key={i} style={{
                    padding: "10px 12px", background: "var(--paper-2)",
                    borderRadius: 10, border: "1px solid var(--rule)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-2)" }}>
                        {fmtClock(seg.startedAt)}{seg.endedAt ? " → " + fmtClock(seg.endedAt) : " · em curso"}
                      </div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)" }}>
                        {fmtDuration(dur)}
                      </div>
                    </div>
                    {(seg.endedAt && i < block.sessions.length - 1) || (seg.endedAt && block.status !== "done") ? (
                      <AutoTextarea value={notes[i] || ""}
                        onChange={v => setNotes(n => { const next = [...n]; next[i] = v; return next; })}
                        placeholder="nota da pausa (opcional)"
                        minRows={1}
                        style={{
                          fontSize: 13.5, lineHeight: 1.4,
                          fontFamily: "var(--serif)", fontStyle: "italic",
                          color: "var(--ink-2)",
                        }}/>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
          <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
          <Button onClick={save} accentColor={accentColor} style={{ flex: 2 }}>Guardar</Button>
        </div>

        <button onClick={remove} className="tap"
          style={{
            width: "100%", marginTop: 8,
            background: "transparent", border: "1px solid var(--rule)",
            color: "#a8543d", padding: "11px 14px", borderRadius: 999,
            fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
          <Icon.Trash size={13}/> Apagar bloco
        </button>
      </div>
    </Sheet>
  );
}

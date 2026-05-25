// Pauta — UI primitives (shared)
// Sheet (bottom modal), TabBar, IconButton, AutoTextarea, etc.

// ─── Icons (inline SVG) ─────────────────────────────────────
const Icon = {
  Hoje: (p) => (
    <svg width={p.size||20} height={p.size||20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/>
    </svg>
  ),
  Pauta: (p) => (
    <svg width={p.size||20} height={p.size||20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v5l3 2"/>
    </svg>
  ),
  Mares: (p) => (
    <svg width={p.size||20} height={p.size||20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2"/>
      <path d="M3 17c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2"/>
      <path d="M3 7c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2"/>
    </svg>
  ),
  Plus: (p) => (
    <svg width={p.size||16} height={p.size||16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M8 3v10M3 8h10"/>
    </svg>
  ),
  Check: (p) => (
    <svg width={p.size||12} height={p.size||12} viewBox="0 0 12 12" fill="none">
      <path d="M2.5 6.5L5 9L9.5 3.5" stroke={p.color || "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  X: (p) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M3 3L11 11M11 3L3 11"/>
    </svg>
  ),
  Chevron: (p) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3L9 7L5 11"/>
    </svg>
  ),
  Pause: (p) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 14 14" fill="currentColor">
      <rect x="3" y="3" width="3" height="8" rx="1"/>
      <rect x="8" y="3" width="3" height="8" rx="1"/>
    </svg>
  ),
  Play: (p) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 14 14" fill="currentColor">
      <path d="M4 3L11 7L4 11Z"/>
    </svg>
  ),
  Trash: (p) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M2.5 4h9M5 4V2.5h4V4M3.5 4l.5 8h6l.5-8M6 6.5v4M8 6.5v4"/>
    </svg>
  ),
  Edit: (p) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12L2.5 9.5L9 3L11 5L4.5 11.5L2 12Z"/>
    </svg>
  ),
  Grip: (p) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 14 14" fill="currentColor">
      <circle cx="5" cy="3" r="1.1"/><circle cx="9" cy="3" r="1.1"/>
      <circle cx="5" cy="7" r="1.1"/><circle cx="9" cy="7" r="1.1"/>
      <circle cx="5" cy="11" r="1.1"/><circle cx="9" cy="11" r="1.1"/>
    </svg>
  ),
  Gear: (p) => (
    <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8l1.8-1.8M18 6l1.8-1.8"/>
    </svg>
  ),
  Download: (p) => (
    <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12M7 11l5 4 5-4M4 20h16"/>
    </svg>
  ),
  Upload: (p) => (
    <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4M7 8l5-4 5 4M4 20h16"/>
    </svg>
  ),
};

// ─── Status bar ─────────────────────────────────────────────
function StatusBar({ time, onMenu }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="statusbar">
      <span>{fmtClock(time || now)}</span>
      {onMenu && (
        <button onClick={onMenu} className="tap" aria-label={tr("Definições")} title={tr("Definições")}
          style={{
            background: "transparent", border: "none", color: "var(--ink-2)",
            cursor: "pointer", padding: 4, margin: -4, display: "flex", alignItems: "center",
          }}>
          <Icon.Gear size={16}/>
        </button>
      )}
    </div>
  );
}

// ─── Tab Bar ────────────────────────────────────────────────
function TabBar({ tab, onTab, accentColor }) {
  const tabs = [
    { id: "hoje", label: tr("Hoje"), Ic: Icon.Hoje },
    { id: "pauta", label: tr("Pauta"), Ic: Icon.Pauta },
    { id: "mares", label: tr("Marés"), Ic: Icon.Mares },
  ];
  return (
    <div style={{
      flexShrink: 0,
      borderTop: "1px solid var(--rule)",
      background: "var(--tabbar-bg)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      display: "flex",
      padding: "8px 16px 22px",
      position: "relative",
      zIndex: 5,
    }}>
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => onTab(t.id)} className="tap"
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              background: "transparent", border: "none", padding: "6px 0",
              color: active ? accentColor : "var(--ink-3)",
              fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
            <t.Ic size={22}/>
            <span style={{ fontWeight: active ? 600 : 400 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Sheet (centered modal) ─────────────────────────────────
function Sheet({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 100, animation: "fadeIn 0.18s ease" }}>
      <div onClick={onClose} style={{
        position: "absolute", inset: 0,
        background: "rgba(20,15,10,0.42)",
        backdropFilter: "blur(10px) saturate(120%)",
        WebkitBackdropFilter: "blur(10px) saturate(120%)",
      }}/>
      <div className="om-sheet-card" style={{
        position: "absolute",
        left: "50%", top: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(440px, calc(100% - 28px))",
        maxHeight: "min(86%, 760px)",
        background: "var(--paper)",
        borderRadius: 18,
        boxShadow: "0 24px 60px rgba(0,0,0,0.28), 0 0 0 1px rgba(20,15,10,0.04)",
        animation: "sheetCenterIn 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)",
        overflow: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        display: "flex", flexDirection: "column",
      }}>
        {/* Sticky header with title + close */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px 10px 22px",
          position: "sticky", top: 0,
          background: "var(--paper)",
          zIndex: 2,
        }}>
          <div style={{
            fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.18em",
            textTransform: "uppercase", color: "var(--ink-3)",
            flex: 1, minWidth: 0,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {title || ""}
          </div>
          <button
            onClick={onClose}
            className="tap"
            title={tr("fechar")}
            style={{
              flexShrink: 0,
              width: 30, height: 30, borderRadius: "50%",
              border: "1px solid var(--rule)",
              background: "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--ink-3)", cursor: "pointer",
              fontSize: 16, lineHeight: 1,
              fontFamily: "var(--mono)",
              padding: 0,
            }}>
            ×
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Auto-growing textarea ─────────────────────────────────
function AutoTextarea({ value, onChange, placeholder, minRows = 2, style, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={minRows}
      style={{
        width: "100%",
        resize: "none",
        border: "none",
        background: "transparent",
        fontFamily: "inherit",
        fontSize: "inherit",
        lineHeight: "inherit",
        color: "inherit",
        padding: 0,
        ...style,
      }}
      {...rest}
    />
  );
}

// ─── Editable text (inline) ────────────────────────────────
function EditableText({ value, onChange, placeholder, style, multiline = false, className }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value) onChange(draft.trim());
  };
  if (editing) {
    if (multiline) {
      return (
        <AutoTextarea value={draft} onChange={setDraft} onBlur={commit} autoFocus
          placeholder={placeholder} style={style}/>
      );
    }
    return (
      <input value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
        autoFocus placeholder={placeholder}
        style={{ width: "100%", border: "none", background: "transparent", padding: 0, font: "inherit", color: "inherit", ...style }}/>
    );
  }
  return (
    <span onClick={() => setEditing(true)} className={className}
      style={{ cursor: "text", ...style, color: value ? style?.color : "var(--ink-4)" }}>
      {value || placeholder}
    </span>
  );
}

// ─── Primary button ────────────────────────────────────────
function Button({ children, onClick, variant = "primary", style, disabled, accentColor, ...rest }) {
  const base = {
    border: "none",
    borderRadius: 999,
    padding: "13px 20px",
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: "-0.005em",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
    transition: "transform 0.08s, opacity 0.12s",
  };
  const variants = {
    primary: { background: accentColor || "var(--accent)", color: "var(--on-dark)" },
    inkPrimary: { background: "var(--surface-dark)", color: "var(--on-dark)" },
    ghost: { background: "transparent", color: "var(--ink-2)", padding: "11px 14px" },
    outline: { background: "transparent", color: "var(--ink)", border: "1px solid var(--rule)" },
  };
  return (
    <button onClick={onClick} disabled={disabled} className="tap"
      style={{ ...base, ...variants[variant], ...style }} {...rest}>
      {children}
    </button>
  );
}

// ─── Checkbox circle (custom) ──────────────────────────────
function Check({ checked, onChange, size = 22, accentColor }) {
  return (
    <button onClick={() => { if (window.haptic) window.haptic(8); onChange && onChange(); }} className="tap"
      style={{
        width: size, height: size, borderRadius: "50%",
        border: `1.6px solid ${checked ? (accentColor || "var(--accent)") : "var(--ink-3)"}`,
        background: checked ? (accentColor || "var(--accent)") : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, padding: 0,
      }}>
      {checked && <Icon.Check size={Math.round(size * 0.55)} color="var(--paper)"/>}
    </button>
  );
}

// ─── Drag-to-reorder (pointer/touch) ───────────────────────
// Reorders a vertical list of rows. Each row must carry a
// data-drag-id={id} attribute; the drag handle calls start(e, id).
// onReorder(orderedIds) fires live as the dragged row crosses others.
function useDragReorder(ids, onReorder) {
  const [dragId, setDragId] = useState(null);
  const idsRef = useRef(ids);
  idsRef.current = ids;

  const start = (e, id) => {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    if (window.haptic) window.haptic(10);
    setDragId(id);

    const move = (ev) => {
      const p = ev.touches ? ev.touches[0] : ev;
      const el = document.elementFromPoint(p.clientX, p.clientY);
      const row = el && el.closest && el.closest("[data-drag-id]");
      if (!row) return;
      const overId = row.getAttribute("data-drag-id");
      if (!overId || overId === id) return;
      const cur = idsRef.current.slice();
      const from = cur.indexOf(id);
      const to = cur.indexOf(overId);
      if (from < 0 || to < 0 || from === to) return;
      cur.splice(to, 0, cur.splice(from, 1)[0]);
      onReorder(cur);
    };
    const end = () => {
      setDragId(null);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      if (window.haptic) window.haptic(6);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  return { dragId, start };
}

Object.assign(window, { Icon, StatusBar, TabBar, Sheet, AutoTextarea, EditableText, Button, Check, useDragReorder });

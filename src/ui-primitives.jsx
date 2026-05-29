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
  Bell: (p) => (
    <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/>
      <path d="M10 19a2 2 0 0 0 4 0"/>
    </svg>
  ),
  Palette: (p) => (
    <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2 0-1.2-1-1.5-1-2.5s.8-1.5 2-1.5h2a4 4 0 0 0 4-4 8 8 0 0 0-9-8z"/>
      <circle cx="7.5" cy="12" r="1"/>
      <circle cx="10" cy="7.5" r="1"/>
      <circle cx="15" cy="7.5" r="1"/>
      <circle cx="17.5" cy="11" r="1"/>
    </svg>
  ),
  Info: (p) => (
    <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 11v6M12 7.5v.5"/>
    </svg>
  ),
  Database: (p) => (
    <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="8" ry="2.5"/>
      <path d="M4 5v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V5"/>
      <path d="M4 11v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-6"/>
    </svg>
  ),
};

// ─── Status bar ─────────────────────────────────────────────
function StatusBar({ onMenu }) {
  // The clock used to live here, but a mock time in the corner added no real
  // value over the device's own status bar — so the row now only holds the
  // settings affordance, pushed to the right.
  return (
    <div className="statusbar" style={{ justifyContent: "flex-end" }}>
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
      // Reserve room for the (transparent, edge-to-edge) system navigation bar.
      padding: "8px 16px calc(14px + env(safe-area-inset-bottom))",
      position: "relative",
      zIndex: 5,
    }}>
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => onTab(t.id)} className="tap"
            aria-label={t.label} aria-current={active ? "page" : undefined}
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

// ─── Focus trap (modal a11y) ────────────────────────────────
// While `open`, keep keyboard focus inside the modal: Escape closes it, Tab
// cycles within its focusable children, and focus returns to whatever was
// focused before it opened. Pointer/touch users are unaffected. No-ops while
// closed, so it's safe to call unconditionally (Rules of Hooks).
function useFocusTrap(ref, open, onClose) {
  useEffect(() => {
    if (!open) return;
    const node = ref.current;
    const prevFocus = document.activeElement;
    const SEL = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    // Only count visible controls (e.g. skip the hidden file <input>).
    const focusables = () => node ? Array.from(node.querySelectorAll(SEL)).filter(el => el.offsetParent !== null) : [];

    // Don't steal focus from a control that's already focused inside the modal
    // (e.g. an input rendered with autoFocus) — only pull focus in if it's
    // currently outside.
    if (!(node && node.contains(document.activeElement))) {
      const first = focusables()[0];
      if (first) first.focus();
      else if (node) { node.setAttribute("tabindex", "-1"); node.focus(); }
    }

    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); onClose && onClose(); return; }
      if (e.key !== "Tab") return;
      const f = focusables();
      if (f.length === 0) { e.preventDefault(); return; }
      const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      try { if (prevFocus && prevFocus.focus) prevFocus.focus(); } catch (e) {}
    };
  }, [open]);
}

// ─── Sheet (centered modal) ─────────────────────────────────
function Sheet({ open, onClose, children, title }) {
  const cardRef = useRef(null);
  useFocusTrap(cardRef, open, onClose);
  if (!open) return null;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 100, animation: "fadeIn 0.18s ease" }}>
      <div onClick={onClose} style={{
        position: "absolute", inset: 0,
        background: "rgba(20,15,10,0.42)",
        backdropFilter: "blur(10px) saturate(120%)",
        WebkitBackdropFilter: "blur(10px) saturate(120%)",
      }}/>
      <div ref={cardRef} className="om-sheet-card"
        role="dialog" aria-modal="true" aria-label={title || undefined} style={{
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

// ─── Starter chips ──────────────────────────────────────────
// Tappable suggestions shown in empty states, so a fresh tab invites action
// instead of presenting a void. `items` are PT source strings (translated for
// display); onPick receives the already-translated label so it's stored in the
// user's language, matching how seeded data is created.
function StarterChips({ items, onPick, accentColor, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 14, animation: "riseIn 0.45s ease both" }}>
      {label && (
        <div style={{
          fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.16em",
          textTransform: "uppercase", color: "var(--ink-4)", fontStyle: "normal",
        }}>{label}</div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((it, i) => (
          <button key={i} className="tap" type="button"
            onClick={() => onPick(tr(it))}
            style={{
              border: "1px solid " + accentColor + "44",
              background: accentColor + "12",
              color: "var(--ink-2)", borderRadius: 999,
              padding: "7px 13px", fontSize: 13.5, cursor: "pointer",
              fontFamily: "var(--sans)", fontStyle: "normal", lineHeight: 1.2,
            }}>
            <span style={{ color: accentColor, marginRight: 6, fontWeight: 600 }}>+</span>{tr(it)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── In-app confirm dialog ──────────────────────────────────
// Replaces the OS confirm() (grey, off-theme, breaks immersion) with a styled
// modal. Promise-based so call sites stay simple:
//   if (await window.pautaConfirm({ message, danger:true })) { ... }
// A native fallback is installed immediately (below) so calls before the host
// mounts still work; ConfirmHost overrides it with the themed version on mount.
function pautaConfirmFallback(opts) {
  var m = typeof opts === "string" ? opts : (opts && opts.message) || "";
  return Promise.resolve(window.confirm(m));
}
if (typeof window !== "undefined" && !window.pautaConfirm) window.pautaConfirm = pautaConfirmFallback;

function ConfirmHost() {
  const [req, setReq] = useState(null);
  const cardRef = useRef(null);
  useEffect(() => {
    window.pautaConfirm = (opts) => new Promise((resolve) => {
      const o = typeof opts === "string" ? { message: opts } : (opts || {});
      setReq({ message: o.message || "", okLabel: o.okLabel, cancelLabel: o.cancelLabel, danger: !!o.danger, resolve });
    });
    return () => { window.pautaConfirm = pautaConfirmFallback; };
  }, []);
  const close = (val) => { if (!req) return; const r = req.resolve; setReq(null); r(val); };
  useFocusTrap(cardRef, !!req, () => close(false));
  if (!req) return null;
  return (
    <div onClick={() => close(false)} style={{
      position: "absolute", inset: 0, zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      background: "rgba(0,0,0,0.5)", animation: "fadeIn 0.18s ease",
    }}>
      <div ref={cardRef} onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true" style={{
        width: "100%", maxWidth: 340, background: "var(--paper)",
        border: "1px solid var(--rule)", borderRadius: 16, padding: "22px 22px 16px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)", animation: "popIn 0.22s ease",
      }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: 19, lineHeight: 1.3, color: "var(--ink)", marginBottom: 20 }}>
          {req.message}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="tap" onClick={() => close(false)} style={{
            border: "none", background: "transparent", color: "var(--ink-3)",
            fontSize: 14, fontWeight: 500, padding: "10px 14px", cursor: "pointer",
          }}>{req.cancelLabel || tr("Cancelar")}</button>
          <button className="tap" onClick={() => close(true)} style={{
            border: "none", borderRadius: 10, padding: "10px 18px",
            fontSize: 14, fontWeight: 600, cursor: "pointer", color: "var(--on-dark)",
            background: req.danger ? "var(--accent)" : "var(--ink)",
          }}>{req.okLabel || tr("OK")}</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Icon, StatusBar, TabBar, Sheet, useFocusTrap, AutoTextarea, EditableText, Button, Check, useDragReorder, StarterChips, ConfirmHost });

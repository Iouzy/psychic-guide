// Pauta — App root
// Tab navigation, shared store, tweaks panel.

// ─── Settings controls ─────────────────────────────────────
function Segmented({ value, options, onChange, accentColor }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {options.map(o => {
        const on = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)} className="tap"
            style={{
              flex: 1, padding: "9px 6px", borderRadius: 8,
              border: "1px solid " + (on ? accentColor : "var(--rule)"),
              background: on ? `${accentColor}11` : "var(--paper-2)",
              color: on ? accentColor : "var(--ink-2)",
              fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.04em", cursor: "pointer",
            }}>{o.label}</button>
        );
      })}
    </div>
  );
}
function PrefToggle({ label, sub, value, onChange, accentColor }) {
  return (
    <button onClick={() => onChange(!value)} className="tap"
      style={{
        display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left",
        background: "var(--paper-2)", border: "1px solid var(--rule)", borderRadius: 12,
        padding: "12px 14px", cursor: "pointer", color: "var(--ink)",
      }}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 15, fontWeight: 500 }}>{label}</span>
        {sub && <span style={{ display: "block", fontSize: 12.5, color: "var(--ink-3)", marginTop: 2 }}>{sub}</span>}
      </span>
      <span style={{
        width: 40, height: 24, borderRadius: 999, flexShrink: 0, position: "relative",
        background: value ? accentColor : "var(--rule)", transition: "background 0.15s",
      }}>
        <span style={{
          position: "absolute", top: 2, left: value ? 18 : 2, width: 20, height: 20,
          borderRadius: "50%", background: "var(--paper)", transition: "left 0.15s",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }}/>
      </span>
    </button>
  );
}

// ─── UPDATE CHECKER ─────────────────────────────────────────
// Queries the GitHub Releases API for the rolling "latest" tag and compares
// its publication time against the build stamp injected at build time. When a
// newer APK is available the user can tap to download it via the system
// browser, which fixes the "package conflicts with an existing package" loop
// some users hit when sideloading APKs through Firefox on MIUI.
function UpdateChecker({ accentColor }) {
  const build = window.PAUTA_BUILD || { ts: 0, run: 0 };
  const repo  = window.PAUTA_REPO  || "Iouzy/psychic-guide";
  const [state, setState] = useState({ kind: "idle" });

  const check = async () => {
    setState({ kind: "checking" });
    try {
      const r = await fetch(`https://api.github.com/repos/${repo}/releases/tags/latest`, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      const releasedAt = j.published_at ? Math.floor(new Date(j.published_at).getTime() / 1000) : 0;
      const apk = (j.assets || []).find(a => /\.apk$/i.test(a.name || ""));
      if (!apk) { setState({ kind: "err", text: tr("Sem APK disponível no repositório.") }); return; }
      // build.ts === 0 in local dev / sideloaded APKs without a stamp — treat
      // every release as newer so the user can always pull the freshest APK.
      if (build.ts > 0 && releasedAt > 0 && releasedAt <= build.ts) {
        setState({ kind: "uptodate" });
      } else {
        setState({ kind: "available", url: apk.browser_download_url, releasedAt });
      }
    } catch (e) {
      setState({ kind: "err", text: tr("Não foi possível verificar atualizações.") });
    }
  };

  const buildLabel = build.run > 0
    ? trf("Versão atual: build {n}", { n: build.run })
    : tr("Versão de desenvolvimento.");

  let subtitle = buildLabel;
  let status = null;
  if (state.kind === "checking") subtitle = tr("A verificar…");
  else if (state.kind === "uptodate") { subtitle = tr("Está atualizado."); status = "ok"; }
  else if (state.kind === "available") { subtitle = tr("Atualização disponível."); status = "ok"; }
  else if (state.kind === "err") { subtitle = state.text; status = "err"; }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button onClick={check} className="tap"
        disabled={state.kind === "checking"}
        style={{
          display: "flex", alignItems: "center", gap: 14, width: "100%",
          textAlign: "left", background: "var(--paper-2)",
          border: "1px solid var(--rule)", borderRadius: 12,
          padding: "13px 14px", cursor: "pointer", color: "var(--ink)",
        }}>
        <span style={{
          flexShrink: 0, width: 34, height: 34, borderRadius: 9,
          background: "var(--paper-3)", color: "var(--ink-2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><Icon.Download size={16}/></span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 15, fontWeight: 500, color: "var(--ink)", lineHeight: 1.2 }}>
            {tr("Verificar atualizações")}
          </span>
          <span style={{
            display: "block", fontSize: 12.5, marginTop: 2, lineHeight: 1.3,
            color: status === "err" ? "var(--accent)" : status === "ok" ? "var(--good)" : "var(--ink-3)",
          }}>{subtitle}</span>
        </span>
        <Icon.Chevron size={14}/>
      </button>
      {state.kind === "available" && (
        <button onClick={() => window.open(state.url, "_blank")} className="tap"
          style={{
            background: accentColor, color: "var(--on-dark)", border: "none",
            borderRadius: 12, padding: "12px 14px", cursor: "pointer",
            fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}>
          {tr("Transferir nova versão")}
        </button>
      )}
    </div>
  );
}

// ─── DATA / SETTINGS SHEET ──────────────────────────────────
// User-facing home for analysis, preferences, reminders, backup, install, reset.
function DataSheet({ open, onClose, store, accentColor, onOpenInsights, onOpenTierGuide }) {
  const fileRef = useRef(null);
  const [msg, setMsg] = useState(null); // { kind:"ok"|"err", text }
  const [canInstall, setCanInstall] = useState(!!window.PAUTA_DEFERRED_INSTALL);
  const prefs = store.state.prefs;

  const timeRow = { display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "var(--sans)", fontSize: 14, color: "var(--ink-2)" };
  const timeInput = { border: "1px solid var(--rule)", background: "var(--paper-2)", borderRadius: 8, padding: "6px 10px", fontFamily: "var(--mono)", fontSize: 14, color: "var(--ink)" };

  // Enabling reminders requests notification permission first.
  const onToggleReminders = async (next) => {
    if (next) {
      if (typeof Notification === "undefined") {
        setMsg({ kind: "err", text: tr("Este dispositivo não suporta notificações.") });
        return;
      }
      let perm = Notification.permission;
      if (perm === "default") { try { perm = await Notification.requestPermission(); } catch (e) {} }
      if (perm !== "granted") {
        setMsg({ kind: "err", text: tr("Permissão de notificações negada.") });
        store.setReminderPref("enabled", false);
        return;
      }
    }
    store.setReminderPref("enabled", next);
  };

  const isStandalone =
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    window.navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

  useEffect(() => {
    const onAvail = () => setCanInstall(true);
    const onDone = () => { setCanInstall(false); setMsg({ kind: "ok", text: tr("App instalada.") }); };
    window.addEventListener("pauta-installable", onAvail);
    window.addEventListener("pauta-installed", onDone);
    return () => {
      window.removeEventListener("pauta-installable", onAvail);
      window.removeEventListener("pauta-installed", onDone);
    };
  }, []);

  const onExport = () => {
    store.exportData();
    setMsg({ kind: "ok", text: tr("Backup transferido.") });
  };

  const onPickFile = () => { setMsg(null); fileRef.current && fileRef.current.click(); };

  const onFileChosen = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (!confirm(tr("Importar este backup substitui todos os dados atuais. Continuar?"))) return;
      const res = store.importData(String(reader.result || ""));
      if (res.ok) setMsg({ kind: "ok", text: tr("Backup importado com sucesso.") });
      else setMsg({ kind: "err", text: res.error });
    };
    reader.onerror = () => setMsg({ kind: "err", text: tr("Não foi possível ler o ficheiro.") });
    reader.readAsText(file);
  };

  const onInstall = async () => {
    const ev = window.PAUTA_DEFERRED_INSTALL;
    if (!ev) return;
    ev.prompt();
    try { await ev.userChoice; } catch (e) {}
    window.PAUTA_DEFERRED_INSTALL = null;
    setCanInstall(false);
  };

  return (
    <Sheet open={open} onClose={onClose} title={tr("Definições")}>
      <div style={{ padding: "0 22px 28px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Hero header — sets the tone of the sheet */}
        <div style={{
          padding: "4px 0 18px",
          borderBottom: "1px solid var(--rule)",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: `${accentColor}14`,
            border: `1px solid ${accentColor}33`,
            color: accentColor,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon.Mares size={22}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "var(--serif)", fontSize: 24, lineHeight: 1.05,
              color: "var(--ink)", letterSpacing: "-0.01em",
            }}>Pauta</div>
            <div style={{
              fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13,
              color: "var(--ink-3)", lineHeight: 1.3, marginTop: 2,
            }}>{tr("Hoje · Pauta · Marés")}</div>
          </div>
        </div>

        <DataGroup label={tr("Análise")} icon={<Icon.Mares size={13}/>}>
          <DataAction accentColor={accentColor}
            icon={<Icon.Mares size={16}/>}
            title={tr("Revisão semanal")}
            subtitle={tr("Foco, hábitos e padrões dos últimos 7 dias.")}
            onClick={() => { onClose(); onOpenInsights && onOpenInsights(); }}/>
          <DataAction accentColor={accentColor}
            icon={<Icon.Info size={16}/>}
            title={tr("Como funcionam as marés")}
            subtitle={tr("O que significam os tiers, de Onda a Tsunami.")}
            onClick={() => { onClose(); onOpenTierGuide && onOpenTierGuide(); }}/>
        </DataGroup>

        <DataGroup label={tr("Aparência")} icon={<Icon.Palette size={13}/>}>
          <div style={prefBlock}>
            <div style={prefLabel}>{tr("Idioma")}</div>
            <Segmented value={prefs.lang} accentColor={accentColor}
              onChange={v => store.setPref("lang", v)}
              options={[
                { value: "pt", label: "Português" },
                { value: "en", label: "English" },
              ]}/>
          </div>
          <div style={prefBlock}>
            <div style={prefLabel}>{tr("Tema")}</div>
            <Segmented value={prefs.theme} accentColor={accentColor}
              onChange={v => store.setPref("theme", v)}
              options={[
                { value: "auto", label: tr("Auto") },
                { value: "light", label: tr("Claro") },
                { value: "dark", label: tr("Escuro") },
              ]}/>
          </div>
          <div style={prefBlock}>
            <div style={prefLabel}>{tr("Cor de destaque")}</div>
            <AccentPicker value={accentColor} onChange={v => { store.setPref("accent", v); haptic(8); }}/>
          </div>
          <PrefToggle label={tr("Vibração")} sub={tr("Pequeno toque ao concluir.")} accentColor={accentColor}
            value={prefs.haptics} onChange={v => store.setPref("haptics", v)}/>
          <PrefToggle label={tr("Reduzir movimento")} sub={tr("Desliga animações. Segue o sistema por omissão.")} accentColor={accentColor}
            value={prefs.reducedMotion} onChange={v => store.setPref("reducedMotion", v)}/>
        </DataGroup>

        <DataGroup label={tr("Lembretes")} icon={<Icon.Bell size={13}/>}>
          {isNative && <FocusNotifControl accentColor={accentColor}/>}
          <PrefToggle label={tr("Notificações")} sub={tr("Avisos locais enquanto a app está aberta.")} accentColor={accentColor}
            value={prefs.reminders.enabled} onChange={onToggleReminders}/>
          {prefs.reminders.enabled && (
            <div style={{
              display: "flex", flexDirection: "column", gap: 10,
              padding: "12px 14px", background: "var(--paper-2)",
              border: "1px solid var(--rule)", borderRadius: 12,
            }}>
              <label style={timeRow}>
                <span>{tr("Hábitos pendentes")}</span>
                <input type="time" value={prefs.reminders.habitsTime}
                  onChange={e => store.setReminderPref("habitsTime", e.target.value)} style={timeInput}/>
              </label>
              <label style={timeRow}>
                <span>{tr("Reflexão noturna")}</span>
                <input type="time" value={prefs.reminders.reflectionTime}
                  onChange={e => store.setReminderPref("reflectionTime", e.target.value)} style={timeInput}/>
              </label>
              <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 12, color: "var(--ink-3)", lineHeight: 1.4 }}>
                {tr("Sem servidor: os avisos só chegam com a app aberta no telemóvel ou no browser.")}
              </div>
            </div>
          )}
        </DataGroup>

        <DataGroup label={tr("Dados")} icon={<Icon.Database size={13}/>}>
          <DataAction icon={<Icon.Download size={16}/>} accentColor={accentColor}
            title={tr("Exportar dados")}
            subtitle={tr("Transfere um ficheiro .json com tudo.")}
            onClick={onExport}/>
          <DataAction icon={<Icon.Upload size={16}/>} accentColor={accentColor}
            title={tr("Importar dados")}
            subtitle={tr("Restaura a partir de um ficheiro .json.")}
            onClick={onPickFile}/>
          <input ref={fileRef} type="file" accept="application/json,.json"
            onChange={onFileChosen} style={{ display: "none" }}/>
        </DataGroup>

        {isNative && (
          <DataGroup label={tr("Aplicação")} icon={<Icon.Download size={13}/>}>
            <UpdateChecker accentColor={accentColor}/>
          </DataGroup>
        )}

        {!isStandalone && !isNative && (
          <DataGroup label={tr("Instalar")} icon={<Icon.Plus size={13}/>}>
            {canInstall && (
              <DataAction icon={<Icon.Plus size={16}/>} accentColor={accentColor}
                title={tr("Instalar app")}
                subtitle={tr("Adiciona o Pauta ao ecrã inicial.")}
                onClick={onInstall}/>
            )}
            {!canInstall && (
              <div style={{
                fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-2)",
                lineHeight: 1.5, background: "var(--paper-2)", borderRadius: 12,
                padding: "12px 14px", border: "1px solid var(--rule)",
              }}>
                {isIOS ? (
                  <>{tr("Para instalar no iPhone/iPad: toque em ")}<b>{tr("Partilhar")}</b>{tr(" e depois em ")}<b>{tr("Adicionar ao ecrã principal")}</b>{tr(".")}</>
                ) : (
                  <>{tr("Para instalar: no menu do navegador, escolha ")}<b>{tr("Adicionar ao ecrã principal")}</b>{tr(" ou ")}<b>{tr("Instalar app")}</b>{tr(".")}</>
                )}
              </div>
            )}
          </DataGroup>
        )}

        <DataGroup label={tr("Zona perigosa")} icon={<Icon.Trash size={13}/>}>
          <DataAction accentColor={accentColor}
            title={tr("Recarregar exemplo")}
            subtitle={tr("Substitui tudo por dados de demonstração.")}
            onClick={() => { store.reseed(); }}/>
          <DataAction accentColor={accentColor} danger={true}
            icon={<Icon.Trash size={16}/>}
            title={tr("Apagar tudo")}
            subtitle={tr("Remove permanentemente todos os dados.")}
            onClick={() => { store.resetAll(); }}/>
        </DataGroup>

        {msg && (
          <div style={{
            fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.02em",
            color: msg.kind === "err" ? "var(--accent)" : "var(--good)",
            textAlign: "center",
          }}>
            {msg.text}
          </div>
        )}

        {/* About footer */}
        <div style={{
          marginTop: 6, paddingTop: 16, borderTop: "1px solid var(--rule)",
          fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 12,
          color: "var(--ink-3)", lineHeight: 1.5, textAlign: "center",
        }}>
          {tr("Código-fonte e instruções:")}<br/>
          <a href="https://github.com/Iouzy/psychic-guide" target="_blank" rel="noopener noreferrer"
            style={{ color: accentColor, textDecoration: "none", fontStyle: "normal", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.04em" }}>
            github.com/Iouzy/psychic-guide ↗
          </a>
        </div>
      </div>
    </Sheet>
  );
}

const prefBlock = { display: "flex", flexDirection: "column", gap: 8 };
const prefLabel = {
  fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em",
  textTransform: "uppercase", color: "var(--ink-3)",
};

// Curated accent palette. The first entry (#B8533A) is the build default.
const ACCENT_OPTIONS = [
  { hex: "#B8533A", name: "Terracota" },
  { hex: "#5A6B3E", name: "Salva" },
  { hex: "#3D5A80", name: "Índigo" },
  { hex: "#2E6E6A", name: "Oceano" },
  { hex: "#8E5A8E", name: "Ameixa" },
  { hex: "#A6792E", name: "Âmbar" },
  { hex: "#1A1815", name: "Tinta" },
];

// Native-only control for the focus-timer notification permission. On Android
// 13+ the timer notification is invisible without POST_NOTIFICATIONS, so this
// surfaces the state and lets the user grant it (or learn they must enable it
// in system Settings, since Android stops showing the dialog after a denial).
function FocusNotifControl({ accentColor }) {
  const [granted, setGranted] = useState(null);   // null = still checking
  const [asked, setAsked] = useState(false);

  useEffect(() => {
    let alive = true;
    window.FocusActivity.checkPermission()
      .then(r => { if (alive) setGranted(!!(r && r.granted)); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const request = async () => {
    setAsked(true);
    try {
      const r = await window.FocusActivity.requestPermission();
      setGranted(!!(r && r.granted));
    } catch (_) {}
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 10,
      padding: "12px 14px", background: "var(--paper-2)",
      border: "1px solid var(--rule)", borderRadius: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{tr("Notificação de foco")}</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 2, lineHeight: 1.3 }}>
            {tr("Mostra o cronómetro do bloco ativo na barra de notificações.")}
          </div>
        </div>
        <span style={{
          flexShrink: 0, fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.08em",
          textTransform: "uppercase", padding: "3px 8px", borderRadius: 6,
          color: granted ? "var(--good)" : "var(--ink-3)",
          background: granted ? "color-mix(in srgb, var(--good) 16%, transparent)" : "var(--paper-3)",
        }}>
          {granted === null ? "…" : granted ? tr("ativa") : tr("desligada")}
        </span>
      </div>
      {granted === false && (
        <button onClick={request} className="tap"
          style={{
            border: "none", borderRadius: 8, padding: "9px 12px", cursor: "pointer",
            background: accentColor, color: "#fff", fontSize: 13, fontWeight: 500,
          }}>
          {tr("Permitir notificações")}
        </button>
      )}
      {granted === false && asked && (
        <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 12, color: "var(--ink-3)", lineHeight: 1.4 }}>
          {tr("Se nada acontecer, ative as notificações do Pauta nas definições do sistema.")}
        </div>
      )}
    </div>
  );
}

// A row of accent swatches. The selected one gets a ring; tapping sets it.
function AccentPicker({ value, onChange }) {
  const norm = (h) => (h || "").toLowerCase();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      {ACCENT_OPTIONS.map(({ hex, name }) => {
        const selected = norm(value) === norm(hex);
        return (
          <button key={hex} type="button" className="tap" title={name}
            aria-label={name} aria-pressed={selected}
            onClick={() => onChange(hex)}
            style={{
              width: 30, height: 30, borderRadius: "50%", cursor: "pointer",
              background: hex, padding: 0,
              border: selected ? "2px solid var(--paper)" : "2px solid transparent",
              boxShadow: selected
                ? `0 0 0 2px ${hex}, 0 1px 4px rgba(0,0,0,0.2)`
                : "0 1px 3px rgba(0,0,0,0.15)",
              transition: "transform 0.12s ease, box-shadow 0.12s ease",
            }}/>
        );
      })}
    </div>
  );
}

function DataGroup({ label, icon, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.16em",
        textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 2,
      }}>
        {icon && <span style={{ display: "inline-flex", color: "var(--ink-3)" }}>{icon}</span>}
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}

function DataAction({ icon, title, subtitle, onClick, accentColor, danger }) {
  return (
    <button onClick={onClick} className="tap"
      style={{
        display: "flex", alignItems: "center", gap: 14, width: "100%",
        textAlign: "left", background: "var(--paper-2)",
        border: "1px solid var(--rule)", borderRadius: 12,
        padding: "13px 14px", cursor: "pointer", color: "var(--ink)",
      }}>
      {icon && (
        <span style={{
          flexShrink: 0, width: 34, height: 34, borderRadius: 9,
          background: "var(--paper-3)", color: danger ? "var(--accent)" : "var(--ink-2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{icon}</span>
      )}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          display: "block", fontSize: 15, fontWeight: 500,
          color: danger ? "var(--accent)" : "var(--ink)", lineHeight: 1.2,
        }}>{title}</span>
        {subtitle && (
          <span style={{ display: "block", fontSize: 12.5, color: "var(--ink-3)", marginTop: 2, lineHeight: 1.3 }}>
            {subtitle}
          </span>
        )}
      </span>
      <Icon.Chevron size={14}/>
    </button>
  );
}

const TAB_ORDER = ["hoje", "pauta", "mares"];

function App() {
  const store = useStore();
  const [t, setTweak] = useTweaks(window.PAUTA_TWEAK_DEFAULTS || {
    accent: "#B8533A", showElapsed: true, density: "cozy",
  });

  const [tab, setTab] = useState("pauta");
  const [pendingIntention, setPendingIntention] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [tierGuideOpen, setTierGuideOpen] = useState(false);

  const prefs = store.state.prefs;

  // Mirror language to the global read by tr()/trf() synchronously, so the whole
  // tree re-renders in the chosen language. Persist for the next cold start.
  window.PAUTA_LANG = prefs.lang === "en" ? "en" : "pt";
  useEffect(() => {
    try { localStorage.setItem("pauta.lang", prefs.lang); } catch (e) {}
  }, [prefs.lang]);

  const jumpToPauta = ({ intention }) => {
    setPendingIntention(intention);
    setTab("pauta");
  };

  // A user-chosen accent (Settings) wins; otherwise fall back to the build-time
  // default exposed via the Tweaks panel / PAUTA_TWEAK_DEFAULTS.
  const accentColor = prefs.accent || t.accent;

  // Update CSS var so design system follows accent
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accentColor);
  }, [accentColor]);

  // Apply theme + mirror haptics flag whenever prefs change.
  useEffect(() => {
    if (window.PAUTA_APPLY_THEME) window.PAUTA_APPLY_THEME(prefs.theme);
  }, [prefs.theme]);
  useEffect(() => { window.PAUTA_HAPTICS = !!prefs.haptics; }, [prefs.haptics]);

  // Reduce motion: explicit opt-in via Settings, or implicitly when the OS
  // asks for it. Mirrored to a <html> attribute that the CSS in index.html
  // uses to neutralise every animation/transition.
  useEffect(() => {
    const osReduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reduce = prefs.reducedMotion || osReduced;
    const root = document.documentElement;
    if (reduce) root.setAttribute("data-reduced-motion", "true");
    else root.removeAttribute("data-reduced-motion");
  }, [prefs.reducedMotion]);

  // Local reminders (only while the app is open).
  useReminders(store);
  // Native Android focus timer notification / Xiaomi island.
  useFocusActivity(store);

  // Keyboard shortcuts (desktop): 1/2/3 tabs, g settings, i insights, ? guide.
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.key === "1") setTab("hoje");
      else if (e.key === "2") setTab("pauta");
      else if (e.key === "3") setTab("mares");
      else if (e.key === "g") setSettingsOpen(true);
      else if (e.key === "i") setInsightsOpen(true);
      else if (e.key === "?") setTierGuideOpen(true);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Swipe between tabs (mobile). Ignored over horizontal scrollers / open sheets.
  const swipeRef = useRef(null);
  const onTouchStart = (e) => {
    const t0 = e.touches[0];
    swipeRef.current = { x: t0.clientX, y: t0.clientY, noswipe: !!(e.target.closest && e.target.closest("[data-noswipe]")) };
  };
  const onTouchEnd = (e) => {
    const s = swipeRef.current; swipeRef.current = null;
    if (!s || s.noswipe) return;
    if (document.querySelector(".om-sheet-card")) return; // a sheet is open
    const t1 = e.changedTouches[0];
    const dx = t1.clientX - s.x, dy = t1.clientY - s.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 2) return;
    const idx = TAB_ORDER.indexOf(tab);
    const next = dx < 0 ? idx + 1 : idx - 1;
    if (next >= 0 && next < TAB_ORDER.length) { setTab(TAB_ORDER[next]); haptic(6); }
  };

  return (
    <div className="frame">
      <StatusBar onMenu={() => setSettingsOpen(true)}/>

      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1 }}>
        {/* key={tab} replays the settle animation on each switch. Tabs already
            unmount when hidden, so the remount changes nothing but the entrance. */}
        <div key={tab} style={{
          flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
          animation: "tabIn 0.28s ease both",
        }}>
          {tab === "hoje" && (
            <TabHoje store={store} accentColor={accentColor}
              onJumpToPauta={jumpToPauta}/>
          )}
          {tab === "pauta" && (
            <TabPauta store={store} accentColor={accentColor}
              showElapsed={t.showElapsed}
              pendingIntention={pendingIntention}
              clearPending={() => setPendingIntention(null)}/>
          )}
          {tab === "mares" && (
            <TabMares store={store} accentColor={accentColor}/>
          )}
        </div>
      </div>

      <TabBar tab={tab} onTab={setTab} accentColor={accentColor}/>

      <DataSheet open={settingsOpen} onClose={() => setSettingsOpen(false)}
        store={store} accentColor={accentColor}
        onOpenInsights={() => setInsightsOpen(true)}
        onOpenTierGuide={() => setTierGuideOpen(true)}/>
      <InsightsSheet open={insightsOpen} onClose={() => setInsightsOpen(false)}
        store={store} accentColor={accentColor}/>
      <TierGuideSheet open={tierGuideOpen} onClose={() => setTierGuideOpen(false)}
        accentColor={accentColor}/>
      {!prefs.onboardingSeen && (
        <OnboardingOverlay accentColor={accentColor}
          store={store}
          onTab={setTab}
          onDone={(reset) => {
            // The user can choose to keep what they created during the tour, or
            // start clean. The clean path also wipes the demo seed silently
            // (no confirm() prompt — that's reserved for the in-app reset).
            if (reset) store.clearForOnboarding();
            else store.setPref("onboardingSeen", true);
            setTab("hoje");
          }}/>
      )}

      <TweaksPanel title={tr("Tweaks")}>
        <TweakSection label={tr("Cor de destaque")}/>
        <TweakColor
          label={tr("Acento")} value={t.accent}
          options={["#B8533A", "#5A6B3E", "#3D5A80", "#8E5A8E", "#1A1815"]}
          onChange={v => setTweak("accent", v)}
        />
        <TweakSection label={tr("Pauta")}/>
        <TweakToggle label={tr("Cronómetro visível")} value={t.showElapsed}
          onChange={v => setTweak("showElapsed", v)}/>
        <TweakSection label={tr("Dados")}/>
        <TweakButton label={tr("Recarregar exemplo")} onClick={store.reseed}/>
        <TweakButton label={tr("Apagar tudo")} onClick={store.resetAll} secondary={true}/>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);

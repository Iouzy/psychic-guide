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
      <div style={{ padding: "4px 22px 28px", display: "flex", flexDirection: "column", gap: 22 }}>

        <DataGroup label={tr("Análise")}>
          <DataAction accentColor={accentColor}
            title={tr("Revisão semanal")}
            subtitle={tr("Foco, hábitos e padrões dos últimos 7 dias.")}
            onClick={() => { onClose(); onOpenInsights && onOpenInsights(); }}/>
          <DataAction accentColor={accentColor}
            title={tr("Como funcionam as marés")}
            subtitle={tr("O que significam os tiers, de Onda a Tsunami.")}
            onClick={() => { onClose(); onOpenTierGuide && onOpenTierGuide(); }}/>
        </DataGroup>

        <DataGroup label={tr("Preferências")}>
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-2)", marginBottom: 8, marginTop: 2 }}>{tr("Idioma")}</div>
            <Segmented value={prefs.lang} accentColor={accentColor}
              onChange={v => store.setPref("lang", v)}
              options={[
                { value: "pt", label: "Português" },
                { value: "en", label: "English" },
              ]}/>
          </div>
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-2)", marginBottom: 8, marginTop: 2 }}>{tr("Tema")}</div>
            <Segmented value={prefs.theme} accentColor={accentColor}
              onChange={v => store.setPref("theme", v)}
              options={[
                { value: "auto", label: tr("Auto") },
                { value: "light", label: tr("Claro") },
                { value: "dark", label: tr("Escuro") },
              ]}/>
          </div>
          <PrefToggle label={tr("Vibração")} sub={tr("Pequeno toque ao concluir.")} accentColor={accentColor}
            value={prefs.haptics} onChange={v => store.setPref("haptics", v)}/>
        </DataGroup>

        <DataGroup label={tr("Lembretes")}>
          <PrefToggle label={tr("Notificações")} sub={tr("Avisos locais enquanto a app está aberta.")} accentColor={accentColor}
            value={prefs.reminders.enabled} onChange={onToggleReminders}/>
          {prefs.reminders.enabled && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "4px 2px" }}>
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

        <DataGroup label={tr("Backup")}>
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

        {!isStandalone && (
          <DataGroup label={tr("Instalar")}>
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
            <div style={{
              fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-2)",
              lineHeight: 1.5, marginTop: canInstall ? 10 : 0,
            }}>
              {tr("Código-fonte e instruções no repositório: ")}
              <a href="https://github.com/Iouzy/psychic-guide" target="_blank" rel="noopener noreferrer"
                style={{ color: accentColor, textDecoration: "underline", wordBreak: "break-all" }}>
                github.com/Iouzy/psychic-guide
              </a>
            </div>
          </DataGroup>
        )}

        <DataGroup label={tr("Aplicação")}>
          <DataAction accentColor={accentColor}
            title={tr("Recarregar exemplo")}
            subtitle={tr("Substitui tudo por dados de demonstração.")}
            onClick={() => { store.reseed(); }}/>
          <DataAction accentColor={accentColor} danger={true}
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
      </div>
    </Sheet>
  );
}

function DataGroup({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{
        fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.16em",
        textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 2,
      }}>{label}</div>
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

  const accentColor = t.accent;

  // Update CSS var so design system follows accent
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accentColor);
  }, [accentColor]);

  // Apply theme + mirror haptics flag whenever prefs change.
  useEffect(() => {
    if (window.PAUTA_APPLY_THEME) window.PAUTA_APPLY_THEME(prefs.theme);
  }, [prefs.theme]);
  useEffect(() => { window.PAUTA_HAPTICS = !!prefs.haptics; }, [prefs.haptics]);

  // Local reminders (only while the app is open).
  useReminders(store);

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
          onDone={() => { store.setPref("onboardingSeen", true); setTab("hoje"); }}/>
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

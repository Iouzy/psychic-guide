// Pauta — App root
// Tab navigation, shared store, tweaks panel.

// ─── DATA / SETTINGS SHEET ──────────────────────────────────
// User-facing home for backup (export/import), install, and reset actions.
function DataSheet({ open, onClose, store, accentColor }) {
  const fileRef = useRef(null);
  const [msg, setMsg] = useState(null); // { kind:"ok"|"err", text }
  const [canInstall, setCanInstall] = useState(!!window.PAUTA_DEFERRED_INSTALL);

  const isStandalone =
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    window.navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  useEffect(() => {
    const onAvail = () => setCanInstall(true);
    const onDone = () => { setCanInstall(false); setMsg({ kind: "ok", text: "App instalada." }); };
    window.addEventListener("pauta-installable", onAvail);
    window.addEventListener("pauta-installed", onDone);
    return () => {
      window.removeEventListener("pauta-installable", onAvail);
      window.removeEventListener("pauta-installed", onDone);
    };
  }, []);

  const onExport = () => {
    store.exportData();
    setMsg({ kind: "ok", text: "Backup transferido." });
  };

  const onPickFile = () => { setMsg(null); fileRef.current && fileRef.current.click(); };

  const onFileChosen = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (!confirm("Importar este backup substitui todos os dados atuais. Continuar?")) return;
      const res = store.importData(String(reader.result || ""));
      if (res.ok) setMsg({ kind: "ok", text: "Backup importado com sucesso." });
      else setMsg({ kind: "err", text: res.error });
    };
    reader.onerror = () => setMsg({ kind: "err", text: "Não foi possível ler o ficheiro." });
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
    <Sheet open={open} onClose={onClose} title="Definições">
      <div style={{ padding: "4px 22px 28px", display: "flex", flexDirection: "column", gap: 22 }}>

        <DataGroup label="Backup">
          <DataAction icon={<Icon.Download size={16}/>} accentColor={accentColor}
            title="Exportar dados"
            subtitle="Transfere um ficheiro .json com tudo."
            onClick={onExport}/>
          <DataAction icon={<Icon.Upload size={16}/>} accentColor={accentColor}
            title="Importar dados"
            subtitle="Restaura a partir de um ficheiro .json."
            onClick={onPickFile}/>
          <input ref={fileRef} type="file" accept="application/json,.json"
            onChange={onFileChosen} style={{ display: "none" }}/>
        </DataGroup>

        {!isStandalone && (
          <DataGroup label="Instalar">
            {canInstall && (
              <DataAction icon={<Icon.Plus size={16}/>} accentColor={accentColor}
                title="Instalar app"
                subtitle="Adiciona o Pauta ao ecrã inicial."
                onClick={onInstall}/>
            )}
            {!canInstall && (
              <div style={{
                fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-2)",
                lineHeight: 1.5, background: "var(--paper-2)", borderRadius: 12,
                padding: "12px 14px", border: "1px solid var(--rule)",
              }}>
                {isIOS ? (
                  <>Para instalar no iPhone/iPad: toque em <b>Partilhar</b> e depois em <b>Adicionar ao ecrã principal</b>.</>
                ) : (
                  <>Para instalar: no menu do navegador, escolha <b>Adicionar ao ecrã principal</b> ou <b>Instalar app</b>.</>
                )}
              </div>
            )}
          </DataGroup>
        )}

        <DataGroup label="Aplicação">
          <DataAction accentColor={accentColor}
            title="Recarregar exemplo"
            subtitle="Substitui tudo por dados de demonstração."
            onClick={() => { store.reseed(); }}/>
          <DataAction accentColor={accentColor} danger={true}
            title="Apagar tudo"
            subtitle="Remove permanentemente todos os dados."
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

function App() {
  const store = useStore();
  const [t, setTweak] = useTweaks(window.PAUTA_TWEAK_DEFAULTS || {
    accent: "#B8533A", showElapsed: true, density: "cozy",
  });

  const [tab, setTab] = useState("pauta");
  const [pendingIntention, setPendingIntention] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const jumpToPauta = ({ intention }) => {
    setPendingIntention(intention);
    setTab("pauta");
  };

  const accentColor = t.accent;

  // Update CSS var so design system follows accent
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accentColor);
  }, [accentColor]);

  return (
    <div className="frame">
      <StatusBar onMenu={() => setSettingsOpen(true)}/>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1 }}>
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
        store={store} accentColor={accentColor}/>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Cor de destaque"/>
        <TweakColor
          label="Acento" value={t.accent}
          options={["#B8533A", "#5A6B3E", "#3D5A80", "#8E5A8E", "#1A1815"]}
          onChange={v => setTweak("accent", v)}
        />
        <TweakSection label="Pauta"/>
        <TweakToggle label="Cronómetro visível" value={t.showElapsed}
          onChange={v => setTweak("showElapsed", v)}/>
        <TweakSection label="Dados"/>
        <TweakButton label="Recarregar exemplo" onClick={store.reseed}/>
        <TweakButton label="Apagar tudo" onClick={store.resetAll} secondary={true}/>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);

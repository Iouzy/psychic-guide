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
// newer APK is available:
//   • in the native Android app it is downloaded and handed straight to the
//     system package installer (AppUpdater plugin) — no browser, installs
//     in-place over the current app and keeps the user's data, and
//   • in a plain browser/PWA (no native installer) it falls back to opening the
//     APK download URL, which also fixes the "package conflicts with an
//     existing package" loop some users hit when sideloading through a browser.
function UpdateChecker({ accentColor, store }) {
  const build = window.PAUTA_BUILD || { ts: 0, run: 0 };
  const repo  = window.PAUTA_REPO  || "Iouzy/psychic-guide";
  const [state, setState] = useState({ kind: "idle" });

  // Reflect native download progress (0–100) in the button subtitle.
  useEffect(() => {
    if (!(window.AppUpdater && window.AppUpdater.isNative)) return;
    const sub = window.AppUpdater.addListener("downloadProgress", (e) => {
      const pct = e && typeof e.percent === "number" ? e.percent : null;
      setState(s => (s.kind === "downloading" ? { ...s, progress: pct } : s));
    });
    // addListener may return a handle or a Promise of one (Capacitor versions differ).
    return () => { try { Promise.resolve(sub).then(h => h && h.remove && h.remove()); } catch (_) {} };
  }, []);

  const check = async () => {
    setState({ kind: "checking" });
    try {
      const r = await fetch(`https://api.github.com/repos/${repo}/releases/tags/latest`, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      const apk = (j.assets || []).find(a => /\.apk$/i.test(a.name || ""));
      if (!apk) { setState({ kind: "err", text: tr("Sem APK disponível no repositório.") }); return; }

      // The "latest" release is rolling (re-published every build), and GitHub
      // freezes `published_at` at the release's first creation — useless for
      // detecting newer builds. The build's wall-clock timestamp is the source
      // of truth instead: it's monotonic and immune to the run-number resetting
      // (a workflow rename or repo fork restarts it at 1, which once produced a
      // build with a HIGHER number than newer builds — so a numeric compare
      // wrongly reported "up to date"). The rolling release re-uploads the APK
      // every build, so its asset `updated_at` advances each time; a 10-min
      // grace covers the gap between stamping a build and uploading its asset.
      const apkTs = apk.updated_at ? Math.floor(new Date(apk.updated_at).getTime() / 1000) : 0;
      const current = (build.ts > 0 && apkTs > 0)
        ? apkTs <= build.ts + 600
        : false;                                           // dev / unstamped → always offer

      if (current) {
        setState({ kind: "uptodate" });
      } else {
        setState({ kind: "available", url: apk.browser_download_url });
      }
    } catch (e) {
      setState({ kind: "err", text: tr("Não foi possível verificar atualizações.") });
    }
  };

  const startUpdate = async () => {
    const url = state.url;
    // Offer a safety backup before installing the update.
    const backup = await window.pautaConfirm({
      message: tr("Guardar uma cópia de segurança antes de atualizar?"),
      okLabel: tr("Cópia e atualizar"),
      cancelLabel: tr("Só atualizar"),
    });
    if (backup && store) {
      try { window.writeAutoBackup(store.serializeBackup()); } catch (e) {}
      store.exportData();
    }

    // Native: download the APK and hand it to Android's package installer —
    // no browser, installs in-place over the current app (same signing key, so
    // the user's data is preserved). Plain browser/PWA has no installer, so
    // fall back to opening the download URL there.
    if (window.AppUpdater && window.AppUpdater.isNative) {
      setState({ kind: "downloading", url, progress: null });
      try {
        const res = await window.AppUpdater.downloadAndInstall({ url });
        if (res && res.status === "needs-permission") {
          // We just opened the "install unknown apps" toggle; let the user
          // allow it and tap again.
          setState({ kind: "available", url, needsPerm: true });
        } else {
          setState({ kind: "installing" });
        }
      } catch (e) {
        setState({ kind: "available", url, dlError: true });
      }
      return;
    }

    setTimeout(() => window.open(url, "_blank"), backup ? 500 : 0);
  };

  // Show the build DATE, not the run number: dates always move forward and read
  // intuitively, whereas the run number reset once and showed an older build
  // with a bigger number.
  let buildLabel = tr("Versão de desenvolvimento.");
  if (build.ts > 0) {
    const d = new Date(build.ts * 1000);
    const p2 = (n) => String(n).padStart(2, "0");
    buildLabel = trf("Versão de {date}", { date: `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}` });
  }

  let subtitle = buildLabel;
  let status = null;
  if (state.kind === "checking") subtitle = tr("A verificar…");
  else if (state.kind === "uptodate") { subtitle = tr("Está atualizado."); status = "ok"; }
  else if (state.kind === "downloading") {
    subtitle = state.progress != null
      ? trf("A transferir atualização… {n}%", { n: state.progress })
      : tr("A transferir atualização…");
    status = "ok";
  }
  else if (state.kind === "installing") { subtitle = tr("A abrir o instalador…"); status = "ok"; }
  else if (state.kind === "available") {
    if (state.needsPerm) { subtitle = tr("Permite instalar apps desta origem e toca outra vez."); status = "err"; }
    else if (state.dlError) { subtitle = tr("Não foi possível transferir a atualização."); status = "err"; }
    else {
      subtitle = tr("Atualização disponível.");
      status = "ok";
    }
  }
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
      {(state.kind === "available" || state.kind === "downloading") && (
        <button onClick={startUpdate} className="tap"
          disabled={state.kind === "downloading"}
          style={{
            background: accentColor, color: "var(--on-dark)", border: "none",
            borderRadius: 12, padding: "12px 14px",
            cursor: state.kind === "downloading" ? "default" : "pointer",
            opacity: state.kind === "downloading" ? 0.7 : 1,
            fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}>
          {state.kind === "downloading" ? tr("A transferir…") : tr("Transferir nova versão")}
        </button>
      )}
      {state.kind === "available" && !state.needsPerm && (
        // One-time gotcha: builds from before the project settled on a fixed
        // signing key were each signed with a throwaway key, so Android blocks
        // installing a newer (consistently-signed) build over them with "package
        // conflicts with an existing package". Can't be fixed from inside the
        // app — the user has to back up, uninstall once, and reinstall.
        <span style={{
          fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 12,
          color: "var(--ink-3)", lineHeight: 1.4, padding: "2px 2px 0",
        }}>
          {tr("Se a instalação falhar com «conflito com um pacote existente»: exporta uma cópia de segurança, desinstala a app e instala de novo. Só é preciso uma vez — daí em diante as atualizações mantêm os teus dados.")}
        </span>
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

  // Enabling reminders requests notification permission through the right
  // channel (native plugin inside the app, web API in the browser/PWA) — so it
  // no longer wrongly claims "this device doesn't support notifications" on
  // phones whose WebView simply lacks the web Notification API.
  const onToggleReminders = async (next) => {
    if (next) {
      const res = await window.enableNotifications();
      if (!res.ok) {
        setMsg({ kind: "err", text: res.reason === "unsupported"
          ? tr("Este dispositivo não suporta notificações.")
          : tr("Permissão de notificações negada. Ativa-a nas definições do sistema.") });
        store.setReminderPref("enabled", false);
        return;
      }
      // Confirm it actually works with one notification right now — otherwise
      // the user has no way to tell the channel fired (reminders only nudge at
      // the set times, and only while the app is open).
      store.setReminderPref("enabled", true);
      const shown = await window.fireReminder(
        tr("Notificações ativadas"),
        tr("Vou avisar-te dos hábitos e da reflexão às horas marcadas."),
        "pauta-test"
      );
      setMsg(shown
        ? { kind: "ok", text: tr("Notificações ativadas.") }
        : { kind: "err", text: tr("Permissão de notificações negada. Ativa-a nas definições do sistema.") });
      return;
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
    reader.onload = async () => {
      const ok = await window.pautaConfirm({ message: tr("Importar este backup substitui todos os dados atuais. Continuar?"), danger: true });
      if (!ok) return;
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
          <PrefToggle label={tr("Papagaio ajudante")} sub={tr("O Pip aparece com dicas e piadas. Toca-lhe para mais.")} accentColor={accentColor}
            value={prefs.parrot !== false} onChange={v => store.setPref("parrot", v)}/>
        </DataGroup>

        <DataGroup label={tr("Foco")} icon={<Icon.Play size={13}/>}>
          <PrefToggle label={tr("Manter ecrã ligado")} sub={tr("Não deixa o telemóvel adormecer durante um bloco.")} accentColor={accentColor}
            value={prefs.keepAwake} onChange={v => store.setPref("keepAwake", v)}/>
          <PrefToggle label={tr("Som ao concluir")} sub={tr("Um sino suave ao terminar um bloco ou atingir a meta.")} accentColor={accentColor}
            value={prefs.sound} onChange={v => { store.setPref("sound", v); if (v && window.playChime) window.playChime(); }}/>
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
                <span>{tr("Plano do dia")}</span>
                <input type="time" value={prefs.reminders.plannerTime || ""}
                  onChange={e => store.setReminderPref("plannerTime", e.target.value)} style={timeInput}/>
              </label>
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
              <button
                onClick={async () => {
                  const ok = await window.fireReminder(
                    tr("Pauta · teste"),
                    tr("As notificações estão a funcionar."),
                    "pauta-test-manual"
                  );
                  setMsg(ok
                    ? { kind: "ok", text: tr("Notificação de teste enviada.") }
                    : { kind: "err", text: tr("Não foi possível enviar a notificação de teste.") });
                }}
                className="tap"
                style={{
                  border: "1px solid var(--rule)", background: "transparent",
                  borderRadius: 8, padding: "8px 12px", cursor: "pointer",
                  fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.08em",
                  textTransform: "uppercase", color: "var(--ink-2)", alignSelf: "flex-start",
                }}>
                {tr("Testar notificação")}
              </button>
            </div>
          )}
          {isNative && <NotifDiagnostics/>}
        </DataGroup>

        <DataGroup label={tr("Dados")} icon={<Icon.Database size={13}/>}>
          <AutoBackupControl store={store} accentColor={accentColor}/>
          <DataAction icon={<Icon.Download size={16}/>} accentColor={accentColor}
            title={tr("Exportar dados")}
            subtitle={tr("Transfere um ficheiro .json com tudo.")}
            onClick={onExport}/>
          <DataAction icon={<Icon.Upload size={16}/>} accentColor={accentColor}
            title={tr("Importar dados")}
            subtitle={tr("Restaura a partir de um ficheiro .json.")}
            onClick={onPickFile}/>
          <DataAction icon={<Icon.Upload size={16}/>} accentColor={accentColor}
            title={tr("Enviar para a nuvem")}
            subtitle={tr("Partilha a cópia para o Drive, Dropbox, Ficheiros…")}
            onClick={async () => {
              const res = await window.shareBackupFile(store.serializeBackup());
              if (res && res.ok && !res.shared) setMsg({ kind: "ok", text: tr("Cópia transferida.") });
            }}/>
          <input ref={fileRef} type="file" accept="application/json,.json"
            onChange={onFileChosen} style={{ display: "none" }}/>
        </DataGroup>

        {isNative && (
          <DataGroup label={tr("Aplicação")} icon={<Icon.Download size={13}/>}>
            <UpdateChecker accentColor={accentColor} store={store}/>
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
            onClick={() => window.pautaConfirm({ message: tr("Recarregar dados de exemplo? Isto apaga o que tem agora."), danger: true }).then(ok => { if (ok) store.reseed(); })}/>
          <DataAction accentColor={accentColor} danger={true}
            icon={<Icon.Trash size={16}/>}
            title={tr("Apagar tudo")}
            subtitle={tr("Remove permanentemente todos os dados.")}
            onClick={() => window.pautaConfirm({ message: tr("Apagar tudo e recomeçar? Isto não pode ser desfeito."), danger: true }).then(ok => { if (ok) store.resetAll(); })}/>
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
// surfaces the state and lets the user grant it (or open system Settings when
// Android has stopped showing the dialog after a permanent denial).
function FocusNotifControl({ accentColor }) {
  const [granted, setGranted]   = useState(null);   // null = still checking
  const [canAsk, setCanAsk]     = useState(true);   // false = permanently denied

  const refresh = async () => {
    try {
      const [permR, rationaleR] = await Promise.all([
        window.FocusActivity.checkPermission(),
        window.FocusActivity.shouldShowRationale(),
      ]);
      const g = !!(permR && permR.granted);
      setGranted(g);
      // canAsk = true only when OS will still show the dialog:
      // either not yet asked (rationale=false, perm=false, never requested)
      // or denied once (rationale=true). After permanent denial both are false.
      if (!g) setCanAsk(!!(rationaleR && rationaleR.show) || granted === null);
    } catch (_) {}
  };

  useEffect(() => {
    let alive = true;
    window.FocusActivity.checkPermission()
      .then(r => { if (alive) { setGranted(!!(r && r.granted)); setCanAsk(true); } })
      .catch(() => {});
    // Re-check when the user returns from system Settings.
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { alive = false; document.removeEventListener("visibilitychange", onVisible); };
  }, []);

  const request = async () => {
    try {
      const r = await window.FocusActivity.requestPermission();
      const g = !!(r && r.granted);
      setGranted(g);
      if (!g) {
        // Check if the OS will still show the dialog next time.
        const rat = await window.FocusActivity.shouldShowRationale();
        setCanAsk(!!(rat && rat.show));
      }
    } catch (_) {}
  };

  const openSettings = () => {
    try { window.FocusActivity.openAppSettings(); } catch (_) {}
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
      {granted === false && canAsk && (
        <button onClick={request} className="tap"
          style={{
            border: "none", borderRadius: 8, padding: "9px 12px", cursor: "pointer",
            background: accentColor, color: "#fff", fontSize: 13, fontWeight: 500,
          }}>
          {tr("Permitir notificações")}
        </button>
      )}
      {granted === false && !canAsk && (
        <button onClick={openSettings} className="tap"
          style={{
            border: "none", borderRadius: 8, padding: "9px 12px", cursor: "pointer",
            background: accentColor, color: "#fff", fontSize: 13, fontWeight: 500,
          }}>
          {tr("Abrir definições do sistema")}
        </button>
      )}
    </div>
  );
}

// Native-only on-device diagnostics (collapsed by default). Surfaces the exact
// runtime signals behind the old "this device doesn't support notifications"
// message so a failure can be SEEN and screenshotted instead of guessed at:
// whether Capacitor reports the app as native, which platform it thinks it is,
// and whether POST_NOTIFICATIONS is granted — plus a one-tap test post.
function NotifDiagnostics() {
  const [perm, setPerm] = useState(null);   // null = checking
  const [tested, setTested] = useState(null);
  useEffect(() => {
    let alive = true;
    window.FocusActivity.checkPermission()
      .then(r => { if (alive) setPerm(!!(r && r.granted)); })
      .catch(() => { if (alive) setPerm(false); });
    return () => { alive = false; };
  }, []);

  const cap = window.Capacitor;
  const isNative = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const platform = (cap && cap.getPlatform) ? cap.getPlatform() : "web";
  const build = window.PAUTA_BUILD || { ts: 0 };
  const buildStr = build.ts > 0
    ? new Date(build.ts * 1000).toISOString().slice(0, 10)
    : tr("desenvolvimento");

  const Row = ({ label, value, ok }) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontFamily: "var(--mono)", fontSize: 11 }}>
      <span style={{ color: "var(--ink-3)" }}>{label}</span>
      <span style={{
        textAlign: "right",
        color: ok == null ? "var(--ink-2)" : ok ? "var(--good)" : "var(--accent)",
      }}>{value}</span>
    </div>
  );

  return (
    <details style={{
      background: "var(--paper-2)", border: "1px solid var(--rule)",
      borderRadius: 12, padding: "10px 14px",
    }}>
      <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--ink-2)", fontWeight: 500 }}>
        {tr("Diagnóstico")}
      </summary>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
        <Row label={tr("App nativa (Capacitor)")} value={isNative ? tr("sim") : tr("não")} ok={isNative}/>
        <Row label={tr("Plataforma")} value={platform} ok={platform === "android"}/>
        <Row label={tr("Permissão de notificações")}
          value={perm == null ? "…" : perm ? tr("concedida") : tr("negada")} ok={perm}/>
        <Row label={tr("Versão")} value={buildStr}/>
        {tested != null && (
          <Row label={tr("Teste")} value={tested ? tr("mostrada") : tr("falhou")} ok={tested}/>
        )}
        <button
          onClick={async () => {
            const ok = await window.fireReminder(
              tr("Pauta · teste"), tr("As notificações estão a funcionar."), "pauta-test-diag");
            setTested(!!ok);
          }}
          className="tap"
          style={{
            marginTop: 4, alignSelf: "flex-start", border: "1px solid var(--rule)",
            background: "transparent", borderRadius: 8, padding: "7px 11px", cursor: "pointer",
            fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "var(--ink-2)",
          }}>
          {tr("Enviar teste")}
        </button>
      </div>
    </details>
  );
}

// Auto-backup: cadence picker + status + restore / download of the latest
// rolling snapshot (see useAutoBackup / readAutoBackup in store + extras).
function AutoBackupControl({ store, accentColor }) {
  const freq = store.state.prefs.autoBackup || "off";
  const [snap, setSnap] = useState(() => window.readAutoBackup());
  const [note, setNote] = useState(null);
  useEffect(() => { setSnap(window.readAutoBackup()); }, [freq]);

  const relative = (ts) => {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return tr("agora mesmo");
    const m = Math.floor(s / 60); if (m < 60) return trf("há {n} min", { n: m });
    const h = Math.floor(m / 60); if (h < 24) return trf("há {n} h", { n: h });
    const d = Math.floor(h / 24); return trf("há {n} dias", { n: d });
  };

  const restore = async () => {
    const s = window.readAutoBackup();
    if (!s || !s.backup) return;
    const ok = await window.pautaConfirm({ message: tr("Restaurar a última cópia automática substitui todos os dados atuais. Continuar?"), danger: true });
    if (!ok) return;
    const res = store.importData(JSON.stringify(s.backup));
    setNote(res.ok ? tr("Cópia restaurada.") : (res.error || tr("Falhou.")));
  };
  const download = () => {
    const s = window.readAutoBackup();
    if (!s || !s.backup) return;
    const blob = new Blob([JSON.stringify(s.backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "pauta-autobackup.json";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const opts = [
    { value: "off", label: tr("Nunca") },
    { value: "30m", label: "30m" },
    { value: "hourly", label: "1h" },
    { value: "daily", label: tr("Dia") },
    { value: "weekly", label: tr("Semana") },
  ];

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 10,
      padding: "12px 14px", background: "var(--paper-2)",
      border: "1px solid var(--rule)", borderRadius: 12,
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{tr("Cópia automática")}</div>
        <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 2, lineHeight: 1.3 }}>
          {tr("Guarda uma cópia local que pode restaurar com um toque.")}
        </div>
      </div>
      <Segmented value={freq} accentColor={accentColor}
        onChange={v => store.setPref("autoBackup", v)} options={opts}/>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.02em" }}>
        {snap ? trf("Última cópia: {t}", { t: relative(snap.ts) }) : tr("Ainda sem cópia.")}
      </div>
      {snap && (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={restore} className="tap" style={miniBtn(accentColor, true)}>{tr("Restaurar")}</button>
          <button onClick={download} className="tap" style={miniBtn(accentColor, false)}>{tr("Transferir")}</button>
        </div>
      )}
      {note && (
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--good)" }}>{note}</div>
      )}
    </div>
  );
}
function miniBtn(accent, filled) {
  return {
    flex: 1, borderRadius: 8, padding: "9px 12px", cursor: "pointer", fontSize: 13, fontWeight: 500,
    border: filled ? "none" : "1px solid var(--rule)",
    background: filled ? accent : "transparent",
    color: filled ? "#fff" : "var(--ink-2)",
  };
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
  const [pendingSwitch, setPendingSwitch] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [tierGuideOpen, setTierGuideOpen] = useState(false);

  const prefs = store.state.prefs;

  // Mirror language to the global read by tr()/trf() synchronously, so the whole
  // tree re-renders in the chosen language. Persist for the next cold start.
  window.PAUTA_LANG = prefs.lang === "en" ? "en" : "pt";
  useEffect(() => {
    try { localStorage.setItem("pauta.lang", prefs.lang); } catch (e) {}
    // Keep the document language in sync so screen readers use the right voice.
    document.documentElement.lang = prefs.lang === "en" ? "en" : "pt-PT";
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
  // Native Android focus timer notification / Xiaomi island. The "Trocar"
  // (switch) notification button jumps to the Pauta tab and opens the switch
  // sheet there (TabPauta consumes pendingSwitch, like pendingIntention).
  useFocusActivity(store, accentColor, () => { setTab("pauta"); setPendingSwitch(true); });
  // Rolling local backup snapshot on the user's chosen cadence.
  useAutoBackup(store);
  // Keep the screen awake while a focus block is running (if enabled).
  useWakeLock(!!store.activeBlock && prefs.keepAwake);

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
              clearPending={() => setPendingIntention(null)}
              pendingSwitch={pendingSwitch}
              clearPendingSwitch={() => setPendingSwitch(false)}/>
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

      {prefs.onboardingSeen && <ParrotCompanion store={store} accentColor={accentColor} tab={tab}/>}
      {prefs.onboardingSeen && <NotifPrompt store={store} accentColor={accentColor}/>}
      <ConfirmHost/>

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

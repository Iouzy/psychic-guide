// Native focus-session surface — Android APK only.
//
// This app has no module bundler (Babel runs in the browser), so Capacitor
// plugins are reached through the global bridge the native WebView injects:
//   window.Capacitor.Plugins.<Name>
// On the plain web / PWA build that bridge is absent, so every path here is a
// no-op — the hook is safe to call unconditionally from <App>.
//
// While a Pauta session is active (or paused) it shows a focus notification
// with pause / resume / conclude actions that drive the store. Two backends,
// preferred in order:
//   1. FocusActivity   — our foreground-service plugin: a live ticking
//      chronometer that survives the app closing and is surfaced by OEM
//      "islands" (e.g. Xiaomi HyperOS).
//   2. LocalNotifications — official plugin fallback: an ongoing notification
//      with the same action buttons but no live timer.

const FOCUS_NOTIF_ID = 4201;
const ACT_ACTIVE = "PAUTA_ACTIVE";   // buttons while running: pause · conclude
const ACT_PAUSED = "PAUTA_PAUSED";   // buttons while paused:  resume · conclude

function getCapacitorPlugins() {
  const C = (typeof window !== "undefined") && window.Capacitor;
  if (!C || !(C.isNativePlatform && C.isNativePlatform())) return null;
  return C.Plugins || null;
}

function useNativeFocusNotification(store) {
  const plugins = getCapacitorPlugins();
  const FA = plugins && plugins.FocusActivity;          // preferred: foreground service
  const LNall = plugins && plugins.LocalNotifications;  // official plugin (always a dep)
  const LN = !FA ? LNall : null;                        // used as the surface only when FA absent
  const enabled = !!(FA || LN);

  const blocks = store.state.blocks;
  const activeBlock = store.activeBlock;
  const dayK = dayKeyOf(Date.now());

  // The block the surface represents: the running one, else the most recently
  // paused one from today (so it can still be resumed/concluded from outside).
  const focus = activeBlock || (() => {
    const paused = blocks
      .filter(b => b.status === "paused" && dayKeyOf(b.createdAt) === dayK)
      .sort((a, b) => b.sessions[b.sessions.length - 1].startedAt - a.sessions[a.sessions.length - 1].startedAt);
    return paused[0] || null;
  })();

  // Refs let the (once-registered) action listener read live values.
  const focusRef = useRef(null); focusRef.current = focus;
  const storeRef = useRef(store); storeRef.current = store;

  const applyAction = (kind) => {
    const f = focusRef.current, st = storeRef.current;
    if (kind === "pause") st.pauseActive("");
    else if (kind === "resume" && f) st.resumeBlock(f.id);
    else if (kind === "conclude") {
      if (st.activeBlock) st.concludeActive("");
      else if (f) st.concludeBlock(f.id, "");
    }
  };

  // Register action handling once per backend.
  useEffect(() => {
    if (!enabled) return;
    let sub;
    (async () => {
      if (FA) {
        // The foreground notification still needs POST_NOTIFICATIONS (Android 13+);
        // reuse the official plugin's prompt since it's app-wide.
        try { if (LNall) await LNall.requestPermissions(); } catch (e) {}
        try { sub = await FA.addListener("action", (ev) => applyAction(ev && ev.kind)); } catch (e) {}
        return;
      }
      // LocalNotifications path: permissions + action types + listener.
      try { await LN.requestPermissions(); } catch (e) {}
      try {
        await LN.registerActionTypes({ types: [
          { id: ACT_ACTIVE, actions: [{ id: "pause", title: tr("Pausar") }, { id: "conclude", title: tr("Concluir") }] },
          { id: ACT_PAUSED, actions: [{ id: "resume", title: tr("Retomar") }, { id: "conclude", title: tr("Concluir") }] },
        ] });
      } catch (e) {}
      try {
        sub = await LN.addListener("localNotificationActionPerformed", (ev) => applyAction(ev && ev.actionId));
      } catch (e) {}
    })();
    return () => { if (sub && sub.remove) sub.remove(); };
  }, [enabled, !!FA]);

  // Show / refresh / clear the surface whenever the focus block or its state changes.
  const sig = focus ? focus.id + ":" + focus.status + ":" + focus.sessions.length : "none";
  useEffect(() => {
    if (!enabled) return;

    if (!focus) {
      if (FA) FA.stop().catch(() => {});
      else LN.cancel({ notifications: [{ id: FOCUS_NOTIF_ID }] }).catch(() => {});
      return;
    }

    const paused = focus.status === "paused";
    const total = focus.sessions.reduce((a, s) => a + ((s.endedAt || Date.now()) - s.startedAt), 0);
    const seg = focus.sessions[focus.sessions.length - 1];
    const body = paused
      ? trf("Em pausa · {d} acumulado", { d: fmtDuration(total) })
      : trf("Em curso · desde {t}", { t: fmtClock(seg.startedAt) });

    if (FA) {
      // Chronometer base = now − accumulated active time, so it shows the real
      // focused total and keeps ticking (ignores paused gaps).
      FA.start({ title: focus.title || tr("Pauta"), body, paused, startedAt: Date.now() - total }).catch(() => {});
    } else {
      LN.schedule({ notifications: [{
        id: FOCUS_NOTIF_ID,
        title: focus.title || tr("Pauta"),
        body,
        actionTypeId: paused ? ACT_PAUSED : ACT_ACTIVE,
        ongoing: !paused,
        autoCancel: false,
      }] }).catch(() => {});
    }
  }, [enabled, !!FA, sig]);
}

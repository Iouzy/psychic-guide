// Native focus-session notification — Android APK only.
//
// This app has no module bundler (Babel runs in the browser), so Capacitor
// plugins are reached through the global bridge the native WebView injects:
//   window.Capacitor.Plugins.LocalNotifications
// On the plain web / PWA build that bridge is absent, so every path here is a
// no-op — the hook is safe to call unconditionally from <App>.
//
// While a Pauta session is active (or paused) it posts an ongoing notification
// carrying pause / resume / conclude action buttons that call back into the
// store, so the session can be driven from outside the app's UI.

const FOCUS_NOTIF_ID = 4201;
const ACT_ACTIVE = "PAUTA_ACTIVE";   // buttons while running: pause · conclude
const ACT_PAUSED = "PAUTA_PAUSED";   // buttons while paused:  resume · conclude

function getLocalNotifications() {
  const C = (typeof window !== "undefined") && window.Capacitor;
  if (!C || !(C.isNativePlatform && C.isNativePlatform())) return null;
  return (C.Plugins && C.Plugins.LocalNotifications) || null;
}

function useNativeFocusNotification(store) {
  const LN = getLocalNotifications();
  const blocks = store.state.blocks;
  const activeBlock = store.activeBlock;
  const dayK = dayKeyOf(Date.now());

  // The block the notification represents: the running one, else the most
  // recently paused one from today (so it can still be resumed/concluded).
  const focus = activeBlock || (() => {
    const paused = blocks
      .filter(b => b.status === "paused" && dayKeyOf(b.createdAt) === dayK)
      .sort((a, b) => b.sessions[b.sessions.length - 1].startedAt - a.sessions[a.sessions.length - 1].startedAt);
    return paused[0] || null;
  })();

  // Refs let the (once-registered) action listener read live values.
  const focusRef = useRef(null); focusRef.current = focus;
  const storeRef = useRef(store); storeRef.current = store;

  // Register action types + the action listener once.
  useEffect(() => {
    if (!LN) return;
    let sub;
    (async () => {
      try { await LN.requestPermissions(); } catch (e) {}
      try {
        await LN.registerActionTypes({ types: [
          { id: ACT_ACTIVE, actions: [{ id: "pause", title: tr("Pausar") }, { id: "conclude", title: tr("Concluir") }] },
          { id: ACT_PAUSED, actions: [{ id: "resume", title: tr("Retomar") }, { id: "conclude", title: tr("Concluir") }] },
        ] });
      } catch (e) {}
      try {
        sub = await LN.addListener("localNotificationActionPerformed", (ev) => {
          const f = focusRef.current, st = storeRef.current, aid = ev && ev.actionId;
          if (aid === "pause") st.pauseActive("");
          else if (aid === "resume" && f) st.resumeBlock(f.id);
          else if (aid === "conclude") {
            if (st.activeBlock) st.concludeActive("");
            else if (f) st.concludeBlock(f.id, "");
          }
        });
      } catch (e) {}
    })();
    return () => { if (sub && sub.remove) sub.remove(); };
  }, [!!LN]);

  // Show / refresh / cancel the notification whenever the focus block or its
  // state changes. (local-notifications has no live chronometer — the body
  // shows the start time / accumulated total; a ticking timer is the job of the
  // foreground-service step.)
  const sig = focus ? focus.id + ":" + focus.status + ":" + focus.sessions.length : "none";
  useEffect(() => {
    if (!LN) return;
    if (!focus) { LN.cancel({ notifications: [{ id: FOCUS_NOTIF_ID }] }).catch(() => {}); return; }
    const paused = focus.status === "paused";
    const total = focus.sessions.reduce((a, s) => a + ((s.endedAt || Date.now()) - s.startedAt), 0);
    const seg = focus.sessions[focus.sessions.length - 1];
    const body = paused
      ? trf("Em pausa · {d} acumulado", { d: fmtDuration(total) })
      : trf("Em curso · desde {t}", { t: fmtClock(seg.startedAt) });
    LN.schedule({ notifications: [{
      id: FOCUS_NOTIF_ID,
      title: focus.title || tr("Pauta"),
      body,
      actionTypeId: paused ? ACT_PAUSED : ACT_ACTIVE,
      ongoing: !paused,    // a running session is sticky; a paused one is dismissable
      autoCancel: false,
    }] }).catch(() => {});
  }, [!!LN, sig]);
}

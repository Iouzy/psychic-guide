// Pauta — extras: onboarding, insights (revisão semanal, melhor hora,
// correlação, calendário), guia das marés, metas trimestrais, lembretes,
// e pequenos utilitários (háptico). Carregado antes de app.jsx.

// ─── Haptic feedback ────────────────────────────────────────
// Respeita prefs.haptics (espelhada em window.PAUTA_HAPTICS pelo App).
function haptic(ms = 10) {
  try { if (window.PAUTA_HAPTICS && navigator.vibrate) navigator.vibrate(ms); } catch (e) {}
}

// ─── Onboarding (primeira abertura) ─────────────────────────
// Tour com holofote: o overlay conduz pelas três tabs reais e, em cada uma,
// escurece tudo menos o controlo verdadeiro (o botão de adicionar intenção,
// começar um bloco, criar uma maré). O utilizador faz a ação a sério na app
// — o que cria fica guardado — e o passo conclui-se sozinho quando o store
// regista a mudança. No fim pode optar por manter o que criou ou começar do
// zero (isto também limpa a seed de demonstração).

// Cor do escurecimento. Mais opaco que o ghost antigo: queremos que o foco
// caia mesmo no buraco e não na app por trás.
const ONBOARDING_SCRIM = "rgba(8,6,4,0.62)";

// Cantos ligeiramente arredondados à volta do buraco do holofote, mais largos
// que o controlo para o anel respirar. Os 4 rects ficam justos a estas margens.
const SPOTLIGHT_PADDING = 6;
const SPOTLIGHT_RADIUS = 14;

function OnboardingOverlay({ onDone, accentColor, onTab, store }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [leaving, setLeaving] = useState(false);
  // rect do controlo destacado, em coordenadas locais do overlay.
  const [rect, setRect] = useState(null);
  // engaged: o utilizador tocou no controlo. O escurecimento desaparece quase
  // todo para libertar a interação (sheet centrado, formulário inline, etc.).
  const [engaged, setEngaged] = useState(false);
  const overlayRef = useRef(null);
  // baseline guardada à entrada de cada passo, para detetar "fez a ação agora"
  // em vez de "já havia coisas no seed".
  const baselineRef = useRef({ intentions: 0, blocks: 0, habits: 0, activeId: null });

  const steps = [
    {
      kind: "intro", tag: tr("bem-vindo"),
      title: <>{tr("Esta é a sua")} <em style={{ color: accentColor }}>{tr("pauta")}</em>.</>,
      body: tr("Um lugar calmo para o que importa. Vamos conhecer as três tabs em três toques — na app a sério, sem exemplos."),
    },
    {
      kind: "tour", tab: "hoje", selector: '[data-tour="add-intention"]',
      tag: tr("hoje"),
      title: tr("Comece pelo que importa."),
      body: tr("Toque para juntar uma intenção ao seu dia."),
      detect: (s, b) => s.today.intentions.length > b.intentions,
    },
    {
      kind: "tour", tab: "pauta", selector: '[data-tour="start-block"]',
      tag: tr("foco"),
      title: tr("Trabalhe em blocos."),
      body: tr("Toque para começar um bloco de foco. O tempo conta-se por si."),
      detect: (s, b) => s.activeId !== null || s.blocks.length > b.blocks,
    },
    {
      kind: "tour", tab: "mares", selector: '[data-tour="add-habit"]',
      tag: tr("marés"),
      title: tr("Cultive hábitos."),
      body: tr("Toque para criar a sua primeira maré."),
      detect: (s, b) => s.habits.length > b.habits,
    },
    {
      kind: "outro", tag: tr("pronto"),
      title: <>{tr("Tudo")} <em style={{ color: accentColor }}>{tr("seu")}</em>.</>,
      body: tr("Quer manter o que criou agora ou começar com uma pauta em branco?"),
    },
  ];
  const s = steps[stepIdx];
  const last = stepIdx === steps.length - 1;
  const isTour = s.kind === "tour";

  // Conduz a tab real por trás do overlay e captura a baseline do store ao
  // entrar num passo de tour, para distinguir o que o utilizador faz agora do
  // que já lá estava (seed). Também reseta `engaged` para que o escurecimento
  // volte a aparecer no novo controlo.
  useEffect(() => {
    if (s.tab && onTab) onTab(s.tab);
    if (isTour) {
      const cur = store.state;
      baselineRef.current = {
        intentions: cur.today.intentions.length,
        blocks: cur.blocks.length,
        habits: cur.habits.length,
        activeId: cur.activeId,
      };
      setEngaged(false);
      setRect(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx]);

  // Conclusão: avalia-se em cada render. Como o overlay recebe um `store` novo
  // sempre que o estado muda (App re-renderiza), este boolean atualiza-se
  // automaticamente sem precisar de subscrição.
  const completed = isTour && s.detect && s.detect(store.state, baselineRef.current);

  // Mede o controlo destacado num loop de requestAnimationFrame — o conteúdo
  // pode estar a fazer scroll/animar e o holofote tem de seguir. Só atualiza
  // o state se algum dos números mudou (evita re-renders inúteis).
  useEffect(() => {
    if (!isTour) { setRect(null); return; }
    let raf;
    const tick = () => {
      const el = document.querySelector(s.selector);
      const container = overlayRef.current;
      if (el && container) {
        const r = el.getBoundingClientRect();
        const cr = container.getBoundingClientRect();
        const next = {
          x: Math.round(r.left - cr.left),
          y: Math.round(r.top - cr.top),
          w: Math.round(r.width),
          h: Math.round(r.height),
        };
        setRect(prev => {
          if (prev && prev.x === next.x && prev.y === next.y && prev.w === next.w && prev.h === next.h) return prev;
          return next;
        });
      } else {
        setRect(prev => prev == null ? prev : null);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stepIdx, isTour, s.selector]);

  // Aproxima o controlo do centro ecrã ao entrar no passo.
  useEffect(() => {
    if (!isTour) return;
    const t = setTimeout(() => {
      const el = document.querySelector(s.selector);
      if (el && el.scrollIntoView) el.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 80);
    return () => clearTimeout(t);
  }, [stepIdx, isTour, s.selector]);

  // Quando o utilizador toca no controlo destacado, ativamos `engaged` para
  // libertar toda a interação (o sheet do bloco está em zIndex 100, e o
  // formulário inline da maré fica no sítio do botão). Usamos captura para
  // apanhar o toque antes de qualquer outro handler — mas NÃO chamamos
  // stopPropagation: o clique tem mesmo de chegar ao botão real.
  useEffect(() => {
    if (!isTour) return;
    const onDown = (e) => {
      const el = document.querySelector(s.selector);
      if (el && e.target && el.contains(e.target)) setEngaged(true);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [stepIdx, isTour, s.selector]);

  const goNext = () => { haptic(8); setStepIdx(i => i + 1); };
  const finish = (reset) => {
    setLeaving(true);
    setTimeout(() => onDone && onDone(reset), 300);
  };

  // Durante o tour ficamos abaixo do Sheet (zIndex 100). No intro/outro
  // subimos para 400 para cobrir os tabs e os sheets eventualmente abertos.
  const overlayZ = isTour ? 90 : 400;

  // Card de explicação (tag + título + corpo). É a "lapela" que aparece
  // perto do buraco do holofote — escolhe-se em cima ou em baixo do controlo
  // consoante haja mais espaço. Não recebe pointer events para não bloquear o
  // controlo destacado mesmo que se sobreponha por engano.
  const renderTourCard = () => {
    if (!isTour || !rect) return null;
    const containerH = overlayRef.current ? overlayRef.current.getBoundingClientRect().height : 600;
    const above = rect.y > containerH - (rect.y + rect.h);
    const cardStyle = above
      ? { bottom: containerH - rect.y + 18 }
      : { top: rect.y + rect.h + 18 };
    return (
      <div style={{
        position: "absolute", left: 20, right: 20, ...cardStyle,
        background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: 14,
        padding: "14px 16px", boxShadow: "0 14px 38px rgba(0,0,0,0.32)",
        opacity: engaged ? 0 : 1, transition: "opacity 0.18s ease",
        pointerEvents: "none",
      }}>
        <div style={{
          fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.2em",
          textTransform: "uppercase", color: accentColor, marginBottom: 6,
        }}>{s.tag}</div>
        <div style={{
          fontFamily: "var(--serif)", fontSize: 21, lineHeight: 1.15,
          color: "var(--ink)", fontWeight: 400, letterSpacing: "-0.01em",
        }}>{s.title}</div>
        <div style={{
          fontFamily: "var(--serif)", fontSize: 14, lineHeight: 1.45,
          color: "var(--ink-2)", marginTop: 8,
        }}>{s.body}</div>
      </div>
    );
  };

  // O escurecimento é desenhado com quatro rectângulos à volta do buraco. Cada
  // um vai a 0 de pointer-events quando `engaged` é true: o utilizador está
  // dentro do sheet/formulário e o cenário só serve para mostrar o caminho.
  const renderScrim = () => {
    if (!isTour) return null;
    const dim = engaged ? 0.12 : 1;
    const pe = engaged ? "none" : "auto";
    const base = {
      position: "absolute", background: ONBOARDING_SCRIM, pointerEvents: pe,
      opacity: dim, transition: "opacity 0.2s ease",
    };
    if (!rect) {
      // Sem alvo ainda: cobre tudo (o passo acabou de começar, evita ver a app
      // a piscar antes do botão aparecer).
      return <div style={{ ...base, inset: 0 }}/>;
    }
    return (
      <>
        <div style={{ ...base, left: 0, top: 0, right: 0, height: Math.max(0, rect.y - SPOTLIGHT_PADDING) }}/>
        <div style={{ ...base, left: 0, top: rect.y + rect.h + SPOTLIGHT_PADDING, right: 0, bottom: 0 }}/>
        <div style={{ ...base, left: 0, top: rect.y - SPOTLIGHT_PADDING, width: Math.max(0, rect.x - SPOTLIGHT_PADDING), height: rect.h + 2 * SPOTLIGHT_PADDING }}/>
        <div style={{ ...base, left: rect.x + rect.w + SPOTLIGHT_PADDING, top: rect.y - SPOTLIGHT_PADDING, right: 0, height: rect.h + 2 * SPOTLIGHT_PADDING }}/>
        {/* Anel à volta do buraco (não-interativo, não bloqueia toques) */}
        <div style={{
          position: "absolute",
          left: rect.x - SPOTLIGHT_PADDING, top: rect.y - SPOTLIGHT_PADDING,
          width: rect.w + 2 * SPOTLIGHT_PADDING, height: rect.h + 2 * SPOTLIGHT_PADDING,
          borderRadius: SPOTLIGHT_RADIUS,
          boxShadow: `0 0 0 2px ${accentColor}, 0 0 0 6px ${accentColor}33`,
          pointerEvents: "none",
          opacity: engaged ? 0 : 1,
          transition: "opacity 0.2s ease",
        }}/>
      </>
    );
  };

  // Seta à direita, centrada verticalmente, que aparece quando o passo está
  // concluído. Avança para o próximo passo da lista.
  const renderArrow = () => {
    if (!isTour || !completed) return null;
    return (
      <button onClick={goNext} className="tap" style={{
        position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
        width: 56, height: 56, borderRadius: "50%", border: "none",
        background: accentColor, color: "var(--on-dark)", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 10px 24px rgba(0,0,0,0.38)",
        animation: "fadeIn 0.3s ease",
        // O container-pai tem pointerEvents:none durante o tour (para o buraco
        // ficar transparente). Os filhos que precisam de receber cliques têm de
        // repor explicitamente auto.
        pointerEvents: "auto",
        zIndex: 6,
      }} aria-label={tr("Próximo")}>
        <Icon.Chevron size={22}/>
      </button>
    );
  };

  // Ecrã de boas-vindas e ecrã final partilham este layout cheio (papel sólido).
  const renderFullScreen = () => (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 32px" }}>
      <div style={{
        fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.2em",
        textTransform: "uppercase", color: accentColor, marginBottom: 14,
      }}>{s.tag}</div>
      <h1 style={{
        fontFamily: "var(--serif)", fontSize: 40, lineHeight: 1.05,
        margin: 0, fontWeight: 400, letterSpacing: "-0.015em", color: "var(--ink)",
      }}>{s.title}</h1>
      <p style={{
        fontFamily: "var(--serif)", fontSize: 17, lineHeight: 1.5,
        color: "var(--ink-2)", marginTop: 18, maxWidth: 360,
      }}>{s.body}</p>
    </div>
  );

  // Footer comum: pontinhos de progresso + ações.
  // - Intro: botão "Começar" (e ainda "saltar" do lado, como hoje).
  // - Outro: duas escolhas — "Manter tudo" / "Começar do zero".
  // - Tour: barra invisível (footer está vazio; a seta vive sobre o ecrã).
  const renderFooter = () => (
    <div style={{ padding: "0 32px 40px", flexShrink: 0 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            height: 3, flex: 1, borderRadius: 2,
            background: i <= stepIdx ? accentColor : (isTour ? "rgba(255,255,255,0.35)" : "var(--rule)"),
            transition: "background 0.2s",
          }}/>
        ))}
      </div>
      {s.kind === "intro" && (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={() => finish(false)} className="tap" style={{
            background: "transparent", border: "none", padding: "12px 0",
            fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "var(--ink-3)", cursor: "pointer",
          }}>{tr("saltar")}</button>
          <Button onClick={goNext} accentColor={accentColor} style={{ flex: 1 }}>
            {tr("Começar")}
          </Button>
        </div>
      )}
      {s.kind === "outro" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Button onClick={() => finish(false)} accentColor={accentColor}>
            {tr("Manter tudo")}
          </Button>
          <button onClick={() => finish(true)} className="tap" style={{
            background: "transparent", border: "1px solid var(--rule)",
            borderRadius: 10, padding: "12px 14px", cursor: "pointer",
            fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "var(--ink-2)",
          }}>{tr("Começar do zero")}</button>
        </div>
      )}
    </div>
  );

  return (
    <div ref={overlayRef} data-noswipe="true" style={{
      position: "absolute", inset: 0, zIndex: overlayZ,
      display: "flex", flexDirection: "column",
      // Intro/outro: papel sólido (ecrã cheio). Tour: transparente — quem dá
      // cor são os 4 rects do escurecimento, que escapam ao buraco.
      background: isTour ? "transparent" : "var(--paper)",
      // Durante o tour o container raiz NUNCA captura cliques — os quatro
      // rects do scrim tratam disso nas zonas escuras, e o buraco fica
      // literalmente transparente às interações. Sem isto o próprio <div>
      // bloqueia os toques no controlo destacado mesmo que não haja nenhum
      // rect por cima dele.
      pointerEvents: isTour ? "none" : "auto",
      animation: leaving ? "fadeOut 0.3s ease forwards" : "fadeIn 0.3s ease",
    }}>
      {isTour ? (
        <>
          {renderScrim()}
          {renderTourCard()}
          {renderArrow()}
        </>
      ) : (
        renderFullScreen()
      )}

      {!isTour && renderFooter()}
    </div>
  );
}

// ─── Guia das marés (tooltip/explicação dos tiers) ──────────
function TierGuideSheet({ open, onClose, accentColor }) {
  if (!open) return null;
  return (
    <Sheet open={open} onClose={onClose} title={tr("Como funcionam as marés")}>
      <div style={{ padding: "8px 24px 28px" }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: 20, lineHeight: 1.3, color: "var(--ink)", marginBottom: 6 }}>
          {tr("Cada hábito tem uma maré.")}
        </div>
        <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14, color: "var(--ink-3)", marginBottom: 20, lineHeight: 1.45 }}>
          {tr("Quanto mais dias seguidos, mais sobe. Um respiro honesto não a quebra — só um dia falhado é que faz a maré recuar.")}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {TIDE_TIERS.slice().reverse().map((t, i, arr) => (
            <div key={t.name} style={{
              display: "flex", alignItems: "baseline", gap: 12,
              padding: "11px 0",
              borderBottom: i < arr.length - 1 ? "1px solid var(--rule)" : "none",
            }}>
              <div style={{ width: 52, flexShrink: 0, fontFamily: "var(--mono)", fontSize: 11, color: accentColor }}>
                {trf("{min}+ d", { min: t.min })}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: 17, color: "var(--ink)" }}>{tr(t.name)}</div>
                <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink-3)", marginTop: 1 }}>{tr(t.subtitle)}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: 18, padding: "12px 14px", background: "var(--paper-2)",
          border: "1px solid var(--rule)", borderRadius: 10,
          fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13,
          color: "var(--ink-2)", lineHeight: 1.5,
        }}>
          {tr("À medida que acumula dias feitos em todos os hábitos, sobe também de posto — de Aprendiz a Almirante. Encontra-o em \"Marés Passadas\".")}
        </div>
      </div>
    </Sheet>
  );
}

// ─── Melhor hora do dia ─────────────────────────────────────
function BestHourChart({ blocks, accentColor }) {
  const { hours, total, peak } = useMemo(() => bestHourStats(blocks), [blocks]);
  if (total <= 0) {
    return (
      <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14, color: "var(--ink-3)", padding: "8px 0" }}>
        {tr("Ainda sem blocos suficientes para encontrar a sua melhor hora.")}
      </div>
    );
  }
  const max = Math.max(...hours);
  // Compact view: 6h–24h range (skip the dead early hours unless used).
  const startH = Math.min(6, hours.findIndex(x => x > 0) < 0 ? 6 : hours.findIndex(x => x > 0));
  const cells = [];
  for (let h = startH; h < 24; h++) cells.push(h);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: 22, color: accentColor }}>
          {pad(peak)}:00–{pad((peak + 1) % 24)}:00
        </div>
        <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink-3)" }}>
          {tr("a sua hora mais focada")}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 70 }}>
        {cells.map(h => {
          const v = hours[h];
          const ht = max > 0 ? Math.max(v > 0 ? 3 : 0, (v / max) * 64) : 0;
          return (
            <div key={h} title={pad(h) + ":00 · " + fmtDuration(v)}
              style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "stretch", height: "100%" }}>
              <div style={{
                height: ht, borderRadius: "2px 2px 0 0",
                background: h === peak ? accentColor : "var(--ink)",
                opacity: h === peak ? 1 : 0.5,
              }}/>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
        {cells.map(h => (
          <div key={h} style={{
            flex: 1, textAlign: "center", fontFamily: "var(--mono)", fontSize: 8,
            color: h === peak ? accentColor : "var(--ink-4)",
          }}>{(h % 6 === 0 || h === peak) ? pad(h) : ""}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Correlação hábitos ↔ foco ──────────────────────────────
function CorrelationList({ habits, blocks, accentColor }) {
  const rows = useMemo(() => habitFocusCorrelation(habits, blocks, 30), [habits, blocks]);
  if (rows.length === 0) {
    return (
      <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14, color: "var(--ink-3)", padding: "8px 0", lineHeight: 1.5 }}>
        {tr("Sem padrões suficientes ainda. Continue a registar hábitos e blocos — em poucas semanas aparecem aqui ligações.")}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.slice(0, 4).map(r => {
        const up = r.deltaPct >= 0;
        return (
          <div key={r.id} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0, fontFamily: "var(--serif)", fontSize: 15, color: "var(--ink)", lineHeight: 1.35 }}>
              {tr("Nos dias com")} <span style={{ fontStyle: "italic" }}>{r.name}</span>{tr(", foca")}{" "}
              <span style={{ color: up ? accentColor : "var(--ink-2)", fontWeight: 500 }}>
                {up ? "+" : ""}{r.deltaPct}%
              </span>.
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-3)", flexShrink: 0, textAlign: "right" }}>
              {fmtDuration(r.doneAvg)}<br/>vs {fmtDuration(r.missAvg)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Calendário do Pauta (foco por dia, mês) ────────────────
function FocusCalendar({ blocks, accentColor }) {
  const now = new Date();
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const todayKey = dayKeyOf(Date.now());

  const { cells, maxMs, totalMs, activeDays } = useMemo(() => {
    const nd = daysInMonth(view.y, view.m);
    const firstDow = new Date(view.y, view.m, 1).getDay(); // 0=dom
    const arr = [];
    for (let i = 0; i < firstDow; i++) arr.push(null);
    let mx = 0, tot = 0, act = 0;
    for (let d = 1; d <= nd; d++) {
      const key = dayKeyFromYMD(view.y, view.m, d);
      const ms = dailyFocusMs(blocks, key);
      if (ms > mx) mx = ms;
      tot += ms; if (ms > 0) act++;
      arr.push({ d, key, ms, isToday: key === todayKey, future: key > todayKey });
    }
    return { cells: arr, maxMs: mx, totalMs: tot, activeDays: act };
  }, [blocks, view, todayKey]);

  const shift = (n) => setView(v => {
    let m = v.m + n, y = v.y;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    return { y, m };
  });
  const level = (ms) => {
    if (!ms) return 0;
    if (maxMs <= 0) return 1;
    const r = ms / maxMs;
    return r > 0.66 ? 4 : r > 0.33 ? 3 : 2;
  };
  const bgFor = (lv) => lv === 0 ? "transparent"
    : `color-mix(in srgb, ${accentColor} ${[0,25,45,70,100][lv]}%, var(--paper))`;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button onClick={() => shift(-1)} className="tap" style={navBtn}>‹</button>
        <div style={{ fontFamily: "var(--serif)", fontSize: 17, color: "var(--ink)" }}>
          {fmtMonthLong(view.y, view.m)} <span style={{ color: "var(--ink-3)", fontSize: 13 }}>'{String(view.y).slice(2)}</span>
        </div>
        <button onClick={() => shift(1)} className="tap" style={navBtn}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {tr("d,s,t,q,q,s,s").split(",").map((l, i) => (
          <div key={i} style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: 8, color: "var(--ink-4)", textTransform: "uppercase" }}>{l}</div>
        ))}
        {cells.map((c, i) => {
          if (!c) return <div key={"e"+i}/>;
          const lv = level(c.ms);
          return (
            <div key={c.key} title={fmtDateShort(tsFromDayKey(c.key)) + " · " + fmtDuration(c.ms)}
              style={{
                aspectRatio: "1", borderRadius: 6,
                background: bgFor(lv),
                border: c.isToday ? `1.5px solid ${accentColor}` : (lv === 0 ? "1px solid var(--rule)" : "none"),
                opacity: c.future ? 0.4 : 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--mono)", fontSize: 10,
                color: lv >= 3 ? "var(--on-dark)" : "var(--ink-3)",
              }}>{c.d}</div>
          );
        })}
      </div>
      <div style={{ marginTop: 10, fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)", textAlign: "center", letterSpacing: "0.04em" }}>
        {trf("{focus} em foco · {days} {label}", { focus: fmtDuration(totalMs), days: activeDays, label: activeDays === 1 ? tr("dia activo") : tr("dias activos") })}
      </div>
    </div>
  );
}
const navBtn = {
  width: 30, height: 30, borderRadius: 8, border: "1px solid var(--rule)",
  background: "transparent", color: "var(--ink-2)", cursor: "pointer",
  fontSize: 18, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center",
};

// ─── Revisão semanal ────────────────────────────────────────
function WeekReview({ store, accentColor }) {
  const { state } = store;
  const r = useMemo(() => weeklyReview(state), [state]);
  const big = (v) => ({ fontFamily: "var(--serif)", fontSize: 24, color: "var(--ink)", lineHeight: 1 });
  const cap = { fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)", marginTop: 4 };
  return (
    <div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", color: "var(--ink-3)", marginBottom: 12 }}>
        {fmtDateShort(tsFromDayKey(r.startKey))} – {fmtDateShort(tsFromDayKey(r.endKey))}
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1,
        background: "var(--rule)", border: "1px solid var(--rule)", borderRadius: 10, overflow: "hidden",
      }}>
        <div style={{ background: "var(--paper)", padding: "14px 14px" }}>
          <div style={{ ...big(), color: accentColor }}>{fmtDuration(r.focusMs)}</div>
          <div style={cap}>{trf("foco · {n} {label}", { n: r.blockCount, label: r.blockCount === 1 ? tr("bloco") : tr("blocos") })}</div>
        </div>
        <div style={{ background: "var(--paper)", padding: "14px 14px" }}>
          <div style={big()}>{r.activeDays}<span style={{ fontSize: 13, color: "var(--ink-3)" }}>/7</span></div>
          <div style={cap}>{tr("dias activos")}</div>
        </div>
        <div style={{ background: "var(--paper)", padding: "14px 14px" }}>
          <div style={big()}>{r.intDone}<span style={{ fontSize: 13, color: "var(--ink-3)" }}>/{r.intTotal || 0}</span></div>
          <div style={cap}>{tr("intenções feitas")}</div>
        </div>
        <div style={{ background: "var(--paper)", padding: "14px 14px" }}>
          <div style={{ ...big(), color: r.habitPct === null ? "var(--ink-3)" : accentColor }}>
            {r.habitPct === null ? "—" : r.habitPct + "%"}
          </div>
          <div style={cap}>{trf("hábitos · {n} feitos", { n: r.habitDone })}</div>
        </div>
      </div>
      {r.topKey && r.topMs > 0 && (
        <div style={{ marginTop: 14, fontFamily: "var(--serif)", fontSize: 15, color: "var(--ink-2)", lineHeight: 1.45 }}>
          {tr("O seu pico foi")} <span style={{ fontStyle: "italic" }}>{fmtDateLong(tsFromDayKey(r.topKey)).split(",")[0]}</span>,
          {tr("com")} <span style={{ color: accentColor }}>{fmtDuration(r.topMs)}</span> {tr("em foco.")}
          {r.reflections > 0 && <> {trf("Escreveu {n} {label}.", { n: r.reflections, label: r.reflections === 1 ? tr("reflexão") : tr("reflexões") })}</>}
        </div>
      )}
    </div>
  );
}

// ─── Insights sheet (hub de análise) ────────────────────────
function InsightsSheet({ open, onClose, store, accentColor }) {
  if (!open) return null;
  const { state } = store;
  const Section = ({ label, children }) => (
    <div style={{ marginTop: 26 }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 12 }}>{label}</div>
      {children}
    </div>
  );
  return (
    <Sheet open={open} onClose={onClose} title={tr("Revisão")}>
      <div style={{ padding: "8px 24px 28px" }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: 24, lineHeight: 1.2, color: "var(--ink)", letterSpacing: "-0.01em" }}>
          {tr("A sua semana, de relance.")}
        </div>
        <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14, color: "var(--ink-3)", marginTop: 4, marginBottom: 18 }}>
          {tr("Sem julgamento. Só o que aconteceu, para reparar no padrão.")}
        </div>
        <WeekReview store={store} accentColor={accentColor}/>
        <Section label={tr("Melhor hora do dia")}>
          <BestHourChart blocks={state.blocks} accentColor={accentColor}/>
        </Section>
        <Section label={tr("Hábitos × foco")}>
          <CorrelationList habits={state.habits} blocks={state.blocks} accentColor={accentColor}/>
        </Section>
        <Section label={tr("Calendário de foco")}>
          <FocusCalendar blocks={state.blocks} accentColor={accentColor}/>
        </Section>
      </div>
    </Sheet>
  );
}

// ─── Metas trimestrais (secção do Hoje) ─────────────────────
function GoalsSection({ store, accentColor }) {
  const { state, addGoal, updateGoal, toggleGoal, removeGoal, reorderGoals } = store;
  const goals = state.goals || [];
  const [q, setQ] = useState(quarterOf(Date.now()));
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [histOpen, setHistOpen] = useState(false);

  const current = quarterOf(Date.now());
  const list = goals.filter(g => g.quarter === q);
  const done = list.filter(g => g.done).length;

  const listIds = list.map(g => g.id);
  const { dragId, start } = useDragReorder(listIds, (ids) => reorderGoals(q, ids));

  const history = useMemo(() => {
    const map = {};
    goals.forEach(g => {
      const m = map[g.quarter] || (map[g.quarter] = { total: 0, done: 0 });
      m.total++; if (g.done) m.done++;
    });
    return Object.keys(map).sort().reverse().map(qk => ({ q: qk, ...map[qk] }));
  }, [goals]);

  const commit = () => {
    if (text.trim()) { addGoal(text, q); haptic(8); }
    setText(""); setAdding(false);
  };
  const startEdit = (g) => { setEditId(g.id); setEditText(g.text); };
  const commitEdit = () => {
    if (editId) { const t = editText.trim(); if (t) updateGoal(editId, { text: t }); }
    setEditId(null); setEditText("");
  };
  const carryOver = (g) => { updateGoal(g.id, { quarter: nextQuarter(g.quarter) }); haptic(8); };

  const navBtn = (onClick, children, title) => (
    <button onClick={onClick} className="tap" title={title}
      style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--rule)", background: "transparent",
        color: "var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
      {children}
    </button>
  );

  return (
    <div style={{ marginTop: 32, padding: "20px 22px", background: "var(--paper-2)", borderRadius: 14, border: "1px solid var(--rule)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-3)" }}>
          {tr("Metas do trimestre")}
        </div>
        {list.length > 0 && (
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)" }}>{done}/{list.length}</div>
        )}
      </div>

      {/* Quarter navigator (free: past & future) */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        {navBtn(() => setQ(prevQuarter(q)), <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}><Icon.Chevron size={13}/></span>, tr("trimestre anterior"))}
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--ink)" }}>{quarterLabel(q).split(" · ")[0]}</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.08em", color: "var(--ink-3)" }}>
            {quarterLabel(q).split(" · ")[1]}{q === current ? " · " + tr("atual") : ""}
          </div>
        </div>
        {navBtn(() => setQ(nextQuarter(q)), <Icon.Chevron size={13}/>, tr("trimestre seguinte"))}
      </div>

      {list.length === 0 && !adding && (
        <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14, color: "var(--ink-3)", lineHeight: 1.4, marginBottom: 8 }}>
          {trf("O que quer ter feito até ao fim de {q}? Uma ou duas coisas grandes.", { q: quarterLabel(q).split(" · ")[1] })}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {list.map(g => (
          <div key={g.id} data-drag-id={g.id} className="goal-row"
            style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 0", borderBottom: "1px solid var(--rule)",
              background: dragId === g.id ? "var(--paper)" : "transparent", opacity: dragId === g.id ? 0.7 : 1,
              borderRadius: dragId === g.id ? 10 : 0, transition: "background 0.12s" }}>
            <button onPointerDown={(e) => start(e, g.id)} className="tap" title={tr("arrastar para reordenar")}
              style={{ width: 20, alignSelf: "stretch", border: "none", background: "transparent", color: "var(--ink-4)",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab", padding: 0, touchAction: "none", flexShrink: 0 }}>
              <Icon.Grip size={12}/>
            </button>
            <div style={{ paddingTop: 1 }}>
              <Check checked={g.done} onChange={() => { toggleGoal(g.id); haptic(8); }} size={20} accentColor={accentColor}/>
            </div>
            {editId === g.id ? (
              <input autoFocus value={editText} onChange={e => setEditText(e.target.value)} onBlur={commitEdit}
                onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") { setEditId(null); setEditText(""); } }}
                style={{ flex: 1, border: "none", borderBottom: "1px solid var(--rule)", background: "transparent", padding: "0 0 2px", fontSize: 16, color: "var(--ink)", fontFamily: "var(--serif)" }}/>
            ) : (
              <div onClick={() => startEdit(g)} title={tr("tocar para editar")} style={{
                flex: 1, fontFamily: "var(--serif)", fontSize: 16, lineHeight: 1.3, cursor: "text",
                color: g.done ? "var(--ink-3)" : "var(--ink)",
                textDecoration: g.done ? "line-through" : "none", textDecorationColor: "var(--ink-3)",
              }}>{g.text}</div>
            )}
            {!g.done && editId !== g.id && (
              <button onClick={() => carryOver(g)} className="tap" title={trf("mover para {q}", { q: quarterLabel(nextQuarter(g.quarter)).split(" · ")[0] })}
                style={{ border: "none", background: "transparent", color: "var(--ink-4)", cursor: "pointer", padding: 2, display: "flex" }}>
                <Icon.Chevron size={13}/>
              </button>
            )}
            <button onClick={() => removeGoal(g.id)} className="tap" title={tr("remover")}
              style={{ border: "none", background: "transparent", color: "var(--ink-4)", cursor: "pointer", padding: 2, display: "flex" }}>
              <Icon.Trash size={13}/>
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <input autoFocus value={text} onChange={e => setText(e.target.value)} onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setText(""); setAdding(false); } }}
          placeholder={tr("Nova meta…")}
          style={{ width: "100%", border: "none", borderBottom: "1px solid var(--rule)", background: "transparent", padding: "10px 0", fontSize: 16, color: "var(--ink)", fontFamily: "var(--serif)" }}/>
      ) : (
        <button onClick={() => setAdding(true)} className="tap" style={{
          marginTop: 8, background: "transparent", border: "none", padding: "8px 0",
          display: "flex", alignItems: "center", gap: 10, color: "var(--ink-3)", fontSize: 14, cursor: "pointer",
        }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", border: "1.5px dashed var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon.Plus size={11}/>
          </div>
          {tr("adicionar meta")}
        </button>
      )}

      {/* Histórico de trimestres */}
      {history.length > 0 && (
        <div style={{ marginTop: 16, borderTop: "1px solid var(--rule)", paddingTop: 12 }}>
          <button onClick={() => setHistOpen(o => !o)} className="tap"
            style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
              fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-3)" }}>
            <span style={{ display: "inline-flex", transform: histOpen ? "rotate(90deg)" : "none", transition: "transform 0.12s" }}><Icon.Chevron size={11}/></span>
            {tr("Histórico")}
          </button>
          {histOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 10 }}>
              {history.map(h => (
                <button key={h.q} onClick={() => { setQ(h.q); haptic(6); }} className="tap"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
                    border: "none", background: h.q === q ? `${accentColor}11` : "transparent",
                    borderRadius: 8, padding: "8px 10px", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: h.q === q ? accentColor : "var(--ink-2)" }}>
                    {quarterLabel(h.q).split(" · ")[0]}{h.q === current ? " · " + tr("atual") : ""}
                  </span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: h.done === h.total ? accentColor : "var(--ink-3)" }}>
                    {trf("{d}/{t} cumpridas", { d: h.done, t: h.total })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Lembretes locais (sem servidor; só com a app aberta) ───
// Dispara notificações enquanto a página está aberta: nudge de hábitos
// pendentes e da reflexão noturna, uma vez por dia, à hora preferida.
function useReminders(store) {
  const { state } = store;
  const prefs = state.prefs || {};
  const rem = prefs.reminders || {};
  useEffect(() => {
    if (!rem.enabled) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    const firedKey = (kind, dayKey) => "pauta.reminded." + kind + "." + dayKey;
    const tryFire = () => {
      const now = new Date();
      const dayKey = dayKeyOf(now.getTime());
      const hhmm = pad(now.getHours()) + ":" + pad(now.getMinutes());

      // Habits nudge
      if (rem.habitsTime && hhmm >= rem.habitsTime) {
        const pending = (state.habits || []).filter(h =>
          habitIsActiveOn(h, dayKey) && !(h.log && h.log[dayKey]) && !(h.respiros && h.respiros[dayKey])
        );
        if (pending.length > 0 && !localStorage.getItem(firedKey("habits", dayKey))) {
          try {
            new Notification(tr("Pauta · marés de hoje"), {
              body: pending.length === 1
                ? trf('Falta "{name}".', { name: pending[0].name })
                : trf("Faltam {n} hábitos hoje.", { n: pending.length }),
              tag: "pauta-habits",
            });
            localStorage.setItem(firedKey("habits", dayKey), "1");
          } catch (e) {}
        }
      }
      // Evening reflection nudge
      if (rem.reflectionTime && hhmm >= rem.reflectionTime) {
        const noReflection = !(state.today && state.today.dayKey === dayKey && state.today.reflection && state.today.reflection.trim());
        if (noReflection && !localStorage.getItem(firedKey("reflection", dayKey))) {
          try {
            new Notification(tr("Pauta · reflexão da noite"), {
              body: tr("O que valeu hoje? Escreva uma linha."),
              tag: "pauta-reflection",
            });
            localStorage.setItem(firedKey("reflection", dayKey), "1");
          } catch (e) {}
        }
      }
    };
    tryFire();
    const id = setInterval(tryFire, 60000);
    return () => clearInterval(id);
  }, [rem.enabled, rem.habitsTime, rem.reflectionTime, state.habits, state.today]);
}

Object.assign(window, {
  haptic, OnboardingOverlay, TierGuideSheet,
  BestHourChart, CorrelationList, FocusCalendar, WeekReview, InsightsSheet,
  GoalsSection, useReminders,
});

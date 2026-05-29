// Pauta — Pip, the parrot companion.
//
// A small, opt-out mascot that flies in now and then with a habit-building tip,
// a "did you know", an app tip, or a (bad) parrot joke — and reacts when you
// mark a habit or start a focus block. Content is bilingual inline (PT/EN) so it
// follows the language toggle without bloating the i18n dictionary; pl() picks.
//
// Disable: Definições → "Papagaio ajudante". Renders nothing when off or during
// onboarding. Pure front-end; no storage, no network.

// Pick the line for the current language (PT is the source).
function pl(msg) { return (window.PAUTA_LANG === "en" ? msg.en : msg.pt); }
function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const PARROT_TIPS = [
  { pt: "Empilha o hábito novo a seguir a um que já fazes: «depois do café, 5 min de leitura».", en: "Stack a new habit after one you already do: “after coffee, 5 min of reading.”" },
  { pt: "Começa ridiculamente pequeno. Uma flexão conta. O resto vem depois.", en: "Start absurdly small. One push-up counts. The rest follows." },
  { pt: "Se falhares um dia, tudo bem — só não falhes dois seguidos.", en: "Miss a day, fine — just never miss two in a row." },
  { pt: "O ambiente ganha à força de vontade. Deixa o livro na almofada.", en: "Environment beats willpower. Leave the book on your pillow." },
  { pt: "Hábitos formam-se pela repetição, não pela perfeição.", en: "Habits are built by repetition, not perfection." },
];
const PARROT_DYK = [
  { pt: "Sabias? Um hábito demora em média ~66 dias a tornar-se automático — não 21.", en: "Did you know? A habit takes ~66 days on average to become automatic — not 21." },
  { pt: "Sabias? Marcar num calendário visível aumenta a adesão. As Marés existem por isso.", en: "Did you know? Marking a visible calendar boosts follow-through. That's why Marés exists." },
  { pt: "Sabias? Os papagaios-cinzentos aprendem centenas de palavras. Eu prefiro dar dicas.", en: "Did you know? Grey parrots learn hundreds of words. I prefer giving tips." },
  { pt: "Sabias? Dormir bem é o hábito que torna todos os outros mais fáceis.", en: "Did you know? Good sleep is the habit that makes every other one easier." },
];
const PARROT_APP = [
  { pt: "Toca e segura num dia vazio nas Marés para marcar um respiro honesto.", en: "Tap and hold an empty day in Marés to mark an honest rest day." },
  { pt: "No bloco ativo, toca no ícone de ecrã cheio para o modo foco zen.", en: "On the active block, tap the full-screen icon for zen focus mode." },
  { pt: "Liga a cópia automática nas Definições — eu durmo mais descansado.", en: "Turn on auto-backup in Settings — I'll sleep easier." },
  { pt: "Arrasta as intenções para as reordenares por prioridade.", en: "Drag intentions to reorder them by priority." },
  { pt: "Toca-me para outra dica. Ou desliga-me nas Definições, se eu falar demais.", en: "Tap me for another tip. Or switch me off in Settings if I talk too much." },
];
const PARROT_JOKES = [
  { pt: "Porque foi o papagaio às Marés? Para apanhar a onda do hábito! 🦜", en: "Why did the parrot visit Marés? To catch the habit wave! 🦜" },
  { pt: "Dizem que repito tudo. Repito: hábitos pequenos, resultados grandes.", en: "They say I repeat everything. I repeat: small habits, big results." },
  { pt: "Não sou um hábito, mas também gosto de aparecer todos os dias.", en: "I'm not a habit, but I do like showing up every day." },
];
const PARROT_REACT_HABIT = [
  { pt: "Boa! Mais uma marca. Estou impressionado 🦜", en: "Nice! Another mark. I'm impressed 🦜" },
  { pt: "É isso! A maré sobe.", en: "That's it! The tide rises." },
  { pt: "Vi! E o teu cérebro também reparou.", en: "Saw that! And your brain noticed too." },
];
const PARROT_REACT_BLOCK = [
  { pt: "Modo foco. Vou ficar quietinho.", en: "Focus mode. I'll keep quiet." },
  { pt: "Concentra-te — eu vigio o tempo.", en: "Focus up — I'll watch the clock." },
];

const PARROT_IDLE_POOLS = [PARROT_TIPS, PARROT_DYK, PARROT_APP, PARROT_JOKES];

// Cute, stylised parrot facing left. Body uses the live accent colour.
function ParrotSvg({ accent, size = 56 }) {
  const dark = "rgba(0,0,0,0.18)";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M14 40 C8 48 8 56 14 58 C16 52 20 48 25 46 Z" fill={accent} opacity="0.85"/>
      <ellipse cx="35" cy="38" rx="16" ry="18" fill={accent}/>
      <ellipse cx="39" cy="42" rx="10" ry="12" fill="#F2D9A0"/>
      <path d="M31 26 C21 30 19 44 27 52 C33 46 35 36 33 28 Z" fill={accent}/>
      <path d="M31 27 C22 31 20 43 27 51" stroke={dark} strokeWidth="1.5" fill="none" opacity="0.4"/>
      <circle cx="39" cy="20" r="13" fill={accent}/>
      <path d="M41 8 C43 3 48 4 47 9 C46 12 43 12 40 12 Z" fill={accent}/>
      <circle cx="41" cy="18" r="5" fill="#fff"/>
      <circle cx="42" cy="18" r="2.4" fill="#1A1815"/>
      <path d="M28 18 C20 18 18 24 24 26 C28 27 30 24 30 21 Z" fill="#E8A23D"/>
      <path d="M24 26 C26 29 30 29 30 25" fill="#C9852B"/>
      <path d="M31 56 l0 4 M40 56 l0 4" stroke="#E8A23D" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function ParrotCompanion({ store, accentColor }) {
  const enabled = store.state.prefs.parrot !== false;
  const [bubble, setBubble] = useState(null);
  const hideTimer = useRef(null);

  const say = (text) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setBubble(text);
    hideTimer.current = setTimeout(() => setBubble(null), 9000);
  };
  const sayIdle = () => say(pl(pickOne(pickOne(PARROT_IDLE_POOLS))));

  // First hello shortly after load, then an occasional idle line.
  useEffect(() => {
    if (!enabled) return;
    const first = setTimeout(sayIdle, 11000);
    const iv = setInterval(sayIdle, 4 * 60000);
    return () => { clearTimeout(first); clearInterval(iv); if (hideTimer.current) clearTimeout(hideTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // React when a habit is freshly marked done today.
  const todayKey = dayKeyOf(Date.now());
  const doneToday = (store.state.habits || []).filter(h => h.log && h.log[todayKey]).length;
  const prevDone = useRef(doneToday);
  useEffect(() => {
    if (enabled && doneToday > prevDone.current) say(pl(pickOne(PARROT_REACT_HABIT)));
    prevDone.current = doneToday;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneToday]);

  // React when a new focus block starts.
  const activeId = store.activeBlock ? store.activeBlock.id : null;
  const prevActive = useRef(activeId);
  useEffect(() => {
    if (enabled && activeId && activeId !== prevActive.current) say(pl(pickOne(PARROT_REACT_BLOCK)));
    prevActive.current = activeId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  if (!enabled) return null;

  return (
    <div style={{
      position: "absolute", right: 12, bottom: "calc(86px + env(safe-area-inset-bottom))",
      zIndex: 40, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8,
      pointerEvents: "none",
    }}>
      {bubble && (
        <div style={{
          pointerEvents: "auto", maxWidth: 232, position: "relative",
          background: "var(--surface-dark)", color: "var(--on-dark)",
          borderRadius: 14, padding: "11px 30px 11px 13px", fontSize: 13, lineHeight: 1.38,
          fontFamily: "var(--sans)", boxShadow: "0 10px 28px rgba(0,0,0,0.3)",
          animation: "riseIn 0.3s ease both",
        }}>
          {bubble}
          <button onClick={() => setBubble(null)} aria-label={tr("fechar")} style={{
            position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%",
            border: "none", background: "transparent", color: "var(--on-dark-2)", cursor: "pointer",
            fontSize: 15, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>
      )}
      <button onClick={sayIdle} className="tap" aria-label={tr("papagaio")} style={{
        pointerEvents: "auto", border: "none", background: "transparent", padding: 0, cursor: "pointer",
        animation: "parrotIn 0.6s ease both",
        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.25))",
      }}>
        <ParrotSvg accent={accentColor} size={54}/>
      </button>
    </div>
  );
}

Object.assign(window, { ParrotCompanion });

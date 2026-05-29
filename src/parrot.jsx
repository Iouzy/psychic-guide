// Pauta — Pip, the parrot companion.
//
// A small, opt-out mascot that flies around the app with habit tips, "did you
// know"s, app hints, jokes (silly, philosophical and a few Portuguese cultural
// nods), and tab-specific lines — and reacts, happily, whenever you finish
// something (mark a habit, conclude a block, complete an intention, write the
// nightly reflection, tick a quarter goal). It actually *flies* to the corner
// the line is about, and on the Marés tab it surfs along the bottom without
// covering the screen. Content is bilingual inline (PT/EN) so it follows the
// language toggle without bloating the i18n dictionary; pl() picks.
//
// Disable: Definições → "Papagaio ajudante". Renders nothing when off or during
// onboarding. Pure front-end; no storage, no network.

// Pick the line for the current language (PT is the source).
function pl(msg) { return (window.PAUTA_LANG === "en" ? msg.en : msg.pt); }
// Pick a message from a pool, avoiding recently-shown ones so Pip doesn't repeat
// himself. `avoid` is a Set of the last few PT strings shown.
function pickFresh(arr, avoid) {
  const fresh = arr.filter(m => !avoid.has(m.pt));
  const pool = fresh.length ? fresh : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}
function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ─── Content pools ──────────────────────────────────────────
// Habit-building tips.
const PARROT_TIPS = [
  { pt: "Empilha o hábito novo a seguir a um que já fazes: «depois do café, 5 min de leitura».", en: "Stack a new habit after one you already do: “after coffee, 5 min of reading.”" },
  { pt: "Começa ridiculamente pequeno. Uma flexão conta. O resto vem depois.", en: "Start absurdly small. One push-up counts. The rest follows." },
  { pt: "Se falhares um dia, tudo bem — só não falhes dois seguidos. É a única regra.", en: "Miss a day, fine — just never miss two in a row. That's the only rule." },
  { pt: "O ambiente ganha à força de vontade. Deixa o livro na almofada.", en: "Environment beats willpower. Leave the book on your pillow." },
  { pt: "Hábitos formam-se pela repetição, não pela perfeição.", en: "Habits are built by repetition, not perfection." },
  { pt: "Torna-o óbvio: deixa a pista à vista. Ténis à porta, água na secretária.", en: "Make it obvious: leave the cue in sight. Shoes by the door, water on the desk." },
  { pt: "Liga o hábito a uma hora e a um sítio. «Quando» e «onde» quase duplicam a adesão.", en: "Tie the habit to a time and a place. “When” and “where” nearly double follow-through." },
];
// "Did you know" facts.
const PARROT_DYK = [
  { pt: "Sabias? Um hábito demora em média ~66 dias a tornar-se automático — não 21.", en: "Did you know? A habit takes ~66 days on average to become automatic — not 21." },
  { pt: "Sabias? Marcar num calendário visível aumenta a adesão. As Marés existem por isso.", en: "Did you know? Marking a visible calendar boosts follow-through. That's why Marés exists." },
  { pt: "Sabias? Os papagaios-cinzentos aprendem centenas de palavras. Eu prefiro dar dicas.", en: "Did you know? Grey parrots learn hundreds of words. I prefer giving tips." },
  { pt: "Sabias? Dormir bem é o hábito que torna todos os outros mais fáceis.", en: "Did you know? Good sleep is the habit that makes every other one easier." },
  { pt: "Sabias? Celebrar uma pequena vitória faz o cérebro querer repeti-la. Por isso eu danço. 🦜", en: "Did you know? Celebrating a small win makes the brain want to repeat it. That's why I dance. 🦜" },
];
// App tips.
const PARROT_APP = [
  { pt: "Liga a cópia automática nas Definições — eu durmo mais descansado.", en: "Turn on auto-backup in Settings — I'll sleep easier." },
  { pt: "Tudo é offline e teu. Sem conta, sem servidor, sem ninguém a espreitar.", en: "Everything's offline and yours. No account, no server, nobody peeking." },
  { pt: "Tens uma revisão semanal nas Definições — vê os teus padrões sem julgamento.", en: "There's a weekly review in Settings — see your patterns, no judgement." },
  { pt: "Toca-me para outra deixa. Ou desliga-me nas Definições, se eu falar demais.", en: "Tap me for another line. Or switch me off in Settings if I talk too much." },
];
// Silly parrot / general jokes.
const PARROT_JOKES = [
  { pt: "Porque foi o papagaio às Marés? Para apanhar a onda do hábito! 🦜", en: "Why did the parrot visit Marés? To catch the habit wave! 🦜" },
  { pt: "Dizem que repito tudo. Repito: hábitos pequenos, resultados grandes.", en: "They say I repeat everything. I repeat: small habits, big results." },
  { pt: "Não sou um hábito, mas também gosto de aparecer todos os dias.", en: "I'm not a habit, but I do like showing up every day." },
  { pt: "Sou a única ave que faz code review às tuas rotinas. 🦜", en: "I'm the only bird that code-reviews your routines. 🦜" },
  { pt: "Dizem que tenho cérebro do tamanho de uma noz. Mesmo assim lembro-me da tua maré.", en: "They say my brain is the size of a walnut. I still remember your tide." },
  { pt: "Polly quer… um hábito marcado. 🦜", en: "Polly wants… a habit checked off. 🦜" },
  { pt: "Não voo em círculos — voo em rotinas.", en: "I don't fly in circles — I fly in routines." },
  { pt: "Bom dia! Ou boa tarde. Sou um papagaio, não um relógio.", en: "Good morning! Or afternoon. I'm a parrot, not a clock." },
];
// Philosophical jokes / quips.
const PARROT_PHILO = [
  { pt: "Sócrates só sabia que nada sabia. Eu sei uma coisa: sabes marcar este hábito.", en: "Socrates knew only that he knew nothing. I know one thing: you can check off this habit." },
  { pt: "Heraclito dizia que não te banhas duas vezes no mesmo rio. Mas podes marcar a mesma maré todos os dias.", en: "Heraclitus said you can't step in the same river twice. But you can mark the same tide every day." },
  { pt: "Se um hábito cai na floresta e ninguém o marca, terá existido? Marca, só para tirar a dúvida.", en: "If a habit falls in the forest and no one logs it, did it happen? Log it, just to be sure." },
  { pt: "Camus mandou imaginar Sísifo feliz. Eu imagino-te a concluir o bloco. 🪨", en: "Camus told us to imagine Sisyphus happy. I imagine you finishing the block. 🪨" },
  { pt: "«Penso, logo existo.» Marcas, logo persistes.", en: "“I think, therefore I am.” You log, therefore you persist." },
  { pt: "Os estóicos diziam: controla o que podes. Não controlas o dia inteiro — controlas o próximo toque.", en: "The Stoics said: control what you can. You can't control the whole day — only the next tap." },
  { pt: "Nietzsche falava do eterno retorno. Tu chamas-lhe hábito diário.", en: "Nietzsche spoke of eternal recurrence. You call it a daily habit." },
  { pt: "A vida é curta; a tua streak não tem de ser. 🌱", en: "Life is short; your streak doesn't have to be. 🌱" },
];
// Portuguese cultural nods: Magalhães, Pessoa, Lisbon, and (gentle, non-partisan)
// pokes at the country's famously unstable politics.
const PARROT_CULTURE = [
  { pt: "Magalhães deu a volta ao mundo sem GPS. Tu só precisas de marcar o hábito de hoje. 🧭", en: "Magellan sailed around the world without GPS. You just need to check off today's habit. 🧭" },
  { pt: "Magalhães partiu com cinco naus e voltou uma. A tua streak, essa, só tem de continuar inteira.", en: "Magellan left with five ships and one came back. Your streak only has to stay in one piece." },
  { pt: "Fernando Pessoa era várias pessoas e aparecia todos os dias para escrever. Tu és só um — sem desculpas. 🖋️", en: "Fernando Pessoa was many people and showed up to write every day. You're just one — no excuses. 🖋️" },
  { pt: "Pessoa escreveu: «Tudo vale a pena se a alma não é pequena». A tua maré também vale.", en: "Pessoa wrote: “Everything is worth it if the soul is not small.” Your tide is worth it too." },
  { pt: "«Navegar é preciso», dizia Pessoa. Marcar hábitos também é. 🌊", en: "“To sail is necessary,” wrote Pessoa. So is checking off habits. 🌊" },
  { pt: "Lisboa tem sete colinas; tu só tens de subir um hábito de cada vez.", en: "Lisbon has seven hills; you only have to climb one habit at a time." },
  { pt: "Em Portugal, os governos caem mais depressa do que as minhas penas na muda. Que a tua rotina não caia. 🪶", en: "In Portugal, governments fall faster than my moulting feathers. May your routine not fall. 🪶" },
  { pt: "Há orçamentos que não passam na Assembleia. O teu hábito de hoje passa — é só um toque.", en: "Some budgets don't pass in parliament. Today's habit passes — it's just one tap." },
  { pt: "Mudou o governo outra vez? A tua rotina pode bem ser a coisa mais estável do país.", en: "Government changed again? Your routine might just be the most stable thing in the country." },
  { pt: "Prometeram-te descidas do IRS; eu prometo-te uma dica por cada toque. E eu cumpro o programa. 🦜", en: "They promised you tax cuts; I promise a tip per tap. And I keep my manifesto. 🦜" },
];

// Tab-specific lines. The pool's anchor tells Pip where to fly so he lands near
// what the line is about.
const PARROT_HOJE = [
  { pt: "Uma a quatro intenções. Mais do que isso é uma lista de desejos, não um dia.", en: "One to four intentions. More than that is a wish list, not a day." },
  { pt: "Escolhe a intenção que, feita, faria o dia valer a pena.", en: "Pick the intention that, if done, would make the day worth it." },
  { pt: "À noite, uma linha de reflexão chega. O teu eu de amanhã agradece.", en: "At night, one line of reflection is enough. Tomorrow-you will thank you." },
  { pt: "Arrasta as intenções para pôr a mais importante no topo.", en: "Drag your intentions to put the most important one on top." },
  { pt: "O que não cabe hoje, cabe amanhã. Recomeça-se sempre.", en: "What doesn't fit today fits tomorrow. You always begin again." },
];
const PARROT_PAUTA = [
  { pt: "Começa um bloco e o tempo conta-se sozinho. Tu só tens de aparecer.", en: "Start a block and time counts itself. You just have to show up." },
  { pt: "Pausa sem culpa: a pausa também faz parte do foco.", en: "Pause without guilt: the pause is part of the focus too." },
  { pt: "Um bloco de 25 minutos vale mais do que uma hora distraída.", en: "A 25-minute block beats a distracted hour." },
  { pt: "Toca no ícone de ecrã cheio para entrar no modo foco zen.", en: "Tap the full-screen icon to enter zen focus mode." },
  { pt: "Foco não é correr mais; é parar de saltar de tarefa em tarefa.", en: "Focus isn't running faster; it's stopping the task-hopping." },
];
const PARROT_MARES = [
  { pt: "Vou só apanhar esta onda enquanto marcas a tua maré. 🏄", en: "Just catching this wave while you mark your tide. 🏄" },
  { pt: "Constância vence intensidade. A maré sobe um dia de cada vez.", en: "Constancy beats intensity. The tide rises one day at a time." },
  { pt: "Um respiro honesto não quebra a maré — só um dia esquecido a faz recuar.", en: "An honest breath doesn't break the tide — only a forgotten day pulls it back." },
  { pt: "Pressão longa num dia vazio marca um respiro. Sem culpa.", en: "Long-press an empty day to mark a breath. No guilt." },
  { pt: "Toda a onda começa pequena. A tua também começou.", en: "Every wave starts small. Yours did too." },
];

// Reactions, fired when you finish something. These are the happy ones.
const PARROT_REACT_HABIT = [
  { pt: "Boa! Mais uma marca. Estou impressionado 🦜", en: "Nice! Another mark. I'm impressed 🦜" },
  { pt: "É isso! A maré sobe. 🌊", en: "That's it! The tide rises. 🌊" },
  { pt: "Vi! E o teu cérebro também reparou.", en: "Saw that! And your brain noticed too." },
  { pt: "Marcado! Vê só a corrente a ganhar força.", en: "Checked! Watch the current pick up." },
  { pt: "É disto que eu gosto. Bora, mais uma onda.", en: "That's what I like. Come on, one more wave." },
];
const PARROT_REACT_BLOCK_START = [
  { pt: "Modo foco. Vou ficar quietinho.", en: "Focus mode. I'll keep quiet." },
  { pt: "Concentra-te — eu vigio o tempo. ⏱️", en: "Focus up — I'll watch the clock. ⏱️" },
  { pt: "Silêncio de biblioteca. Faz o que tens a fazer.", en: "Library silence. Do what you need to do." },
];
const PARROT_REACT_BLOCK_DONE = [
  { pt: "Bloco concluído! O cérebro acabou de dizer «conseguimos». 🎉", en: "Block finished! Your brain just said “we did it.” 🎉" },
  { pt: "Boa! Tempo bem gasto fica registado para sempre.", en: "Nice! Time well spent, recorded forever." },
  { pt: "Concluído. Isto é foco a transformar-se em resultado. ✨", en: "Done. That's focus turning into results. ✨" },
];
const PARROT_REACT_INTENTION = [
  { pt: "Intenção feita! O dia acabou de render. ✅", en: "Intention done! The day just paid off. ✅" },
  { pt: "Riscaste uma. Sabe bem, não sabe?", en: "Crossed one off. Feels good, doesn't it?" },
  { pt: "Menos uma na lista, mais uma vitória. 🦜", en: "One fewer on the list, one more win. 🦜" },
];
const PARROT_REACT_REFLECTION = [
  { pt: "Uma linha que seja — o teu eu de amanhã vai relê-la. ✍️", en: "Even one line — tomorrow-you will reread it. ✍️" },
  { pt: "Reflexão guardada. É assim que se aprende com os próprios dias.", en: "Reflection saved. That's how you learn from your own days." },
];
const PARROT_REACT_GOAL = [
  { pt: "Meta do trimestre cumprida! Isto não é sorte, é maré. 🏆", en: "Quarter goal done! That's not luck, it's tide. 🏆" },
  { pt: "Grande coisa feita. O Magalhães ficaria orgulhoso. 🧭", en: "A big thing done. Magellan would be proud. 🧭" },
];

// Where Pip rests/flies. top/left are % of the frame so they scale with size and
// CSS-transition smoothly (a real "fly to"). He lives in the lower, usually-empty
// half of the screen so he never sits on top of the header or the cards, and each
// tab has a distinct spot so switching tabs sends him on a visible flight across
// the screen. `surf` rides the bottom on a wave.
const PARROT_ANCHORS = {
  hoje:  { top: "66%", left: "64%", side: "right",  vert: "bottom" },
  pauta: { top: "66%", left: "8%",  side: "left",   vert: "bottom" },
  surf:  { top: "74%", left: "50%", side: "center", vert: "bottom", surf: true },
};
// Resting anchor for each tab.
const TAB_ANCHOR = { hoje: "hoje", pauta: "pauta", mares: "surf" };

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

// The surfboard Pip rides (Marés tab) — a classic side-on board: a slim lens
// with pointed tips, a lighter deck panel and a centre stringer, so it clearly
// reads as a board and not a flat blob. The accent gives it the app's colour;
// the cream deck + white stringer add contrast on the dark Marés background.
// PT: prancha de surf vista de lado, com bicos, deck mais claro e quilha
// central — para se ler como prancha e não uma mancha.
function SurfBoard({ accent, width = 64 }) {
  return (
    <svg width={width} height={16} viewBox="0 0 64 16" fill="none" aria-hidden="true"
      style={{ display: "block", marginTop: -6 }}>
      {/* board body — pointed-nose/tail lozenge */}
      <path d="M2 8 C2 4 16 2 32 2 C48 2 62 4 62 8 C62 12 48 14 32 14 C16 14 2 12 2 8 Z"
        fill={accent}/>
      {/* deck highlight */}
      <path d="M8 8 C8 5.5 18 4.5 32 4.5 C46 4.5 56 5.5 56 8 C56 10.5 46 11.5 32 11.5 C18 11.5 8 10.5 8 8 Z"
        fill="#FFF4DC" opacity="0.55"/>
      {/* stringer line down the middle */}
      <line x1="4" y1="8" x2="60" y2="8" stroke="#fff" strokeWidth="1" opacity="0.7"/>
    </svg>
  );
}

// The wave Pip surfs on. A real, readable swell: a layered body of water with a
// curling lip on the left, a bright white foam crest tracing the whole top and
// a couple of foam flecks. Water is a fixed sea-blue (not the accent) so it
// always reads as a wave whatever the accent colour is. // PT: onda legível —
// corpo de água em camadas, crista de espuma branca e uma curva que enrola.
function SurfWave({ width = 92 }) {
  const deep = "#2E7FA6";   // deeper water
  const sea  = "#46A8CE";   // surface water
  return (
    <svg width={width} height={28} viewBox="0 0 92 28" fill="none" aria-hidden="true"
      style={{ display: "block", marginTop: -9 }}>
      {/* deeper water behind, for depth */}
      <path d="M0 17 C18 9 30 22 48 15 C66 8 76 21 92 12 L92 28 L0 28 Z"
        fill={deep} opacity="0.85"/>
      {/* surface water */}
      <path d="M0 15 C16 7 28 20 46 13 C64 6 74 19 92 10 L92 28 L0 28 Z"
        fill={sea} opacity="0.9"/>
      {/* curling lip on the left where the bird rides */}
      <path d="M6 15 C2 9 10 4 18 7 C13 8 11 12 14 15 Z" fill="#fff" opacity="0.9"/>
      {/* foam crest along the top */}
      <path d="M0 15 C16 7 28 20 46 13 C64 6 74 19 92 10"
        stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.95"/>
      {/* foam flecks */}
      <circle cx="34" cy="17" r="1.4" fill="#fff" opacity="0.85"/>
      <circle cx="60" cy="14" r="1.2" fill="#fff" opacity="0.8"/>
      <circle cx="80" cy="15" r="1.5" fill="#fff" opacity="0.85"/>
    </svg>
  );
}

// Screen x-position (%) of an anchor — used to tell which way Pip is travelling
// when the tab changes, so he leans into the swipe.
function anchorLeftPct(key) {
  const a = PARROT_ANCHORS[key];
  return a ? parseFloat(a.left) : 50;
}

function ParrotCompanion({ store, accentColor, tab }) {
  const enabled = store.state.prefs.parrot !== false;
  const [bubble, setBubble] = useState(null);   // { text, happy }
  const [anchorKey, setAnchorKey] = useState(TAB_ANCHOR[tab] || "hoje");
  // Flight state drives the entrance + the "swiped to the next tab" animation.
  // `key` bumps on every flight so the CSS animation restarts; `dir` is the
  // travel direction (null on first mount → the fly-in swoop).
  const [flight, setFlight] = useState({ key: 0, dir: null });
  const prevTabRef = useRef(tab);
  const hideTimer = useRef(null);
  // Refs that always hold the *current* tab/bubble, so the long-lived idle
  // interval (created once, deps [enabled]) never reads a stale closure and
  // always picks a line for the tab you're actually on. // PT: refs com o valor
  // atual para o intervalo ocioso não usar um fecho desatualizado.
  const tabRef = useRef(tab);
  const bubbleRef = useRef(bubble);
  tabRef.current = tab;
  bubbleRef.current = bubble;

  // Hide Pip while any bottom-sheet/modal is open. The Pauta-tab sheets render
  // inside the content wrapper (its own stacking context), so their z-index sits
  // *below* this overlay — Pip would otherwise float on top of the sheet's
  // fields and buttons. A MutationObserver flips this when a `.om-sheet-card`
  // enters/leaves the DOM.
  const [sheetOpen, setSheetOpen] = useState(false);
  useEffect(() => {
    const check = () => setSheetOpen(!!document.querySelector(".om-sheet-card"));
    check();
    const mo = new MutationObserver(check);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
  const recent = useRef(new Set());              // last few PT strings shown

  const remember = (msg) => {
    recent.current.add(msg.pt);
    if (recent.current.size > 10) {
      // drop the oldest (Sets keep insertion order).
      recent.current.delete(recent.current.values().next().value);
    }
  };

  // Show a line. `anchor` is where to fly; `happy` triggers the celebratory hop.
  const say = (msg, { anchor, happy } = {}) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    remember(msg);
    if (anchor) setAnchorKey(anchor);
    setBubble({ text: pl(msg), happy: !!happy });
    hideTimer.current = setTimeout(() => setBubble(null), happy ? 7000 : 9000);
  };

  // An idle line, weighted toward the current tab's own pool, flying to the spot
  // the line is about.
  const sayIdle = () => {
    const av = recent.current;
    const r = Math.random();
    const curTab = tabRef.current;            // current tab, never a stale closure
    const here = TAB_ANCHOR[curTab] || "hoje";
    if (curTab === "hoje" && r < 0.5) return say(pickFresh(PARROT_HOJE, av), { anchor: here });
    if (curTab === "pauta" && r < 0.5) return say(pickFresh(PARROT_PAUTA, av), { anchor: here });
    if (curTab === "mares" && r < 0.5) return say(pickFresh(PARROT_MARES, av), { anchor: here });
    const general = [PARROT_TIPS, PARROT_DYK, PARROT_APP, PARROT_JOKES, PARROT_PHILO, PARROT_CULTURE];
    return say(pickFresh(pickOne(general), av), { anchor: here });
  };
  // Keep the latest sayIdle reachable from the long-lived timers below.
  const sayIdleRef = useRef(sayIdle);
  sayIdleRef.current = sayIdle;

  // First hello shortly after load, then an occasional idle line. The timers
  // call through refs so they always use the current tab/bubble.
  useEffect(() => {
    if (!enabled) return;
    const first = setTimeout(() => sayIdleRef.current(), 11000);
    const iv = setInterval(() => { if (!bubbleRef.current) sayIdleRef.current(); }, 3.5 * 60000);
    return () => { clearTimeout(first); clearInterval(iv); if (hideTimer.current) clearTimeout(hideTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Fly to the tab's resting spot when the tab changes (and now and then drop a
  // tab-specific line so each tab feels different).
  const firstTab = useRef(true);
  useEffect(() => {
    if (!enabled) return;
    const prev = prevTabRef.current;
    prevTabRef.current = tab;
    setAnchorKey(TAB_ANCHOR[tab] || "hoje");
    // Drop any lingering line the moment the tab changes, so a Marés line can't
    // hang over onto Pauta (and vice-versa). A fresh tab-specific line, if any,
    // is scheduled below. // PT: limpa o balão ao trocar de separador para a
    // deixa não "escorrer" para o separador seguinte.
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setBubble(null);
    if (firstTab.current) { firstTab.current = false; return; }
    // Launch him in the direction he's travelling across the screen so the move
    // reads as "swiped along with the tab", ending in a bump at the new corner.
    const dir = anchorLeftPct(TAB_ANCHOR[tab]) < anchorLeftPct(TAB_ANCHOR[prev]) ? "left" : "right";
    setFlight(f => ({ key: f.key + 1, dir }));
    if (Math.random() < 0.4) {
      const map = { hoje: PARROT_HOJE, pauta: PARROT_PAUTA, mares: PARROT_MARES };
      const pool = map[tab];
      if (pool) {
        const t = setTimeout(() => say(pickFresh(pool, recent.current), { anchor: TAB_ANCHOR[tab] }), 700);
        return () => clearTimeout(t);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const todayKey = dayKeyOf(Date.now());

  // ── Completion reactions ── (each compares a live count to its previous value)
  // Habit marked done today.
  const doneHabits = (store.state.habits || []).filter(h => h.log && h.log[todayKey]).length;
  const prevHabits = useRef(doneHabits);
  useEffect(() => {
    if (enabled && doneHabits > prevHabits.current) say(pickFresh(PARROT_REACT_HABIT, recent.current), { anchor: TAB_ANCHOR[tab], happy: true });
    prevHabits.current = doneHabits;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneHabits]);

  // New focus block started.
  const activeId = store.activeBlock ? store.activeBlock.id : null;
  const prevActive = useRef(activeId);
  useEffect(() => {
    if (enabled && activeId && activeId !== prevActive.current) say(pickFresh(PARROT_REACT_BLOCK_START, recent.current), { anchor: TAB_ANCHOR[tab] });
    prevActive.current = activeId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Focus block concluded today (a block went to "done" with a session today).
  const doneBlocks = (store.state.blocks || []).filter(b =>
    b.status === "done" && b.sessions && b.sessions.some(s => s.endedAt && dayKeyOf(s.endedAt) === todayKey)
  ).length;
  const prevDoneBlocks = useRef(doneBlocks);
  useEffect(() => {
    if (enabled && doneBlocks > prevDoneBlocks.current) say(pickFresh(PARROT_REACT_BLOCK_DONE, recent.current), { anchor: TAB_ANCHOR[tab], happy: true });
    prevDoneBlocks.current = doneBlocks;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneBlocks]);

  // Intention completed today.
  const doneIntentions = ((store.state.today && store.state.today.intentions) || []).filter(i => i.done).length;
  const prevIntentions = useRef(doneIntentions);
  useEffect(() => {
    if (enabled && doneIntentions > prevIntentions.current) say(pickFresh(PARROT_REACT_INTENTION, recent.current), { anchor: TAB_ANCHOR[tab], happy: true });
    prevIntentions.current = doneIntentions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneIntentions]);

  // Nightly reflection first written.
  const hasReflection = !!(store.state.today && store.state.today.reflection && store.state.today.reflection.trim());
  const prevReflection = useRef(hasReflection);
  useEffect(() => {
    if (enabled && hasReflection && !prevReflection.current) say(pickFresh(PARROT_REACT_REFLECTION, recent.current), { anchor: TAB_ANCHOR[tab], happy: true });
    prevReflection.current = hasReflection;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasReflection]);

  // Quarter goal ticked.
  const doneGoals = (store.state.goals || []).filter(g => g.done).length;
  const prevGoals = useRef(doneGoals);
  useEffect(() => {
    if (enabled && doneGoals > prevGoals.current) say(pickFresh(PARROT_REACT_GOAL, recent.current), { anchor: TAB_ANCHOR[tab], happy: true });
    prevGoals.current = doneGoals;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneGoals]);

  if (!enabled || sheetOpen) return null;   // stay out of the way of open sheets

  const a = PARROT_ANCHORS[anchorKey] || PARROT_ANCHORS.hoje;

  // The bubble sits above or below the bird, and opens toward the side with room.
  // NOTE: an absolutely-positioned bubble anchored only by `right`/`left` (no
  // explicit width) shrinks-to-fit its containing block — here the ~54px bird
  // wrapper — collapsing the text to one word per line. We give it a real width
  // so the phrase wraps like a proper speech bubble. // PT: largura fixa para o
  // balão embrulhar bem o texto (senão encolhia até caber só uma palavra).
  const bubblePos = {
    position: "absolute",
    width: "min(15rem, 72vw)",
    ...(a.vert === "top" ? { top: "100%", marginTop: 10 } : { bottom: "100%", marginBottom: 10 }),
    ...(a.side === "left" ? { left: 0 }
      : a.side === "center" ? { left: "50%", transform: "translateX(-50%)" }
      : { right: 0 }),
  };

  // A little tail that points back at Pip: a rotated square tucked under the
  // bubble's edge, on the side nearest the bird and the edge facing him.
  const tailStyle = {
    position: "absolute", width: 12, height: 12, background: "var(--surface-dark)",
    transform: "rotate(45deg)", borderRadius: 2,
    ...(a.vert === "top" ? { top: -5 } : { bottom: -5 }),
    ...(a.side === "left" ? { left: 20 }
      : a.side === "center" ? { left: "50%", marginLeft: -6 }
      : { right: 20 }),
  };

  // The bird's own idle motion (class-based so it survives reduce-motion — see
  // index.html): hops when happy, leans on the wave, floats otherwise.
  const birdClass = bubble && bubble.happy ? "pip-hop" : a.surf ? "pip-tilt" : "pip-float";
  const bird = (
    <button onClick={sayIdle} className={"tap " + birdClass} aria-label={tr("papagaio")} style={{
      pointerEvents: "auto", border: "none", background: "transparent", padding: 0, cursor: "pointer",
      filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.25))",
    }}>
      <ParrotSvg accent={accentColor} size={a.surf ? 48 : 54}/>
    </button>
  );

  // Which flight animation plays: the swoop-in on first mount, then a
  // direction-aware "flung across" on each tab change.
  const flightClass = flight.dir === "left" ? "pip-fly-l"
    : flight.dir === "right" ? "pip-fly-r"
    : "pip-in";

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 40, pointerEvents: "none" }}>
      {/* Travel layer: `.pip-move` transitions top/left with an overshoot, so he
          flies to the new tab's corner and bumps it. Keeps the surf centering
          transform — which is why the fly-in/fly animations live one level in,
          not here (a transform animation here would fight that centering). */}
      <div className="pip-move" style={{
        position: "absolute", top: a.top, left: a.left,
        transform: a.surf ? "translateX(-50%)" : "none",
      }}>
        {/* Flight layer: re-keyed every flight so the CSS animation restarts. */}
        <div key={flight.key} className={flightClass} style={{ transformOrigin: "center bottom" }}>
          <div style={{ position: "relative" }}>
            {bubble && (
              <div style={bubblePos}>
                <div className="pip-pop" style={{
                  position: "relative", pointerEvents: "auto",
                  background: "var(--surface-dark)", color: "var(--on-dark)",
                  borderRadius: 14, padding: "12px 32px 12px 14px", fontSize: 13.5, lineHeight: 1.45,
                  fontFamily: "var(--sans)", boxShadow: "0 12px 30px rgba(0,0,0,0.32)",
                  whiteSpace: "normal", overflowWrap: "break-word", wordBreak: "normal",
                }}>
                  <span style={tailStyle} aria-hidden="true"/>
                  {bubble.text}
                  <button onClick={() => setBubble(null)} aria-label={tr("fechar")} style={{
                    position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%",
                    border: "none", background: "transparent", color: "var(--on-dark-2)", cursor: "pointer",
                    fontSize: 15, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>×</button>
                </div>
              </div>
            )}
            {a.surf ? (
              // Drift sideways (the surfing run), and bob the bird, board and wave
              // together so they rise and fall as one — Pip rides the crest.
              <div className="pip-drift">
                <div className="pip-surf" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {bird}
                  <SurfBoard accent={accentColor}/>
                  <SurfWave/>
                </div>
              </div>
            ) : bird}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ParrotCompanion });

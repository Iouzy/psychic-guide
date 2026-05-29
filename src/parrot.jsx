// Pauta — Pip, the parrot companion.
//
// A small, opt-out mascot that flies around the app with habit tips, "did you
// know"s, app hints, jokes (silly, philosophical and a few Portuguese cultural
// nods), and tab-specific lines — and reacts, happily, whenever you finish
// something (mark a habit, conclude a block, complete an intention, write the
// nightly reflection, tick a quarter goal). It actually *flies* to the corner
// the line is about, and on the Marés tab it surfs a wave on a board.
//
// MOTION IS 100% JAVASCRIPT (requestAnimationFrame writing inline transforms to
// DOM nodes via refs). It deliberately does NOT use CSS animations/transitions:
// some Androids (e.g. MIUI "Remove animations" / OS reduce-motion) kill every
// CSS animation and transition app-wide, which left Pip a dead, sliding sticker.
// JS-set inline transforms are immune to that setting, so Pip flaps, bobs and
// flies regardless. We never drive motion through React state per frame — only
// the speech bubble and reactions use state; the loop mutates refs directly.
//
// Battery: the loop throttles to ~30fps while idle, runs full-rate during a
// flight/hop, fully parks when the tab is hidden (visibilitychange), and never
// starts when Pip is disabled.
//
// Content is bilingual inline (PT/EN) so it follows the language toggle without
// bloating the i18n dictionary; pl() picks. Disable: Definições → "Papagaio
// ajudante". Renders nothing when off or during onboarding. Pure front-end; no
// storage, no network.

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

// Where Pip rests/flies, as fractions of the frame so they scale with size.
// He lives LOW in each screen — the genuinely empty band above the tab bar — so
// neither the bird nor his (upward-opening) speech bubble ever covers the
// starter chips, "adicionar" buttons or the reflection card up in the content.
// Each tab has a distinct spot so switching tabs sends him on a visible flight
// across the screen. `surf` rides a wave at the bottom-centre (a touch higher so
// the wave clears the tab bar). `side`/`vert` only steer the bubble's direction.
const PARROT_ANCHORS = {
  hoje:  { fx: 0.74, fy: 0.80, side: "right",  vert: "bottom" },
  pauta: { fx: 0.18, fy: 0.80, side: "left",   vert: "bottom" },
  surf:  { fx: 0.50, fy: 0.75, side: "center", vert: "bottom", surf: true },
};
// Resting anchor for each tab.
const TAB_ANCHOR = { hoje: "hoje", pauta: "pauta", mares: "surf" };

// Pivots (in the bird's 0..72 viewBox) the rAF loop rotates the articulated
// parts about. They MUST match where those parts are drawn in ParrotSvg.
const WING_PIVOT = [35, 33];   // shoulder
const HEAD_PIVOT = [40, 30];   // neck
const TAIL_PIVOT = [34, 46];   // tail base
const EYE_CY     = 21;         // eye centre Y, for the blink squash

// ── Easing ──
function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function lerp(a, b, t) { return a + (b - a) * t; }

// Articulated parrot, facing left — a two-tone tropical bird: terracotta body in
// the live accent, a teal/blue wing + tail flash, a yellow hooked beak and a
// swept-back crest. Each movable part is its own <g> with a ref so the rAF loop
// can rotate it about a fixed pivot (via the SVG `transform` attribute — robust
// across browsers and immune to reduce-motion). Drawn in a 72×72 viewBox.
function ParrotSvg({ accent, size, wingRef, headRef, tailRef, eyeRef }) {
  const shade   = "rgba(0,0,0,0.18)";  // soft shading
  const belly   = "#F4E4C1";           // warm cream chest/cheek
  const teal    = "#2BA6C9";           // teal/blue wing + tail flash
  const tealDk  = "#1B7F9E";           // darker teal feather edges
  const tealLt  = "#8FD8E8";           // light leading edge
  const beak    = "#FFC83D";           // yellow hooked beak
  const beakDk  = "#E3A22A";           // beak shading / lower mandible
  const foot    = "#E8A23D";           // legs + toes
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none" aria-hidden="true"
      style={{ display: "block", overflow: "visible" }}>
      {/* long parrot tail — accent body with blue tips; sways from its base */}
      <g ref={tailRef}>
        <path d="M30 44 C28 54 29 63 33 71 C37 63 40 54 42 46 C38 44 33 43 30 44 Z" fill={accent}/>
        <path d="M34 49 C34 57 34 64 34 70" stroke={shade} strokeWidth="0.9" fill="none" opacity="0.4"/>
        <path d="M38 49 C38 56 37 62 36 67" stroke={shade} strokeWidth="0.8" fill="none" opacity="0.3"/>
        <path d="M33 71 C31 66 31 61 32 57 C34 61 34 66 35 70 Z" fill={teal}/>
        <path d="M36 67 C35 63 36 59 37 56 C38 60 38 64 37 66 Z" fill={teal} opacity="0.92"/>
      </g>
      {/* body */}
      <ellipse cx="36" cy="41" rx="14.5" ry="17" fill={accent}/>
      <ellipse cx="39" cy="45" rx="9" ry="12" fill={belly}/>
      {/* feet — little legs + gripping toes (read standing on the surfboard) */}
      <g stroke={foot} strokeWidth="2.1" strokeLinecap="round" fill="none">
        <path d="M33 54 L33 59"/>
        <path d="M40 54 L40 59"/>
        <path d="M33 59 l-2.6 1.8 M33 59 l0 2.3 M33 59 l2.6 1.8"/>
        <path d="M40 59 l-2.6 1.8 M40 59 l0 2.3 M40 59 l2.6 1.8"/>
      </g>
      {/* wing — teal flash, separate <g> pivoting at the shoulder so Pip flaps */}
      <g ref={wingRef}>
        <path d="M35 30 C23 32 19 46 27 56 C33 51 37 41 37 31 Z" fill={teal}/>
        <path d="M35 31 C26 34 22 45 27 54" stroke={tealDk} strokeWidth="1.5" fill="none" opacity="0.75"/>
        <path d="M33 37 C29 40 27 47 30 52" stroke={tealDk} strokeWidth="1.2" fill="none" opacity="0.6"/>
        <path d="M35 30 C30 31 26 35 24 40" stroke={tealLt} strokeWidth="1.3" fill="none" opacity="0.65"/>
      </g>
      {/* head group — gentle nod (crest, beak and eye move with it) */}
      <g ref={headRef}>
        {/* swept-back crest */}
        <path d="M42 12 C47 4 53 3 52 9 C50 13 46 14 42 13 Z" fill={accent}/>
        <path d="M39 11 C43 3 49 3 47 9 C46 13 42 13 39 12 Z" fill={accent} opacity="0.92"/>
        <path d="M37 12 C39 5 44 5 44 10 C43 13 40 13 37 13 Z" fill={accent} opacity="0.84"/>
        <circle cx="41" cy="21" r="12.5" fill={accent}/>
        {/* subtle cream cheek patch */}
        <ellipse cx="36" cy="24.5" rx="4.5" ry="3.2" fill={belly} opacity="0.7"/>
        {/* yellow hooked beak (faces left) */}
        <path d="M34 15 C28 13 22 16 19 20 C18 22.5 20 26 23 25.5 C23 23.5 25 21.5 29 21 C31 20.5 33 17 34 15 Z" fill={beak}/>
        <path d="M23 25.5 C25 27.5 30 27 31 23.5 C29 24.8 26 24.8 23.6 24.2 Z" fill={beakDk}/>
        <path d="M34 15 C28 13 22 16 19 20" stroke={beakDk} strokeWidth="0.7" fill="none" opacity="0.5"/>
        {/* eye — its own group so the blink can squash it shut */}
        <g ref={eyeRef}>
          <circle cx="44" cy={EYE_CY} r="5" fill="#fff"/>
          <circle cx="45" cy={EYE_CY} r="2.4" fill="#1A1815"/>
          <circle cx="46.3" cy={EYE_CY - 1.3} r="0.9" fill="#fff"/>
        </g>
      </g>
    </svg>
  );
}

// The wave + surfboard Pip rides on the Marés tab, stacked so it reads cleanly:
// bird ON the board, board ON the wave. The wave is one gradient swell (light
// surface → deep, fading to transparent at the bottom) with soft, curved sides
// and a thick foam crest + curl, so it NEVER shows the SVG's rectangular box.
// The board is a classic shortboard (pointed nose, rounded tail, cream deck,
// accent rails, centre stringer, a fin); its top edge meets Pip's feet — the
// negative marginTop tucks the deck right under them. Water stays fixed blues so
// it always reads as a wave; the board takes the live accent. Bright on dark.
function SurfScene({ accent, width = 132 }) {
  const deep = "#1F6E94";   // deep water
  const mid  = "#2E93BE";   // mid water
  const sea  = "#46B4D8";   // surface water
  const deck = "#FFF1CF";   // cream deck
  return (
    <svg width={width} height={90} viewBox="0 0 132 90" fill="none" aria-hidden="true"
      style={{ display: "block", marginTop: -18, overflow: "visible" }}>
      <defs>
        {/* vertical fade: bright at the crest, deep below, transparent at the
            very bottom so the water dissolves instead of ending in a hard edge */}
        <linearGradient id="pipSea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sea}/>
          <stop offset="0.45" stopColor={mid}/>
          <stop offset="0.78" stopColor={deep}/>
          <stop offset="1" stopColor={deep} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* ── wave: one gradient swell, soft points + faded bottom (no rectangle) ── */}
      <path d="M8 40 C24 31 44 28 66 28 C88 28 108 31 124 40 C122 64 98 80 66 80 C34 80 10 64 8 40 Z" fill="url(#pipSea)"/>
      {/* faint water texture (short arcs, never full rings) */}
      <path d="M30 50 C44 47 58 46 72 47" stroke="#fff" strokeWidth="1" fill="none" opacity="0.32"/>
      <path d="M54 60 C68 57 82 57 98 60" stroke="#fff" strokeWidth="1" fill="none" opacity="0.24"/>
      {/* thick foam crest just under the board */}
      <path d="M8 40 C24 31 44 28 66 28 C88 28 108 31 124 40" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.96"/>
      {/* curling lip on the left, where the nose points */}
      <path d="M8 40 C1 33 7 26 15 29 C10 31 10 36 15 40 C12 41 10 41 8 40 Z" fill="#fff" opacity="0.96"/>
      {/* spray flecks */}
      <circle cx="36" cy="31" r="1.5" fill="#fff" opacity="0.9"/>
      <circle cx="66" cy="27" r="1.4" fill="#fff" opacity="0.9"/>
      <circle cx="98" cy="31" r="1.5" fill="#fff" opacity="0.85"/>
      {/* shadow the board casts on the water */}
      <ellipse cx="66" cy="25" rx="44" ry="4.4" fill="#06283a" opacity="0.22"/>
      {/* ── surfboard: pointed nose (left), rounded tail (right); Pip stands here ── */}
      <path d="M8 17 C34 10 56 9 78 10 C100 11 116 13 124 18 C116 22 100 24 78 25 C56 25 34 24 8 17 Z" fill={accent}/>
      <path d="M20 16 C42 11.5 58 12 78 12.5 C98 13 110 14.5 117 17.5 C110 20.5 98 22 78 22.5 C58 23 42 21.5 20 16 Z" fill={deck}/>
      <line x1="13" y1="16.6" x2="119" y2="17.8" stroke={accent} strokeWidth="1" opacity="0.5"/>
      {/* fin under the tail */}
      <path d="M111 24 C113 30 116 32 119 31 C118 27 115 24 113 23 Z" fill={accent} opacity="0.9"/>
    </svg>
  );
}

function ParrotCompanion({ store, accentColor, tab }) {
  const enabled = store.state.prefs.parrot !== false;
  const [bubble, setBubble] = useState(null);   // { text, happy }
  const hideTimer = useRef(null);

  // Refs that always hold the *current* tab/bubble, so the long-lived idle
  // interval and the rAF loop (created once) never read a stale closure and
  // always act on the tab you're actually on. // PT: refs com o valor atual.
  const tabRef = useRef(tab);
  const bubbleRef = useRef(bubble);
  tabRef.current = tab;
  bubbleRef.current = bubble;

  // The current resting anchor (drives only the bubble's open direction). The
  // rAF loop reads this through a ref so it stays in sync without re-rendering.
  const [anchorKey, setAnchorKey] = useState(TAB_ANCHOR[tab] || "hoje");
  const anchorRef = useRef(anchorKey);
  anchorRef.current = anchorKey;

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
      recent.current.delete(recent.current.values().next().value);   // drop oldest
    }
  };

  // ── DOM refs the rAF loop writes transforms to (never React state per frame) ──
  const fieldRef  = useRef(null);   // full-frame overlay (measures available space)
  const moverRef  = useRef(null);   // screen position (fly-across)
  const bobRef    = useRef(null);   // vertical bob + hop (bird + surf scene)
  const tiltRef   = useRef(null);   // body lean / surf tilt
  const wingRef   = useRef(null);   // flapping wing
  const headRef   = useRef(null);   // head nod
  const tailRef   = useRef(null);   // tail sway
  const eyeRef    = useRef(null);   // blink
  const bubbleRefEl = useRef(null); // speech bubble (a tiny JS pop-in)

  // The whole motion model lives in one mutable object so the loop allocates
  // nothing per frame and survives re-renders.
  const m = useRef({
    x: 0, y: 0,                 // current screen position (px, frame-relative)
    flying: false, ft: 0,       // flight progress 0..1
    fromX: 0, fromY: 0, toX: 0, toY: 0, arc: 0, dir: 0,
    started: false,             // has the very first fly-in happened?
    hopUntil: 0,                // celebratory hop end timestamp
    nextBlink: 0,               // when to blink next
    blinkUntil: 0,              // blink end timestamp
    bubbleAt: 0,                // when the current bubble appeared (for the pop)
  }).current;

  // Frame size, refreshed on resize so anchors track rotation / window changes.
  const size = useRef({ w: 360, h: 720 }).current;

  // Anchor → pixel centre within the frame.
  const anchorPx = (key) => {
    const a = PARROT_ANCHORS[key] || PARROT_ANCHORS.hoje;
    return { x: a.fx * size.w, y: a.fy * size.h };
  };

  // Show a line. `anchor` is where to fly; `happy` triggers the celebratory hop.
  const say = (msg, { anchor, happy } = {}) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    remember(msg);
    if (anchor) setAnchorKey(anchor);
    setBubble({ text: pl(msg), happy: !!happy });
    m.bubbleAt = performance.now();
    if (happy) m.hopUntil = performance.now() + 760;
    hideTimer.current = setTimeout(() => setBubble(null), happy ? 7000 : 9000);
  };

  // An idle line, weighted toward the current tab's own pool, flying to the spot
  // the line is about. Reads the current tab through a ref (never stale).
  const sayIdle = () => {
    const av = recent.current;
    const r = Math.random();
    const curTab = tabRef.current;
    const here = TAB_ANCHOR[curTab] || "hoje";
    if (curTab === "hoje" && r < 0.5) return say(pickFresh(PARROT_HOJE, av), { anchor: here });
    if (curTab === "pauta" && r < 0.5) return say(pickFresh(PARROT_PAUTA, av), { anchor: here });
    if (curTab === "mares" && r < 0.5) return say(pickFresh(PARROT_MARES, av), { anchor: here });
    const general = [PARROT_TIPS, PARROT_DYK, PARROT_APP, PARROT_JOKES, PARROT_PHILO, PARROT_CULTURE];
    return say(pickFresh(pickOne(general), av), { anchor: here });
  };
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

  // ── The animation engine ── one rAF loop, all motion written to refs ──
  // Parks when the tab is hidden, throttles to ~30fps while idle, runs full-rate
  // during a flight or hop, and never runs while Pip is disabled or a sheet is
  // open (the component returns null then, so this effect is torn down).
  useEffect(() => {
    if (!enabled || sheetOpen) return;

    // Measure the frame and seed the position before the first paint so Pip
    // doesn't flash at 0,0. The first fly-in launches from off the right edge.
    const measure = () => {
      const el = fieldRef.current;
      if (el) { size.w = el.clientWidth || size.w; size.h = el.clientHeight || size.h; }
    };
    measure();
    if (!m.started) {
      const dest = anchorPx(anchorRef.current);
      m.x = size.w + 120; m.y = dest.y - size.h * 0.18;
      m.fromX = m.x; m.fromY = m.y; m.toX = dest.x; m.toY = dest.y;
      m.arc = 70; m.dir = -1; m.flying = true; m.ft = 0; m.started = true;
    }

    const ro = ("ResizeObserver" in window) ? new ResizeObserver(measure) : null;
    if (ro && fieldRef.current) ro.observe(fieldRef.current);

    let raf = 0, running = true, lastWork = 0, prev = performance.now();
    const FLIGHT_MS = 950;

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const surf = tabRef.current === "mares";
      const busy = m.flying || now < m.hopUntil;
      // Throttle to ~30fps while idle; full-rate when flying/hopping.
      if (!busy && now - lastWork < 32) return;
      const dt = Math.min(now - prev, 60); prev = now; lastWork = now;
      const t = now / 1000;

      // ── position: explicit interpolation while flying, soft easing at rest ──
      let px, py, arcOff = 0, leanFly = 0;
      if (m.flying) {
        m.ft += dt / FLIGHT_MS;
        if (m.ft >= 1) { m.ft = 1; m.flying = false; }
        const e = easeInOutCubic(m.ft);
        px = lerp(m.fromX, m.toX, e);
        py = lerp(m.fromY, m.toY, e);
        arcOff = -Math.sin(Math.PI * m.ft) * m.arc;          // parabolic hop up
        leanFly = m.dir * 16 * Math.sin(Math.PI * m.ft);     // lean into travel
        m.x = px; m.y = py;
      } else {
        const dest = anchorPx(anchorRef.current);
        m.x = lerp(m.x, dest.x, 0.12);                        // ease + track resize
        m.y = lerp(m.y, dest.y, 0.12);
        px = m.x; py = m.y;
      }

      // ── bob + hop ──
      let bob, hop = 0;
      if (surf && !m.flying) bob = Math.sin(t * 2.1) * 4.5;   // ride the swell
      else if (!m.flying)    bob = Math.sin(t * 2.0) * 3.2;   // gentle float
      else                   bob = 0;
      if (now < m.hopUntil) {
        const hp = 1 - (m.hopUntil - now) / 760;
        hop = -Math.sin(Math.PI * hp) * 16;
      }

      // ── lean / tilt ──
      let lean;
      if (m.flying)      lean = leanFly;
      else if (now < m.hopUntil) lean = Math.sin((now - (m.hopUntil - 760)) / 60) * 8;
      else if (surf)     lean = Math.sin(t * 1.7) * 7;        // carve on the wave
      else               lean = Math.sin(t * 1.4) * 2.5;      // idle sway

      // ── wing flap ── faster + wider while flying or hopping ──
      let wing;
      if (m.flying || now < m.hopUntil) wing = Math.sin(t * 22) * 34;
      else if (surf)                     wing = -2 + Math.sin(t * 4.2) * 7;
      else                               wing = 4 + Math.sin(t * 3.0) * 10;

      // ── head nod + tail sway ──
      const head = Math.sin(t * 1.6 + 0.5) * 2.4;
      const tailA = Math.sin(t * 1.9) * 5;

      // ── blink ── brief eye squash on a randomised cadence ──
      if (!m.nextBlink) m.nextBlink = now + 2500 + Math.random() * 3000;
      if (now > m.nextBlink && !m.blinkUntil) { m.blinkUntil = now + 130; }
      let eyeSy = 1;
      if (m.blinkUntil) {
        if (now > m.blinkUntil) { m.blinkUntil = 0; m.nextBlink = now + 2500 + Math.random() * 3500; }
        else { const bp = 1 - (m.blinkUntil - now) / 130; eyeSy = 1 - Math.sin(Math.PI * bp) * 0.9; }
      }

      // ── write transforms (HTML via style, SVG parts via the transform attr) ──
      const mover = moverRef.current;
      if (mover) {
        mover.style.transform =
          "translate(" + px + "px," + (py + arcOff) + "px) translate(-50%,-50%)";
        // Reveal once positioned (it starts at opacity 0 to avoid a one-frame
        // flash at the corner before the first transform is written).
        if (mover.style.opacity !== "1") mover.style.opacity = "1";
      }
      if (bobRef.current)  bobRef.current.style.transform  = "translateY(" + (bob + hop) + "px)";
      if (tiltRef.current) tiltRef.current.style.transform = "rotate(" + lean + "deg)";
      if (wingRef.current) wingRef.current.setAttribute("transform",
        "rotate(" + wing + " " + WING_PIVOT[0] + " " + WING_PIVOT[1] + ")");
      if (headRef.current) headRef.current.setAttribute("transform",
        "rotate(" + head + " " + HEAD_PIVOT[0] + " " + HEAD_PIVOT[1] + ")");
      if (tailRef.current) tailRef.current.setAttribute("transform",
        "rotate(" + tailA + " " + TAIL_PIVOT[0] + " " + TAIL_PIVOT[1] + ")");
      if (eyeRef.current) eyeRef.current.setAttribute("transform",
        "matrix(1 0 0 " + eyeSy.toFixed(3) + " 0 " + (EYE_CY * (1 - eyeSy)).toFixed(2) + ")");

      // ── speech bubble: a tiny JS pop-in (no CSS, so it survives reduce-motion) ──
      if (bubbleRefEl.current) {
        const bp = Math.min(1, (now - m.bubbleAt) / 200);
        const s = 0.85 + 0.15 * easeInOutCubic(bp);
        bubbleRefEl.current.style.transform = "scale(" + s.toFixed(3) + ")";
        bubbleRefEl.current.style.opacity = bp.toFixed(3);
      }
    };

    raf = requestAnimationFrame(frame);

    // Park entirely while the tab/app is hidden; resume cleanly when back.
    const onVis = () => {
      if (document.hidden) { running = false; cancelAnimationFrame(raf); }
      else if (!running) { running = true; prev = performance.now(); lastWork = 0; raf = requestAnimationFrame(frame); }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      if (ro) ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, sheetOpen]);

  // Fly to the tab's resting spot when the tab changes (and now and then drop a
  // tab-specific line so each tab feels different).
  const firstTab = useRef(true);
  useEffect(() => {
    if (!enabled) return;
    const dest = TAB_ANCHOR[tab] || "hoje";
    const prevAnchor = anchorRef.current;
    setAnchorKey(dest);
    // Drop any lingering line the moment the tab changes, so a Marés line can't
    // hang over onto Pauta (and vice-versa). // PT: limpa o balão ao trocar.
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setBubble(null);
    if (firstTab.current) { firstTab.current = false; return; }
    // Launch a real flight: from where he is now to the new anchor, arcing up
    // and leaning into the direction of travel. The loop interpolates it.
    const to = anchorPx(dest);
    m.fromX = m.x; m.fromY = m.y; m.toX = to.x; m.toY = to.y;
    m.dir = (to.x >= m.fromX) ? 1 : -1;
    m.arc = 80; m.ft = 0; m.flying = true;
    if (Math.random() < 0.4) {
      const map = { hoje: PARROT_HOJE, pauta: PARROT_PAUTA, mares: PARROT_MARES };
      const pool = map[tab];
      if (pool) {
        const tm = setTimeout(() => say(pickFresh(pool, recent.current), { anchor: dest }), 800);
        return () => clearTimeout(tm);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const todayKey = dayKeyOf(Date.now());

  // ── Completion reactions ── (each compares a live count to its previous value)
  const doneHabits = (store.state.habits || []).filter(h => h.log && h.log[todayKey]).length;
  const prevHabits = useRef(doneHabits);
  useEffect(() => {
    if (enabled && doneHabits > prevHabits.current) say(pickFresh(PARROT_REACT_HABIT, recent.current), { anchor: TAB_ANCHOR[tab], happy: true });
    prevHabits.current = doneHabits;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneHabits]);

  const activeId = store.activeBlock ? store.activeBlock.id : null;
  const prevActive = useRef(activeId);
  useEffect(() => {
    if (enabled && activeId && activeId !== prevActive.current) say(pickFresh(PARROT_REACT_BLOCK_START, recent.current), { anchor: TAB_ANCHOR[tab] });
    prevActive.current = activeId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const doneBlocks = (store.state.blocks || []).filter(b =>
    b.status === "done" && b.sessions && b.sessions.some(s => s.endedAt && dayKeyOf(s.endedAt) === todayKey)
  ).length;
  const prevDoneBlocks = useRef(doneBlocks);
  useEffect(() => {
    if (enabled && doneBlocks > prevDoneBlocks.current) say(pickFresh(PARROT_REACT_BLOCK_DONE, recent.current), { anchor: TAB_ANCHOR[tab], happy: true });
    prevDoneBlocks.current = doneBlocks;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneBlocks]);

  const doneIntentions = ((store.state.today && store.state.today.intentions) || []).filter(i => i.done).length;
  const prevIntentions = useRef(doneIntentions);
  useEffect(() => {
    if (enabled && doneIntentions > prevIntentions.current) say(pickFresh(PARROT_REACT_INTENTION, recent.current), { anchor: TAB_ANCHOR[tab], happy: true });
    prevIntentions.current = doneIntentions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneIntentions]);

  const hasReflection = !!(store.state.today && store.state.today.reflection && store.state.today.reflection.trim());
  const prevReflection = useRef(hasReflection);
  useEffect(() => {
    if (enabled && hasReflection && !prevReflection.current) say(pickFresh(PARROT_REACT_REFLECTION, recent.current), { anchor: TAB_ANCHOR[tab], happy: true });
    prevReflection.current = hasReflection;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasReflection]);

  const doneGoals = (store.state.goals || []).filter(g => g.done).length;
  const prevGoals = useRef(doneGoals);
  useEffect(() => {
    if (enabled && doneGoals > prevGoals.current) say(pickFresh(PARROT_REACT_GOAL, recent.current), { anchor: TAB_ANCHOR[tab], happy: true });
    prevGoals.current = doneGoals;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneGoals]);

  if (!enabled || sheetOpen) return null;   // stay out of the way of open sheets

  const a = PARROT_ANCHORS[anchorKey] || PARROT_ANCHORS.hoje;
  const surf = !!a.surf;
  const birdSize = surf ? 52 : 60;

  // The bubble sits above the bird and opens toward the side with room. It needs
  // an explicit width or it shrinks-to-fit the tiny bird wrapper, collapsing the
  // text to one word per line. // PT: largura fixa para o balão embrulhar bem.
  const bubblePos = {
    position: "absolute",
    width: "min(15rem, 72vw)",
    ...(a.vert === "top" ? { top: "100%", marginTop: 10 } : { bottom: "100%", marginBottom: 10 }),
    ...(a.side === "left" ? { left: 0 }
      : a.side === "center" ? { left: "50%", marginLeft: "calc(min(15rem,72vw) / -2)" }
      : { right: 0 }),
  };
  // A little tail pointing back at Pip.
  const tailStyle = {
    position: "absolute", width: 12, height: 12, background: "var(--surface-dark)",
    transform: "rotate(45deg)", borderRadius: 2,
    ...(a.vert === "top" ? { top: -5 } : { bottom: -5 }),
    ...(a.side === "left" ? { left: 20 }
      : a.side === "center" ? { left: "50%", marginLeft: -6 }
      : { right: 20 }),
  };

  return (
    <div ref={fieldRef} style={{
      position: "absolute", inset: 0, zIndex: 40, pointerEvents: "none",
      WebkitUserSelect: "none", userSelect: "none",
      WebkitTouchCallout: "none", WebkitTapHighlightColor: "transparent",
    }}>
      {/* Mover: the loop writes its translate (the fly-across). Starts at
          opacity 0 so there's no one-frame flash at the corner before the first
          transform lands; the loop flips it to 1 once positioned. */}
      <div ref={moverRef} style={{ position: "absolute", left: 0, top: 0, opacity: 0, willChange: "transform" }}>
        {/* Speech bubble — deliberately OUTSIDE the bob layer: only the bird
            should bob. If the bubble bobbed too, the text translated every frame
            and read as jitter. It still rides the fly-across (it's inside
            moverRef) and pops in once via the loop; at rest it holds still. */}
        {bubble && (
          <div ref={bubbleRefEl} style={{ ...bubblePos, opacity: 0, transformOrigin: a.side === "left" ? "left bottom" : a.side === "center" ? "center bottom" : "right bottom" }}>
            <div style={{
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

        {/* Bob layer: vertical float + celebratory hop — ONLY the bird and the
            surf scene live here, so they rise and fall together. */}
        <div ref={bobRef} style={{ position: "relative", willChange: "transform" }}>
          {/* The bird itself (tappable) over the optional surf scene. The webkit
              resets kill the Android WebView tap-highlight / selection box that
              otherwise flashed a blue square when you tapped Pip. */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <button onClick={sayIdle} className="tap" aria-label={tr("papagaio")} style={{
              pointerEvents: "auto", border: "none", background: "transparent", padding: 0, cursor: "pointer",
              filter: "drop-shadow(0 5px 9px rgba(0,0,0,0.28))", lineHeight: 0, touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent", WebkitTouchCallout: "none",
              WebkitUserSelect: "none", userSelect: "none",
            }}>
              <div ref={tiltRef} style={{ willChange: "transform" }}>
                <ParrotSvg accent={accentColor} size={birdSize}
                  wingRef={wingRef} headRef={headRef} tailRef={tailRef} eyeRef={eyeRef}/>
              </div>
            </button>
            {surf && <SurfScene accent={accentColor}/>}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ParrotCompanion });

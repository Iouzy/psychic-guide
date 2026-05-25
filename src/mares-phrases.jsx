// Pauta — Marés philosophical phrases + small UI atoms for the maritime metaphor.

// ─── Phrase library ────────────────────────────────────────
// Each entry is { kind, lines } where kind is the state it applies to.
// Use pickPhrase(kind, seed) to deterministically pick one (so it doesn't change every render).
// Stored in Portuguese (the source language); callers translate the picked line with
// tr() at render time so it follows live language switches.
const MARE_PHRASES = {
  // Hero phrase for empty state / first open
  intro: [
    "As marés têm história. Sobem e descem ao longo do ano.",
    "Toda onda começa pequena.",
    "Pés na água. O resto vem com o tempo.",
  ],
  // Streak growing recently
  ascending: [
    "Uma grande maré só sobe.",
    "A água ganha velocidade quando encontra ritmo.",
    "Toda onda começa pequena.",
  ],
  // Long stable streak
  constant: [
    "Constância vence intensidade.",
    "A maré não corre. Persiste.",
    "O que se faz todos os dias deixa de ser esforço.",
  ],
  // Just used a respiro
  respiro: [
    "A maré também recua. É assim que ela respira.",
    "Um respiro honesto vale uma semana de mentira.",
    "Está bem. A maré continua.",
    "Recuar não é falhar. É respirar.",
  ],
  // Streak broken (no done or respiro yesterday after a run)
  broken: [
    "O oceano também esquece. Recomeça.",
    "Cada onda que quebra prepara a próxima.",
    "Falhar é humano. Voltar é maré.",
  ],
  // Just-started habits dominate the view
  beginning: [
    "Pés na água. O resto vem com o tempo.",
    "As marés mais profundas começam discretas.",
    "Toda onda começa pequena.",
  ],
  // Habits in good shape but nothing dramatic
  steady: [
    "Constância vence intensidade.",
    "A maré não corre. Persiste.",
  ],
  // Tier-up celebratory messages
  tierUp: {
    "Onda": "A primeira agitação. Continue.",
    "Maré baixa": "A água começou a subir.",
    "Maré média": "A sua maré assentou. Bom ritmo.",
    "Maré alta": "A sua maré é alta agora.",
    "Maré viva": "Maré viva — a mais forte do mês natural.",
    "Maré anual": "Quase um ano. Isto já não é tentativa.",
    "Oceano": "Já não é uma maré. É um oceano. O hábito é parte de si.",
  },
  // Habit detail header phrases
  detailHeader: [
    "Cada quadrado é um dia em que escolheu — ou foi escolhido pelo dia.",
    "Aqui mora a história desta maré. As suas alturas, as suas calmarias, os seus respiros.",
    "Olhe para o padrão. Está lá uma pessoa que se conhece a si própria.",
  ],
};

// Deterministic pick: cycles by date so the phrase changes each day, not each render.
function pickPhrase(kind, seedOffset = 0) {
  const list = MARE_PHRASES[kind];
  if (!list || list.length === 0) return "";
  const dayOfYear = Math.floor(Date.now() / 86400000);
  return list[(dayOfYear + seedOffset) % list.length];
}

// Pick a phrase for the home footer based on the dominant state of the habits today.
function pickHomePhrase(habits, todayTs = Date.now()) {
  if (!habits || habits.length === 0) return pickPhrase("intro");

  const todayKey = dayKeyOf(todayTs);
  let hadRespiroToday = false;
  let hadAscending = false;
  let allBeginning = true;
  let anyConstant = false;

  for (const h of habits) {
    if (h.respiros && h.respiros[todayKey]) hadRespiroToday = true;
    const streak = habitCurrentStreak(h, todayTs);
    if (streak.days >= 30) anyConstant = true;
    if (streak.days >= 5 && streak.days < 30) hadAscending = true;
    const created = habitCreatedKey(h);
    const obs = daysBetween(created, todayKey);
    if (obs > HABIT_MATURITY_DAYS) allBeginning = false;
  }

  if (hadRespiroToday) return pickPhrase("respiro");
  if (allBeginning) return pickPhrase("beginning");
  if (anyConstant) return pickPhrase("constant");
  if (hadAscending) return pickPhrase("ascending");
  return pickPhrase("steady");
}

// ─── Tier badge component ──────────────────────────────────
// Pequeno selo "Maré alta · 67 d · 2 respiros". Usado na home e no detalhe.
function TideTierBadge({ streak, accentColor, layout = "stack" }) {
  if (!streak || streak.days <= 0) return null;
  const tier = tideTier(streak.days);
  if (!tier) return null;

  if (layout === "inline") {
    return (
      <div style={{
        display: "inline-flex", alignItems: "baseline", gap: 6,
        fontFamily: "var(--mono)", fontSize: 10,
      }}>
        <span style={{ color: accentColor, fontWeight: 600, letterSpacing: "0.02em" }}>
          {tier.name}
        </span>
        <span style={{ color: "var(--ink-3)" }}>·</span>
        <span style={{ color: "var(--ink-2)" }}>{streak.days}d</span>
        {streak.respiros > 0 && (
          <>
            <span style={{ color: "var(--ink-3)" }}>·</span>
            <span style={{ color: "var(--ink-3)", fontStyle: "italic" }}>
              {streak.respiros} {streak.respiros === 1 ? tr("respiro") : tr("respiros")}
            </span>
          </>
        )}
      </div>
    );
  }

  // Stacked layout: tier name on top, count below
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{
        fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.06em",
        color: accentColor, fontWeight: 600, textTransform: "uppercase",
      }}>
        {tier.name}
      </div>
      <div style={{
        fontFamily: "var(--mono)", fontSize: 10,
        color: "var(--ink-2)", marginTop: 2,
      }}>
        {streak.days} d
        {streak.respiros > 0 && (
          <span style={{ color: "var(--ink-3)" }}> · {streak.respiros}<span style={{ fontSize: 8 }}> {tr("resp.")}</span></span>
        )}
      </div>
    </div>
  );
}

// Recurrence chip — small badge showing if habit is forever / period / month
function RecurrenceChip({ habit, accentColor, todayTs = Date.now() }) {
  if (!habit || habit.recurrence === "forever") return null;
  if (habit.recurrence === "month") {
    return (
      <span style={{
        fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.08em",
        textTransform: "uppercase", color: "var(--ink-3)",
        padding: "2px 6px", borderRadius: 4,
        border: "1px solid var(--rule)",
      }}>
        {tr("só este mês")}
      </span>
    );
  }
  if (habit.recurrence === "period") {
    const created = habit.createdAt;
    const end = habit.endsAt;
    if (!end) return null;
    const total = Math.round((end - created) / 86400000) + 1;
    const elapsed = Math.min(total, Math.round((todayTs - created) / 86400000) + 1);
    const finished = todayTs > end;
    return (
      <span style={{
        fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: finished ? "var(--ink-3)" : accentColor,
        padding: "2px 6px", borderRadius: 4,
        border: `1px solid ${finished ? "var(--rule)" : accentColor + "55"}`,
      }}>
        {finished ? tr("concluída") : trf("dia {elapsed}/{total}", { elapsed, total })}
      </span>
    );
  }
  return null;
}

Object.assign(window, {
  MARE_PHRASES, pickPhrase, pickHomePhrase,
  TideTierBadge, RecurrenceChip,
});

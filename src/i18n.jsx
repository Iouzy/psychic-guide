// Pauta — i18n
// Portuguese (pt-PT) is the SOURCE language: every string in the codebase is
// written in Portuguese and used directly as the lookup key. English is layered
// on top via the I18N_EN dictionary below.
//
//   tr("Definições")              → "Settings" (en) / "Definições" (pt)
//   trf("{n} blocos", { n: 3 })   → "3 blocks"  / "3 blocos"
//
// Unknown keys fall back to the Portuguese text unchanged, so a missing
// translation degrades gracefully (shows PT) instead of breaking.
//
// Loaded FIRST (before every other script) so `tr`/`trf` exist globally.

// Pick the initial language: a saved choice wins, otherwise follow the device.
(function () {
  var saved = null;
  try { saved = localStorage.getItem("pauta.lang"); } catch (e) {}
  if (saved === "en" || saved === "pt") {
    window.PAUTA_LANG = saved;
  } else {
    var nav = (navigator.language || navigator.userLanguage || "pt");
    window.PAUTA_LANG = /^en/i.test(nav) ? "en" : "pt";
  }
})();

// key = exact Portuguese source string · value = English translation.
// Interpolated strings use {name} placeholders resolved by trf(key, vars).
const I18N_EN = {
  // ─── Navigation / tabs ───
  "Hoje": "Today",
  "Pauta": "Pauta",
  "Marés": "Tides",

  // ─── Settings shell (Definições) ───
  "Definições": "Settings",
  "Idioma": "Language",
  "Português": "Português",
  "Inglês": "English",
  "Análise": "Analysis",
  "Preferências": "Preferences",
  "Lembretes": "Reminders",
  "Backup": "Backup",
  "Instalar": "Install",
  "Aplicação": "Application",
  "Tema": "Theme",
  "Auto": "Auto",
  "Claro": "Light",
  "Escuro": "Dark",
  "Vibração": "Haptics",
  "Pequeno toque ao concluir.": "A small tap on completion.",
  "Notificações": "Notifications",
  "Avisos locais enquanto a app está aberta.": "Local alerts while the app is open.",
  "Hábitos pendentes": "Pending habits",
  "Reflexão noturna": "Nightly reflection",
  "Sem servidor: os avisos só chegam com a app aberta no telemóvel ou no browser.":
    "No server: alerts only arrive with the app open on your phone or browser.",
  "Este dispositivo não suporta notificações.": "This device does not support notifications.",
  "Permissão de notificações negada.": "Notification permission denied.",
  "Revisão semanal": "Weekly review",
  "Foco, hábitos e padrões dos últimos 7 dias.": "Focus, habits and patterns from the last 7 days.",
  "Como funcionam as marés": "How the tides work",
  "O que significam os tiers, de Onda a Oceano.": "What the tiers mean, from Wave to Ocean.",
  "Exportar dados": "Export data",
  "Transfere um ficheiro .json com tudo.": "Downloads a .json file with everything.",
  "Importar dados": "Import data",
  "Restaura a partir de um ficheiro .json.": "Restores from a .json file.",
  "Backup transferido.": "Backup downloaded.",
  "App instalada.": "App installed.",
  "Backup importado com sucesso.": "Backup imported successfully.",
  "Não foi possível ler o ficheiro.": "Could not read the file.",
  "Importar este backup substitui todos os dados atuais. Continuar?":
    "Importing this backup replaces all current data. Continue?",
  "Instalar app": "Install app",
  "Adiciona o Pauta ao ecrã inicial.": "Adds Pauta to your home screen.",
  "Recarregar exemplo": "Reload sample data",
  "Substitui tudo por dados de demonstração.": "Replaces everything with demo data.",
  "Apagar tudo": "Erase everything",
  "Remove permanentemente todos os dados.": "Permanently removes all data.",

  // ─── Tweaks panel ───
  "Cor de destaque": "Accent colour",
  "Acento": "Accent",
  "Cronómetro visível": "Timer visible",
  "Dados": "Data",
};

// === I18N_EN_BULK_BEGIN === (entries collected from the rest of the app)
const I18N_EN_BULK = {
};
// === I18N_EN_BULK_END ===

Object.assign(I18N_EN, I18N_EN_BULK);

function tr(pt) {
  if (window.PAUTA_LANG === "en") {
    var v = I18N_EN[pt];
    return v === undefined ? pt : v;
  }
  return pt;
}

// Formatted translation: resolves {name} placeholders from `vars`.
function trf(pt, vars) {
  var s = tr(pt);
  if (vars) {
    for (var k in vars) {
      if (Object.prototype.hasOwnProperty.call(vars, k)) {
        s = s.split("{" + k + "}").join(String(vars[k]));
      }
    }
  }
  return s;
}

window.tr = tr;
window.trf = trf;

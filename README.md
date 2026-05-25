# Pauta

> Intenções, blocos de foco e hábitos — a sua pauta diária.

🌐 **English** · [Português](#pauta--português)

**Pauta** is an offline-first daily-planning app: set your intentions for the
day, run focus blocks with a built-in timer, and keep honest habit streaks. It
runs as an installable Progressive Web App (PWA) and ships as a self-contained
native **Android** build via [Capacitor](https://capacitorjs.com/).

The interface is available in **English and Portuguese** (pt-PT / pt-BR): it
follows your device language on first launch and can be switched any time in
*Settings → Preferences → Language*. Everything is stored locally on your
device — there is no account, no server, and no network dependency.

---

## Table of contents

- [Highlights](#highlights)
- [The three tabs](#the-three-tabs)
- [Data, privacy & backup](#data-privacy--backup)
- [Settings & extras](#settings--extras)
- [Architecture](#architecture)
- [Project layout](#project-layout)
- [Getting started](#getting-started)
  - [Run the web app locally](#run-the-web-app-locally)
  - [Build the web bundle](#build-the-web-bundle)
  - [Build the Android app](#build-the-android-app)
- [Continuous integration](#continuous-integration)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Browser & platform support](#browser--platform-support)
- [License](#license)

---

## Highlights

- **Fully offline & self-contained.** React, ReactDOM and Babel are vendored
  locally — no CDN, no analytics, no backend. The service worker precaches the
  app shell so it works with zero connectivity.
- **Installable PWA.** Add it to your home screen on Android or iOS, or install
  the generated `.apk` directly.
- **Native Android build.** Capacitor wraps the web app into an installable
  Android package; a GitHub Actions workflow builds the APK on every push.
- **Local-only data.** All state lives in `localStorage`. Export and import a
  full JSON backup whenever you like.
- **Light & dark themes.** Auto-follows the OS, or pick a fixed theme. A warm
  "paper & ink" design system with a configurable accent colour.
- **Local reminders.** Optional notifications for pending habits and the nightly
  reflection (delivered while the app is open — no push server).
- **Bilingual (English / Portuguese).** Auto-detects your device language and
  offers an in-app toggle. Portuguese is the source language, with English
  layered on top; untranslated strings fall back to Portuguese gracefully.

---

## The three tabs

Pauta is organised into three tabs, navigable by tap, swipe, or keyboard.

### 1. Today (Hoje)
Your day at a glance. Capture the day's **intentions**, check them off, and close
the day with a **nightly reflection**. Intentions can be promoted straight into a
focus block on the Pauta tab.

### 2. Pauta (Focus blocks)
A focus timer with a full block lifecycle. Start a block (optionally tied to an
intention or project), pause and resume it, jot session notes, and conclude it.
Completed and in-progress blocks appear on a filterable timeline, each block
tracking its individual work sessions and elapsed time.

### 3. Tides (Marés)
A habit tracker built around a maritime metaphor. Habits are tracked on a
month-by-month calendar with:

- **Streak tiers** that grow with consistency — from *Wave* (Onda) up to *Ocean*
  (Oceano).
- **Breaths** (*Respiros*) — honest, guilt-free breaks that don't shatter a streak.
- **Flexible recurrence** — permanent habits, fixed-period habits, or single-month
  habits.
- **Heatmaps & trends** — a per-habit detail view plus a 12-month "wave" trend.

---

## Data, privacy & backup

- **Storage:** everything persists in the browser's `localStorage` under the key
  `pauta.v4`. Nothing leaves your device.
- **No tracking:** there are no analytics, telemetry, or third-party requests.
- **Backup:** *Settings → Backup → Export data* downloads a `.json` file with
  all of your data. *Import data* restores from that file (replacing current
  data after a confirmation prompt).
- **Reset:** *Reload sample data* repopulates demo data; *Erase everything*
  permanently clears everything.

---

## Settings & extras

Open **Settings** from the status-bar menu. It includes:

- **Analysis** — *Weekly review* (a 7-day review of focus, habits and patterns,
  including best-hour and correlation insights) and a guide to how the Tides tiers
  work.
- **Preferences** — language (Português / English), theme (Auto / Light / Dark)
  and haptic feedback.
- **Reminders** — enable local notifications and set times for pending-habit and
  nightly-reflection reminders.
- **Backup** — export / import JSON.
- **Install** — install prompt (Android) or platform-specific instructions (iOS).
- **Application** — reseed demo data or wipe everything.

A built-in **Tweaks panel** exposes accent colour, timer visibility and layout
density for quick experimentation, and a one-time **onboarding** overlay greets
first-time users.

---

## Architecture

Pauta deliberately avoids a JavaScript build step for application code. JSX is
transpiled **in the browser** by Babel Standalone, and React is loaded from
vendored files. This keeps the project dependency-light and trivially portable —
the same files run as a plain website, a PWA, and inside the Android WebView.

- **UI:** React (function components + hooks), styled with inline styles and CSS
  custom properties (the design tokens defined in `index.html`).
- **State:** a hand-rolled store (`src/store.jsx`, schema `pauta.v4`) backed by
  `localStorage`.
- **i18n:** `src/i18n.jsx` exposes `tr()` / `trf()` helpers loaded before every
  other script. Portuguese is the source language (PT strings double as lookup
  keys); English is layered on via a dictionary, and missing keys fall back to
  the Portuguese text unchanged.
- **Offline:** `service-worker.js` precaches the app shell (`CACHE_VERSION` is
  bumped whenever precached assets change).
- **Packaging:** `scripts/build-web.mjs` copies `index.html`, `manifest.json`,
  `icons/`, `src/` and `vendor/` into `www/`, which Capacitor bundles into the
  native app (`webDir: "www"`, `appId: "com.pauta.app"`).

---

## Project layout

```
.
├── index.html              App shell, design tokens, script loading, PWA + SW bootstrap
├── manifest.json           PWA manifest
├── service-worker.js       Offline app-shell cache
├── capacitor.config.json   Capacitor config (appId, appName, webDir)
├── package.json            Scripts and Capacitor dependencies
├── debug.keystore          Stable debug signing key (so app updates keep data)
├── icons/                  App / PWA icons
├── vendor/                 Local React, ReactDOM and Babel (no CDN)
├── scripts/
│   └── build-web.mjs       Assembles the web bundle into ./www
├── tools/
│   └── gen-icons.mjs       Icon generation helper
├── src/
│   ├── app.jsx             App root: tabs, settings sheet, shortcuts, swipe nav
│   ├── store.jsx           localStorage-backed state store (v4)
│   ├── i18n.jsx            tr()/trf() helpers + English dictionary (PT source)
│   ├── ui-primitives.jsx   Shared primitives (Sheet, TabBar, icons, inputs…)
│   ├── sub-components.jsx   Block cards, timeline, filter chips, sheets
│   ├── sheets.jsx          Bottom-modal sheets (start / pause / conclude…)
│   ├── tab-hoje.jsx        "Hoje" tab — intentions + reflection
│   ├── tab-pauta.jsx       "Pauta" tab — active block + timeline
│   ├── tab-mares.jsx       "Marés" tab — habit tracker
│   ├── mares-phrases.jsx   Maritime-metaphor phrase library
│   ├── mares-sheets.jsx    Marés trend + habit-detail sheets
│   ├── extras.jsx          Onboarding, insights, tier guide, reminders, haptics
│   └── tweaks-panel.jsx    Reusable tweaks shell + form controls
└── .github/workflows/
    └── android.yml         CI: build APK and publish a rolling "latest" release
```

---

## Getting started

**Prerequisites:** [Node.js](https://nodejs.org/) 20+. Building the Android app
additionally requires a JDK 17 and the Android SDK (handled automatically in CI).

```bash
npm install
```

### Run the web app locally

Because everything is static and self-contained, any static file server works.
For example:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open the served URL (e.g. `http://localhost:8000`). The app transpiles its
JSX in the browser, so no build step is required for development.

### Build the web bundle

Assemble the deployable bundle into `./www`:

```bash
npm run build:web
```

This is also what you deploy to any static host (GitHub Pages, Netlify, etc.).

### Build the Android app

Assemble the web bundle and sync it into the Android project:

```bash
npm run sync          # runs build:web, then `npx cap sync android`
npx cap add android   # first time only, to create the android/ project
```

From there, open `android/` in Android Studio or build from the command line
(`cd android && ./gradlew assembleDebug`). The `android/`, `www/` and `*.apk`
artifacts are git-ignored.

---

## Continuous integration

`.github/workflows/android.yml` builds an installable `.apk` on every push (and
on manual dispatch) and publishes it to a rolling **`latest`** GitHub Release, so
you never need a local Android toolchain. The committed `debug.keystore` keeps the
signing key stable across builds, so reinstalling an update preserves your data.

---

## Keyboard shortcuts

When the app is focused (and you're not typing in a field):

| Key | Action            |
|-----|-------------------|
| `1` | Today tab         |
| `2` | Pauta tab         |
| `3` | Tides tab         |
| `g` | Open Settings     |
| `i` | Open Weekly review (insights) |
| `?` | Open the Tides tier guide |

On mobile, swipe left/right to move between tabs.

---

## Browser & platform support

Targets modern evergreen browsers (Chromium, Firefox, Safari) and Android
WebView. PWA install is available on Chromium-based browsers and via *Add to Home
Screen* on iOS Safari. Local notifications and haptics degrade gracefully where
unsupported.

---

## License

This project is licensed under
[Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/).

You are free to use, share, and adapt the work **for non-commercial purposes**,
with attribution. **Commercial use is not permitted.**

---
---

# Pauta — Português

> Intenções, blocos de foco e hábitos — a sua pauta diária.

[English](#pauta) · 🌐 **Português**

A **Pauta** é uma aplicação de planeamento diário que funciona offline: defina as
suas intenções para o dia, faça blocos de foco com um cronómetro integrado e
mantenha sequências de hábitos honestas. Funciona como uma Progressive Web App
(PWA) instalável e é distribuída como uma compilação nativa **Android**
autónoma, através do [Capacitor](https://capacitorjs.com/).

A interface está em português. Tudo é guardado localmente no seu dispositivo —
não há conta, nem servidor, nem qualquer dependência de rede.

## Índice

- [Destaques](#destaques)
- [Os três separadores](#os-três-separadores)
- [Dados, privacidade e cópia de segurança](#dados-privacidade-e-cópia-de-segurança)
- [Definições e extras](#definições-e-extras)
- [Arquitetura](#arquitetura)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Como começar](#como-começar)
  - [Executar a app web localmente](#executar-a-app-web-localmente)
  - [Compilar o pacote web](#compilar-o-pacote-web)
  - [Compilar a app Android](#compilar-a-app-android)
- [Integração contínua](#integração-contínua)
- [Atalhos de teclado](#atalhos-de-teclado)
- [Compatibilidade de browsers e plataformas](#compatibilidade-de-browsers-e-plataformas)
- [Licença](#licença)

## Destaques

- **Totalmente offline e autónoma.** O React, o ReactDOM e o Babel estão
  incluídos localmente — sem CDN, sem analítica, sem servidor. O service worker
  guarda em cache a estrutura da app, por isso funciona sem qualquer ligação.
- **PWA instalável.** Adicione-a ao ecrã principal no Android ou iOS, ou instale
  diretamente o `.apk` gerado.
- **Compilação nativa Android.** O Capacitor empacota a app web num pacote
  Android instalável; um fluxo de trabalho do GitHub Actions compila o APK a cada
  envio (push).
- **Dados apenas locais.** Todo o estado vive no `localStorage`. Exporte e importe
  uma cópia de segurança completa em JSON quando quiser.
- **Temas claro e escuro.** Segue automaticamente o sistema operativo, ou escolha
  um tema fixo. Um design "papel e tinta" quente, com uma cor de destaque
  configurável.
- **Lembretes locais.** Notificações opcionais para hábitos pendentes e para a
  reflexão noturna (entregues enquanto a app está aberta — sem servidor de push).

## Os três separadores

A Pauta está organizada em três separadores, navegáveis por toque, deslize ou
teclado.

### 1. Hoje
O seu dia num relance. Registe as **intenções** do dia, marque-as como concluídas
e encerre o dia com uma **reflexão noturna**. As intenções podem ser promovidas
diretamente para um bloco de foco no separador Pauta.

### 2. Pauta (Blocos de foco)
Um cronómetro de foco com um ciclo de vida completo do bloco. Inicie um bloco
(opcionalmente associado a uma intenção ou projeto), pause-o e retome-o, registe
notas da sessão e conclua-o. Os blocos concluídos e em curso aparecem numa linha
temporal com filtros, e cada bloco regista as suas sessões de trabalho
individuais e o tempo decorrido.

### 3. Marés (Hábitos)
Um registo de hábitos construído em torno de uma metáfora marítima. Os hábitos
são acompanhados num calendário mês a mês, com:

- **Tiers de sequência** que crescem com a consistência — de *Onda* até *Oceano*.
- **Respiros** — pausas honestas e sem culpa, que não quebram uma sequência.
- **Recorrência flexível** — hábitos permanentes, hábitos de período fixo ou
  hábitos de um único mês.
- **Mapas de calor e tendências** — uma vista de detalhe por hábito, mais uma
  tendência "onda" de 12 meses.

## Dados, privacidade e cópia de segurança

- **Armazenamento:** tudo persiste no `localStorage` do browser, sob a chave
  `pauta.v4`. Nada sai do seu dispositivo.
- **Sem rastreio:** não existe analítica, telemetria nem pedidos a terceiros.
- **Cópia de segurança:** *Definições → Backup → Exportar dados* transfere um
  ficheiro `.json` com todos os seus dados. *Importar dados* restaura a partir
  desse ficheiro (substituindo os dados atuais, após confirmação).
- **Repor:** *Recarregar exemplo* volta a preencher com dados de demonstração;
  *Apagar tudo* remove permanentemente tudo.

## Definições e extras

Abra as **Definições** no menu da barra de estado. Incluem:

- **Análise** — *Revisão semanal* (uma análise de 7 dias do foco, hábitos e
  padrões, incluindo a melhor hora e correlações) e um guia sobre como funcionam
  os tiers das Marés.
- **Preferências** — tema (Auto / Claro / Escuro) e vibração (háptico).
- **Lembretes** — ative notificações locais e defina as horas para os lembretes
  de hábitos pendentes e da reflexão noturna.
- **Backup** — exportar / importar JSON.
- **Instalar** — pedido de instalação (Android) ou instruções específicas da
  plataforma (iOS).
- **Aplicação** — recarregar dados de demonstração ou apagar tudo.

Um **painel de Tweaks** integrado expõe a cor de destaque, a visibilidade do
cronómetro e a densidade do esquema para experimentação rápida, e uma camada de
**boas-vindas** única recebe os utilizadores que abrem a app pela primeira vez.

## Arquitetura

A Pauta evita deliberadamente um passo de compilação de JavaScript para o código
da aplicação. O JSX é transpilado **no browser** pelo Babel Standalone, e o React
é carregado a partir de ficheiros incluídos localmente. Isto mantém o projeto leve
em dependências e trivialmente portável — os mesmos ficheiros correm como um site
simples, como uma PWA e dentro do WebView do Android.

- **Interface:** React (componentes de função + hooks), com estilos inline e
  propriedades CSS personalizadas (os tokens de design definidos em `index.html`).
- **Estado:** um store feito à mão (`src/store.jsx`, esquema `pauta.v4`) suportado
  pelo `localStorage`.
- **Offline:** o `service-worker.js` guarda em cache a estrutura da app
  (`CACHE_VERSION` é incrementado sempre que os recursos em cache mudam).
- **Empacotamento:** o `scripts/build-web.mjs` copia `index.html`,
  `manifest.json`, `icons/`, `src/` e `vendor/` para `www/`, que o Capacitor
  empacota na app nativa (`webDir: "www"`, `appId: "com.pauta.app"`).

## Estrutura do projeto

```
.
├── index.html              Estrutura da app, tokens de design, carregamento de scripts, arranque PWA + SW
├── manifest.json           Manifesto da PWA
├── service-worker.js       Cache da estrutura offline da app
├── capacitor.config.json   Configuração do Capacitor (appId, appName, webDir)
├── package.json            Scripts e dependências do Capacitor
├── debug.keystore          Chave de assinatura de depuração estável (para que as atualizações mantenham os dados)
├── icons/                  Ícones da app / PWA
├── vendor/                 React, ReactDOM e Babel locais (sem CDN)
├── scripts/
│   └── build-web.mjs       Monta o pacote web em ./www
├── tools/
│   └── gen-icons.mjs       Auxiliar de geração de ícones
├── src/
│   ├── app.jsx             Raiz da app: separadores, painel de definições, atalhos, navegação por deslize
│   ├── store.jsx           Store de estado suportado por localStorage (v4)
│   ├── ui-primitives.jsx   Primitivas partilhadas (Sheet, TabBar, ícones, inputs…)
│   ├── sub-components.jsx   Cartões de bloco, linha temporal, chips de filtro, sheets
│   ├── sheets.jsx          Modais inferiores (iniciar / pausar / concluir…)
│   ├── tab-hoje.jsx        Separador "Hoje" — intenções + reflexão
│   ├── tab-pauta.jsx       Separador "Pauta" — bloco ativo + linha temporal
│   ├── tab-mares.jsx       Separador "Marés" — registo de hábitos
│   ├── mares-phrases.jsx   Biblioteca de frases da metáfora marítima
│   ├── mares-sheets.jsx    Sheets de tendência e de detalhe de hábito das Marés
│   ├── extras.jsx          Boas-vindas, insights, guia de tiers, lembretes, háptico
│   └── tweaks-panel.jsx    Estrutura de tweaks reutilizável + controlos de formulário
└── .github/workflows/
    └── android.yml         CI: compila o APK e publica uma release "latest" contínua
```

## Como começar

**Pré-requisitos:** [Node.js](https://nodejs.org/) 20+. Compilar a app Android
requer adicionalmente um JDK 17 e o Android SDK (tratados automaticamente na CI).

```bash
npm install
```

### Executar a app web localmente

Como tudo é estático e autónomo, qualquer servidor de ficheiros estáticos serve.
Por exemplo:

```bash
npx serve .
# ou
python3 -m http.server 8000
```

Depois abra o URL servido (por exemplo, `http://localhost:8000`). A app transpila
o seu JSX no browser, por isso não é necessário qualquer passo de compilação para
desenvolvimento.

### Compilar o pacote web

Monte o pacote a publicar em `./www`:

```bash
npm run build:web
```

É também isto que se publica em qualquer alojamento estático (GitHub Pages,
Netlify, etc.).

### Compilar a app Android

Monte o pacote web e sincronize-o com o projeto Android:

```bash
npm run sync          # corre build:web e depois `npx cap sync android`
npx cap add android   # só na primeira vez, para criar o projeto android/
```

A partir daí, abra `android/` no Android Studio ou compile pela linha de comandos
(`cd android && ./gradlew assembleDebug`). Os artefactos `android/`, `www/` e
`*.apk` estão excluídos do git.

## Integração contínua

O `.github/workflows/android.yml` compila um `.apk` instalável a cada push (e por
acionamento manual) e publica-o numa release contínua do GitHub chamada
**`latest`**, para que nunca precise de uma cadeia de ferramentas Android local. O
`debug.keystore` versionado mantém a chave de assinatura estável entre
compilações, por isso reinstalar uma atualização preserva os seus dados.

## Atalhos de teclado

Com a app em foco (e sem estar a escrever num campo):

| Tecla | Ação              |
|-------|-------------------|
| `1`   | Separador Hoje    |
| `2`   | Separador Pauta   |
| `3`   | Separador Marés   |
| `g`   | Abrir Definições  |
| `i`   | Abrir Revisão semanal (insights) |
| `?`   | Abrir o guia de tiers das Marés |

No telemóvel, deslize para a esquerda/direita para mudar de separador.

## Compatibilidade de browsers e plataformas

Destina-se a browsers modernos e atualizados (Chromium, Firefox, Safari) e ao
WebView do Android. A instalação como PWA está disponível em browsers baseados em
Chromium e através de *Adicionar ao ecrã principal* no Safari do iOS. As
notificações locais e o háptico degradam-se de forma elegante onde não são
suportados.

## Licença

Este projeto está licenciado sob a
[Creative Commons Atribuição-NãoComercial 4.0 Internacional (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/deed.pt).

É livre de usar, partilhar e adaptar o trabalho **para fins não comerciais**, com
atribuição. **O uso comercial não é permitido.**

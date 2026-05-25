<div align="center">
  <img src="icons/icon-192.png" width="96" alt="Pauta icon" />

  # Pauta

  *Intentions, focus blocks and habits — your daily pauta.*

  🌐 **English** · [Português](#pauta--português)

  [![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)
  [![Android APK](https://img.shields.io/badge/Android-APK%20download-3DDC84?logo=android&logoColor=white)](../../releases/latest)
  [![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?logo=pwa&logoColor=white)](../../)
</div>

---

**Pauta** is a free, private daily-planning app that helps you stay focused and build lasting habits. Write down your intentions for the day, use the built-in focus timer, and track your habits — all without an account or an internet connection.

Works on **Android** (install the app), **iPhone/iPad** (add to home screen), and any modern **web browser** on your computer.

---

## Contents

- [Get the app](#get-the-app)
- [What can I do with it?](#what-can-i-do-with-it)
- [Your data & privacy](#your-data--privacy)
- [Settings & features](#settings--features)
- [License](#license)
- [For developers ›](#️-for-developers)

---

## Get the app

| Platform | How to install |
|----------|----------------|
| **Android** | Download the latest `.apk` from the [Releases page](../../releases/latest) and open it to install |
| **iPhone / iPad** | Open the app in Safari → tap the **Share** icon → tap **Add to Home Screen** |
| **Desktop / Browser** | Open the app in Chrome or Edge → look for the **install icon** (⊕) in the address bar |

> No sign-up. No account. No internet required after the first load.

---

## What can I do with it?

Pauta has three sections you can switch between by tapping the tabs or swiping left and right.

### 📋 Today
Start each day by writing down your **intentions** — the things you actually want to get done. Tick them off as you go, and close the day with a short **reflection**. Simple, honest, and yours alone.

### ⏱️ Focus (Pauta)
Need to concentrate? Start a **focus block** — a timed session you can link to one of your intentions or a project. Pause and resume it whenever you like, jot down session notes, and look back at everything you've accomplished on a scrollable timeline.

### 🌊 Tides (Habits)
Build habits that actually stick. Track your habits on a monthly calendar with a maritime theme. The longer your streak, the higher your tier — from *Wave* all the way up to *Ocean*. Miss a day on purpose? Use a **Breath** — an honest, guilt-free skip that keeps your streak alive.

---

## Your data & privacy

- **Everything stays on your device.** There are no accounts, no servers, and no internet required.
- **Zero tracking.** No analytics, no ads, no third-party services of any kind.
- **Back up your data anytime.** Go to *Settings → Backup → Export data* to save a file with everything. Restore it just as easily with *Import data*.
- **Fresh start when you want.** *Reload sample data* fills the app with demo content; *Erase everything* wipes it clean.

---

## Settings & features

Tap the **menu** in the top bar to open Settings. Here's what you'll find:

| Setting | What it does |
|---------|-------------|
| 🌍 **Language** | Switch between English and Portuguese any time |
| 🌗 **Theme** | Auto (follows your device), Light, or Dark |
| 🎨 **Accent colour** | Pick a colour that feels like you |
| 🔔 **Reminders** | Optional on-device nudges for pending habits and your evening reflection |
| 💾 **Backup** | Export or import your data as a file |
| 📲 **Install** | Instructions to add the app to your home screen |
| 📊 **Weekly Review** | A 7-day summary of your focus sessions, habits, and patterns |

---

## License

[Creative Commons Attribution-NonCommercial 4.0 (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/) — free to use and share for non-commercial purposes, with attribution. Commercial use is not permitted.

---

<details>
<summary>🛠️ For developers</summary>

## Architecture

Pauta deliberately avoids a JavaScript build step for application code. JSX is transpiled **in the browser** by Babel Standalone, and React is loaded from vendored files. This keeps the project dependency-light and trivially portable — the same files run as a plain website, a PWA, and inside the Android WebView.

- **UI:** React (function components + hooks), styled with inline styles and CSS custom properties (the design tokens defined in `index.html`).
- **State:** a hand-rolled store (`src/store.jsx`, schema `pauta.v4`) backed by `localStorage`.
- **i18n:** `src/i18n.jsx` exposes `tr()` / `trf()` helpers loaded before every other script. Portuguese is the source language (PT strings double as lookup keys); English is layered on via a dictionary, and missing keys fall back to the Portuguese text unchanged.
- **Offline:** `service-worker.js` precaches the app shell (`CACHE_VERSION` is bumped whenever precached assets change).
- **Packaging:** `scripts/build-web.mjs` copies `index.html`, `manifest.json`, `icons/`, `src/` and `vendor/` into `www/`, which Capacitor bundles into the native app (`webDir: "www"`, `appId: "com.pauta.app"`).

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
│   ├── sub-components.jsx  Block cards, timeline, filter chips, sheets
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

## Getting started

**Prerequisites:** [Node.js](https://nodejs.org/) 20+. Building the Android app additionally requires a JDK 17 and the Android SDK (handled automatically in CI).

```bash
npm install
```

### Run the web app locally

Because everything is static and self-contained, any static file server works:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Open the served URL (e.g. `http://localhost:8000`). The app transpiles its JSX in the browser, so no build step is required for development.

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

From there, open `android/` in Android Studio or build from the command line (`cd android && ./gradlew assembleDebug`). The `android/`, `www/` and `*.apk` artifacts are git-ignored.

## Continuous integration

`.github/workflows/android.yml` builds an installable `.apk` on every push (and on manual dispatch) and publishes it to a rolling **`latest`** GitHub Release, so you never need a local Android toolchain. The committed `debug.keystore` keeps the signing key stable across builds, so reinstalling an update preserves your data.

## Keyboard shortcuts

When the app is focused and you're not typing in a field:

| Key | Action |
|-----|--------|
| `1` | Today tab |
| `2` | Pauta tab |
| `3` | Tides tab |
| `g` | Open Settings |
| `i` | Open Weekly review |
| `?` | Open the Tides tier guide |

On mobile, swipe left/right to switch between tabs.

## Browser & platform support

Targets modern evergreen browsers (Chromium, Firefox, Safari) and Android WebView. PWA install is available on Chromium-based browsers and via *Add to Home Screen* on iOS Safari. Local notifications and haptics degrade gracefully where unsupported.

</details>

---
---

<div align="center">
  <img src="icons/icon-192.png" width="96" alt="Ícone da Pauta" />

  # Pauta — Português

  *Intenções, blocos de foco e hábitos — a sua pauta diária.*

  [English](#pauta) · 🌐 **Português**
</div>

---

A **Pauta** é uma aplicação gratuita e privada de planeamento diário que o ajuda a manter o foco e a criar hábitos consistentes. Defina as suas intenções para o dia, use o cronómetro de foco integrado e acompanhe os seus hábitos — tudo sem conta nem ligação à internet.

Funciona no **Android** (instale a app), no **iPhone/iPad** (adicione ao ecrã principal) e em qualquer **browser** moderno no computador.

---

## Índice

- [Como obter a app](#como-obter-a-app)
- [O que posso fazer?](#o-que-posso-fazer)
- [Os seus dados e privacidade](#os-seus-dados-e-privacidade)
- [Definições e funcionalidades](#definições-e-funcionalidades)
- [Licença](#licença)
- [Para programadores ›](#️-para-programadores)

---

## Como obter a app

| Plataforma | Como instalar |
|------------|---------------|
| **Android** | Transfira o `.apk` mais recente na [página de Releases](../../releases/latest) e abra-o para instalar |
| **iPhone / iPad** | Abra a app no Safari → toque no ícone de **Partilhar** → toque em **Adicionar ao ecrã principal** |
| **Computador / Browser** | Abra a app no Chrome ou Edge → procure o ícone de instalação (⊕) na barra de endereço |

> Sem registo. Sem conta. Sem internet após o primeiro carregamento.

---

## O que posso fazer?

A Pauta tem três secções entre as quais pode navegar tocando nos separadores ou deslizando para a esquerda e direita.

### 📋 Hoje
Comece cada dia a escrever as suas **intenções** — as coisas que realmente quer fazer. Marque-as à medida que avança e termine o dia com uma breve **reflexão**. Simples, honesto e só seu.

### ⏱️ Foco (Pauta)
Precisa de se concentrar? Inicie um **bloco de foco** — uma sessão cronometrada que pode ligar a uma das suas intenções ou a um projeto. Pause e retome quando quiser, adicione notas da sessão e reveja tudo o que realizou numa linha temporal.

### 🌊 Marés (Hábitos)
Crie hábitos que persistem. Acompanhe os seus hábitos num calendário mensal com um tema marítimo. Quanto mais mantiver uma sequência, mais alto sobe o seu nível — de *Onda* até *Oceano*. Faltou um dia de propósito? Use um **Respiro** — uma pausa honesta e sem culpa que mantém a sua sequência viva.

---

## Os seus dados e privacidade

- **Tudo fica no seu dispositivo.** Não existem contas, servidores nem internet necessária.
- **Zero rastreio.** Sem analítica, publicidade nem serviços de terceiros de qualquer tipo.
- **Faça cópias de segurança quando quiser.** Vá a *Definições → Backup → Exportar dados* para guardar um ficheiro com tudo. Restaure-o igualmente com *Importar dados*.
- **Recomeço quando precisar.** *Recarregar exemplo* preenche a app com dados de demonstração; *Apagar tudo* limpa tudo permanentemente.

---

## Definições e funcionalidades

Toque no **menu** da barra superior para abrir as Definições. Encontrará:

| Definição | O que faz |
|-----------|-----------|
| 🌍 **Idioma** | Mude entre português e inglês a qualquer momento |
| 🌗 **Tema** | Automático (segue o dispositivo), Claro ou Escuro |
| 🎨 **Cor de destaque** | Escolha uma cor que se identifique consigo |
| 🔔 **Lembretes** | Notificações locais opcionais para hábitos pendentes e a reflexão noturna |
| 💾 **Backup** | Exporte ou importe os seus dados como ficheiro |
| 📲 **Instalar** | Instruções para adicionar a app ao ecrã principal |
| 📊 **Revisão semanal** | Um resumo de 7 dias das suas sessões de foco, hábitos e padrões |

---

## Licença

[Creative Commons Atribuição-NãoComercial 4.0 Internacional (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/deed.pt) — livre para usar e partilhar para fins não comerciais, com atribuição. O uso comercial não é permitido.

---

<details>
<summary>🛠️ Para programadores</summary>

## Arquitetura

A Pauta evita deliberadamente um passo de compilação de JavaScript para o código da aplicação. O JSX é transpilado **no browser** pelo Babel Standalone, e o React é carregado a partir de ficheiros incluídos localmente. Isto mantém o projeto leve em dependências e trivialmente portável — os mesmos ficheiros correm como um site simples, como uma PWA e dentro do WebView do Android.

- **Interface:** React (componentes de função + hooks), com estilos inline e propriedades CSS personalizadas (os tokens de design definidos em `index.html`).
- **Estado:** um store feito à mão (`src/store.jsx`, esquema `pauta.v4`) suportado pelo `localStorage`.
- **i18n:** `src/i18n.jsx` expõe os auxiliares `tr()` / `trf()` carregados antes de todos os outros scripts. O português é a língua de origem (as strings PT funcionam também como chaves de pesquisa); o inglês é adicionado via dicionário, e as chaves em falta voltam ao texto em português.
- **Offline:** o `service-worker.js` guarda em cache a estrutura da app (`CACHE_VERSION` é incrementado sempre que os recursos em cache mudam).
- **Empacotamento:** o `scripts/build-web.mjs` copia `index.html`, `manifest.json`, `icons/`, `src/` e `vendor/` para `www/`, que o Capacitor empacota na app nativa (`webDir: "www"`, `appId: "com.pauta.app"`).

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
│   ├── i18n.jsx            Auxiliares tr()/trf() + dicionário inglês (fonte PT)
│   ├── ui-primitives.jsx   Primitivas partilhadas (Sheet, TabBar, ícones, inputs…)
│   ├── sub-components.jsx  Cartões de bloco, linha temporal, chips de filtro, sheets
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

**Pré-requisitos:** [Node.js](https://nodejs.org/) 20+. Compilar a app Android requer adicionalmente um JDK 17 e o Android SDK (tratados automaticamente na CI).

```bash
npm install
```

### Executar a app web localmente

Como tudo é estático e autónomo, qualquer servidor de ficheiros estáticos serve:

```bash
npx serve .
# ou
python3 -m http.server 8000
```

Abra o URL servido (por exemplo, `http://localhost:8000`). A app transpila o seu JSX no browser, por isso não é necessário qualquer passo de compilação para desenvolvimento.

### Compilar o pacote web

Monte o pacote a publicar em `./www`:

```bash
npm run build:web
```

É também isto que se publica em qualquer alojamento estático (GitHub Pages, Netlify, etc.).

### Compilar a app Android

Monte o pacote web e sincronize-o com o projeto Android:

```bash
npm run sync          # corre build:web e depois `npx cap sync android`
npx cap add android   # só na primeira vez, para criar o projeto android/
```

A partir daí, abra `android/` no Android Studio ou compile pela linha de comandos (`cd android && ./gradlew assembleDebug`). Os artefactos `android/`, `www/` e `*.apk` estão excluídos do git.

## Integração contínua

O `.github/workflows/android.yml` compila um `.apk` instalável a cada push (e por acionamento manual) e publica-o numa release contínua do GitHub chamada **`latest`**, para que nunca precise de uma cadeia de ferramentas Android local. O `debug.keystore` versionado mantém a chave de assinatura estável entre compilações, por isso reinstalar uma atualização preserva os seus dados.

## Atalhos de teclado

Com a app em foco e sem estar a escrever num campo:

| Tecla | Ação |
|-------|------|
| `1` | Separador Hoje |
| `2` | Separador Pauta |
| `3` | Separador Marés |
| `g` | Abrir Definições |
| `i` | Abrir Revisão semanal |
| `?` | Abrir o guia de tiers das Marés |

No telemóvel, deslize para a esquerda/direita para mudar de separador.

## Compatibilidade de browsers e plataformas

Destina-se a browsers modernos e atualizados (Chromium, Firefox, Safari) e ao WebView do Android. A instalação como PWA está disponível em browsers baseados em Chromium e através de *Adicionar ao ecrã principal* no Safari do iOS. As notificações locais e o háptico degradam-se de forma elegante onde não são suportados.

</details>

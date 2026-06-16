# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O projeto

**13 a 0** — jogo de browser com tema Counter-Strike: sorteie elencos históricos dos Majors,
monte um time dos sonhos e simule um Major inteiro (fase suíça + playoffs). A glória máxima é
vencer um mapa por 13 a 0. Inspirado no 7 a 0 (simulador de Copa).

100% estático: SvelteKit 2 + Svelte 5 (runes) + TypeScript + `adapter-static`. Sem backend e
sem cadastro; estado em `localStorage` (`13a0:campanha`) e simulação determinística por seed
no cliente — a mesma seed reproduz a campanha exata.

## Ambiente (obrigatório)

O Node padrão do shell é **v10** e quebra qualquer comando npm. Antes de tudo:

```bash
export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH
```

## Comandos

```bash
npm run dev            # servidor de desenvolvimento
npm test               # testes do engine (Vitest)
npm run check          # svelte-check (tipos)
npm run build          # build estático em build/
npm run preview        # servir o build localmente
npm run validate-data  # integridade dos JSONs de Majors
```

Antes de declarar qualquer mudança pronta: `npm test && npm run check && npm run build`.

## Regras do jogo (estado atual — fonte da verdade é o engine)

- **Draft livre em 5 picks**: cada pick sorteia um time real de um Major e o usuário escolhe
  **qualquer** jogador — funções repetidas à vontade (até 5 AWPers).
- **Realocação automática** (`assignSlots` em `src/lib/engine/draft.ts`): a cada pick, todas
  as atribuições jogador→função são testadas e vence a mais forte — quem tem melhor rating
  fica na função natural; empates preferem mais naturais e depois a ordem dos picks
  (determinístico).
- **Força e modificadores** (`src/lib/engine/strength.ts`): fora de função −15% no rating;
  sem AWPer de ofício no posto −8%; sem IGL de ofício −10%; cada AWPer de ofício além do
  primeiro −5% (acumulativo); sinergia de colegas de elenco histórico +3%. `teamModifiers()`
  expõe a lista para a UI (`ModifierList.svelte`) — sempre derive a exibição dele para nunca
  divergir do cálculo.
- **Revisão**: troca de funções por **drag and drop** (pointer events, sem dependências) com
  fallback de tocar-em-dois e teclado (Enter/Espaço). A troca manual não é sobrescrita pela
  realocação automática.
- **Modos**: *Clássico* (tudo visível, 3 re-sorteios) e *Almanaque* (jogo às cegas: ratings,
  funções dos jogadores, colocações dos times, modificadores e força ocultos; 1 re-sorteio).
  Ocultações condicionadas pelo derived `almanac` em `src/routes/jogo/+page.svelte` e pelas
  props `hideRating`/`hideRoles` do `PlayerCard`.

## Estrutura

- `src/lib/engine/` — lógica pura e **testada** (`*.test.ts` ao lado de cada módulo): `rng`
  (PRNG com seed), `draft` (ofertas, picks, `assignSlots`, `swapSlots`), `strength`,
  `match` (MR12 + séries), `tournament` (suíça + playoffs), `opponents`, `share`.
  Mudança de regra começa por aqui, com teste antes da implementação.
- `src/lib/stores/game.svelte.ts` — orquestração do fluxo (draft → review → tournament →
  result) + persistência. O torneio é recomputado da seed ao retomar um save.
- `src/lib/components/` — `PlayerCard`, `TeamCard`, `TeamChip`, `SwissBoard` (quadro estilo
  Pick'Em), `ModifierList` (penalidades/bônus).
- `src/routes/` — home, `/jogo` (fluxo principal, inclui o drag and drop), `/sobre`.
- `static/data/majors/` — um JSON por Major (`index.json` é o catálogo). Times com 5
  jogadores: `{ nick, role, role2?, rating }`, rating estilo HLTV (~0.80–1.45). Os ratings
  são granulares/variados por jogador-no-major, gerados por um **spread procedural
  determinístico** (`scripts/respread-ratings.ts`, `npm run respread-ratings`) — não são
  dados reais do HLTV (a fonte real exige scraping bloqueado/contra ToS); o script preserva
  o ordenamento e a formatação. É migração de mão única (re-rodar comporia o efeito). Para
  adicionar um Major: criar o JSON, registrar no `index.json`, rodar `npm run validate-data`.

## Design system (CS2/HLTV)

- Tokens em `src/app.css`: paleta grafite-azulada com **laranja TR** (`--accent`) e
  **azul CT** (`--ct`); fontes **Rajdhani** (display/placares) e **Barlow** (corpo), via
  Google Fonts em `src/app.html`.
- Linguagem visual: cantos **chanfrados** (`clip-path` com `--cut`/`--cut-sm`) em botões,
  badges e retratos; painéis de cantos retos com filete superior; títulos uppercase.
  Nada de border-radius grandes nem visual genérico.
- UI inteira em português; sempre respeitar `prefers-reduced-motion` nas animações.

## Verificação visual

Build + screenshot com Chrome headless funciona bem:

```bash
google-chrome --headless --disable-gpu --hide-scrollbars --virtual-time-budget=8000 \
  --window-size=520,1100 --screenshot=/tmp/shot.png "http://localhost:PORTA/jogo?novo=classic"
```

Atenção: o headless impõe viewport mínimo de ~500px (não confiar nele para breakpoints
menores) e o `vite preview` não serve arquivos criados em `build/` após o build — para
injetar um save de teste via página HTML, sirva `build/` com `python3 -m http.server` e
navegue para `/jogo.html`. Remova páginas de teste de `build/` ao terminar.

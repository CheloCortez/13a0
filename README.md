# 13 a 0

Jogo de browser inspirado no [7 a 0](https://7a0.com.br) (simulador de Copa que viralizou em junho/2026), com o tema **Counter-Strike**: sorteie elencos históricos dos Majors, monte um time dos sonhos função por função e simule um Major inteiro. A glória máxima é vencer um mapa por **13 a 0** — o placar perfeito no MR12.

## Como funciona

- **Draft em 5 rodadas** — cada rodada sorteia um time real de um Major (2013 em diante) e você escala um jogador para a função da vez: AWPer, IGL, Entry, Lurker e Suporte. Escalar fora da função natural penaliza o rating em 15%.
- **Dois modos** — *Clássico* (ratings visíveis, 3 re-sorteios) e *Almanaque* (ratings ocultos, 1 re-sorteio).
- **O Major** — formato real: fase suíça de 16 times (decisões em MD3) + playoffs de 8 em MD3, mapas simulados round a round no MR12 com overtime.
- **Compartilhamento** — resultado em grid de emojis estilo Wordle + link com a seed, que reproduz a campanha exata.

100% estático: sem backend, sem cadastro. Estado em `localStorage`, simulação determinística por seed no cliente.

## Desenvolvimento

Requer Node 18+ (na máquina atual: `export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH`).

```bash
npm install
npm run dev            # servidor de desenvolvimento
npm run test           # testes do engine (Vitest)
npm run validate-data  # integridade dos JSONs de Majors
npm run check          # svelte-check (tipos)
npm run build          # build estático em build/
npm run preview        # servir o build localmente
```

## Estrutura

- `src/lib/engine/` — lógica pura e testada: `rng` (PRNG com seed), `draft`, `strength` (força/penalidades/sinergia), `match` (MR12 + séries), `tournament` (suíça + playoffs), `opponents`, `share` (conquistas + texto de compartilhamento).
- `src/lib/stores/game.svelte.ts` — orquestração do fluxo + persistência.
- `src/routes/` — home, `/jogo` (fluxo principal) e `/sobre`.
- `static/data/majors/` — um JSON por Major (`index.json` é o catálogo). Cada Major traz **apenas os 8 times que chegaram aos playoffs** (Champions Stage / stage 3) daquele Major — só elencos memoráveis, sem times de fase de grupos. Times com 5 jogadores: `{ nick, role, role2?, rating }`, rating em escala estilo HLTV (0.85–1.35).

### Adicionando um Major

1. Crie `static/data/majors/<id>.json` com **só os 8 times do playoff** (Campeão, Vice, dois 3º-4º e quatro 5º-8º), seguindo o formato dos existentes.
2. Adicione a entrada em `index.json` (mantenha a ordem cronológica).
3. Rode `npm run validate-data`.

Base atual: **23 Majors** (DreamHack Winter 2013 → StarLadder Budapest 2025), 8 times de playoff cada. Pendente: o Major em andamento (IEM Cologne 2026), a ser adicionado quando seu Champions Stage estiver definido.

## Deploy

O build gera um site estático em `build/` — qualquer CDN gratuita serve:

- **Cloudflare Pages / Netlify / Vercel**: aponte para o repositório com build command `npm run build` e output `build/`.
- Ou suba a pasta `build/` em qualquer hospedagem estática (GitHub Pages inclusive; configure `paths.base` se for servir em subdiretório).

## Créditos

Mecânica inspirada no 7 a 0 (de @chavozik4) e no 82-0 da NBA. Elencos verificados via Liquipedia/Wikipedia; funções e ratings são estimativas baseadas no desempenho da época. Projeto de fã, sem afiliação com a Valve.

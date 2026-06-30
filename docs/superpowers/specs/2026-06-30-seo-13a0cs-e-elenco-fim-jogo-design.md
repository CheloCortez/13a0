# SEO para "13 a 0 cs" + elenco na tela de fim de jogo

Data: 2026-06-30

Duas frentes independentes, mesmo objetivo de fortalecer o produto: (1) deixar a home
tecnicamente impecável para a busca do Google **"13 a 0 cs"**; (2) mostrar o elenco montado
pelo usuário — com foto e time original de cada jogador — na tela de fim de jogo.

## Contexto

- Home (`src/routes/+page.svelte`): `<h1>` é puramente visual (placar "13:0", `aria-label="13 a 0"`),
  sem texto indexável com a palavra-chave. `<title>` atual: "13 a 0 — monte o time dos sonhos do
  Counter-Strike". JSON-LD já tem um nó `VideoGame`.
- Componente `Seo.svelte` injeta title/description/canonical/OG/Twitter a partir de props.
- A infraestrutura de imagens **já existe**: `PlayerCard.svelte` mostra a foto da época do jogador
  (lógica `byMajor` com fallback `byNick`, via `src/lib/data/playerImages.ts`); `static/teamlogos/`
  + `src/lib/data/teamLogos.ts` mapeiam a chave `` `${majorId}/${teamId}` `` → arquivo do logo.
- `DraftedPlayer` (`src/lib/data/types.ts`) já guarda `teamName`, `majorId`, `majorName` — mas **não**
  `teamId`. É montado em `pick()` (`src/lib/engine/draft.ts`), onde `state.offer.team.id` está disponível.
- A tela de resultado (`src/routes/jogo/+page.svelte`, bloco `phase === 'result'`) hoje mostra só o
  finish (🏆/vice/…), a faixa 🟩🟥, botão de copiar e bloco de apoio — **não exibe o elenco**.
- `SavedGame` persiste o `DraftState` inteiro (incluindo `picks`) em `localStorage` (`13a0:campanha`).

## Decisões tomadas

- **Layout do elenco no fim de jogo:** cards em destaque (não lista compacta nem pôster).
- **Detalhe dos cards:** foto + função escalada + badge do time original (logo + nome + ano). **Sem
  rating** — visual de pôster, idêntico em todos os modos (inclusive às cegas/difícil).
- **Conteúdo SEO:** seção explicativa + FAQ na home, além de ajustes de title/meta/H1/JSON-LD.

## Parte 1 — Elenco na tela de fim de jogo

### Novo componente `src/lib/components/FinalRoster.svelte`

- Props: `picks: DraftedPlayer[]`, `majors: Major[]` (para o fallback de logo).
- Renderiza os **5 jogadores escalados** num grid responsivo (5 colunas no desktop, quebra no mobile),
  em **todos os finais** (campeão → eliminado na suíça).
- Cada card **reutiliza `PlayerCard`** para a foto da época (não duplicar a lógica `byMajor`/fallback/erro),
  passando `hideRating` para nunca mostrar número, e abaixo dele um **badge de time original**:
  logo (`<img>` de `static/teamlogos/…`) + nome do time + ano do Major. A função escalada (`slot`)
  aparece no card.
  - Se `PlayerCard` não comportar bem o "modo resumo", criar uma variação enxuta interna ao
    `FinalRoster` que ainda assim deriva a foto da mesma fonte (`playerImages`) — evitar lógica de foto
    duplicada/divergente.
- Estilo no design system: cantos chanfrados, uppercase nos rótulos, sem border-radius grande;
  respeitar `prefers-reduced-motion`.

### Resolução do logo do time

- **Adicionar `teamId: string` ao `DraftedPlayer`** (`src/lib/data/types.ts`), preenchido em `pick()`
  a partir de `state.offer.team.id`.
- Chave do logo: `` teamLogos[`${majorId}/${teamId}`] ``.
- **Fallback para saves antigos** (sem `teamId`): em tempo de render, resolver `teamId` cruzando
  `majorId` + `teamName` contra `majors` (já carregado na página). Helper puro e testável, ex.
  `resolveTeamId(majors, majorId, teamName): string | undefined`. Sem migração forçada do `localStorage`;
  se nem assim houver logo, o badge degrada para só nome + ano (sem imagem quebrada).

### Integração

- Em `src/routes/jogo/+page.svelte`, dentro de `<div class="panel result">`, inserir
  `<FinalRoster picks={game.draft.picks} majors={game.majors} />` entre a faixa 🟩🟥 e o botão "Copiar".

## Parte 2 — SEO para "13 a 0 cs"

### A. Conteúdo na home (`src/routes/+page.svelte`)

- Nova seção textual **abaixo do hero** (fora do `.hero`), no design system:
  - Bloco **"O que é o 13 a 0?"**: 1–2 parágrafos usando naturalmente "13 a 0", "CS", "Counter-Strike",
    "Major", "draft".
  - **FAQ** com 3–4 itens em `<details>`/`<summary>` nativos, ex.: "O que significa 13 a 0 no CS?",
    "Como funciona o jogo?", "Preciso instalar algo?", "É de graça?". Respostas reforçam a palavra-chave.

### B. Meta / title / H1

- `<title>` liderando com a palavra-chave, ex.: **"13 a 0 — jogo de CS: monte o time dos sonhos e
  dispute o Major"**.
- `meta description` reescrita incluindo "CS"/"Counter-Strike" + CTA.
- Manter o placar visual "13:0" como H1, mas garantir **texto real indexável** com a palavra-chave
  próximo ao topo (subtítulo/tagline textual "13 a 0 — o jogo de Counter-Strike"). Não remover o placar.

### C. Dados estruturados (JSON-LD)

- Enriquecer o nó `VideoGame`: `alternateName` ("13 a 0 CS"), `keywords`, `description` com a palavra-chave.
- Adicionar nó **`FAQPage`** ao `@graph`, espelhando exatamente o FAQ visível (elegível a rich result).

### Fora de escopo

- Backlinks, envio/ajuste no Search Console, troca do `og.png`. (A posição #1 também depende de fatores
  fora do código — o objetivo aqui é deixar o on-page impecável, não prometer ranking.)

## Verificação

- `npm test && npm run check && npm run build` (regra do projeto antes de declarar pronto).
- Teste unitário para `resolveTeamId` (fallback de logo) e, se houver lógica pura nova, testá-la ao lado.
- Verificação visual da tela de fim de jogo (Chrome headless, conforme CLAUDE.md) — incluindo um save
  de campeão e um de eliminado.
- Validar o JSON-LD (incl. `FAQPage`) no Rich Results Test do Google após o deploy.
- **Não dar `git push`** sem confirmação (aciona deploy no Vercel).

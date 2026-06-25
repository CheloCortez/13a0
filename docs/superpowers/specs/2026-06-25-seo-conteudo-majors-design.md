# SEO por conteúdo + ajustes técnicos — Design

**Data:** 2026-06-25
**Projeto:** 13a0 (jogar13a0.com.br)

## Objetivo

Aumentar o tráfego orgânico do site criando **páginas indexáveis a partir dos
dados reais dos 24 Majors** (campeões, cidades, anos, elencos) e aplicando
ajustes técnicos de SEO. O encanamento básico (canonical, Open Graph, Twitter
Card, robots, favicon, prerender) já existe da rodada de 2026-06-17 e **não será
refeito**.

## Contexto atual (auditoria)

- Já existe: `src/lib/seo.ts`, `src/lib/components/Seo.svelte` (canonical, OG,
  Twitter), `static/robots.txt`, `static/sitemap.xml`, favicons, OG card.
  `prerender = true` global em `src/routes/+layout.ts`.
- Problema central: site é quase só a tela do jogo — **pouco conteúdo textual
  para ranquear**. Ativo subutilizado: 24 JSONs de Majors com dados ricos em
  `static/data/majors/` (carregados por `src/lib/data/loader.ts`).
- Lacunas técnicas menores: sem JSON-LD/structured data; `/contato` fora do
  `sitemap.xml`.

## Escopo aprovado

### Páginas de conteúdo (prerenderizadas → HTML estático)

**1. Hub de Majors — `/majors`**
- `H1`: "Todos os Majors de Counter-Strike" + parágrafo introdutório com keywords.
- Lista cronológica dos 24 Majors a partir de `index.json`: nome, ano, cidade,
  campeão; cada item linka para a página do Major.
- CTA para `/jogo`.
- `load` (em `+page.ts`) usa `loadMajorsIndex()`; herda `prerender = true`.

**2. Página por Major — `/majors/[id]`** (24 URLs)
- Rota dinâmica com `entries()` exportada no `+page.ts` para prerender estático
  de todas as URLs a partir de `loadMajorsIndex()`.
- `H1`: nome do Major + ano. Subdados reais: campeão, cidade, ano.
- Times listados com **colocação (`placement`)** e elenco completo:
  **nick + função**. **SEM rating.**
- Nota discreta na página: as funções (AWP/IGL/entry/lurker/suporte) são uma
  **simplificação didática**, não classificação oficial.
- Navegação: ← volta para `/majors`; CTA "jogar com elencos como esses →" para
  `/jogo`.
- Markup leve próprio (NÃO reutilizar `PlayerCard`/`TeamCard`, que carregam
  lógica de draft/runes) — HTML semântico e limpo para indexação.

**3. Lista de campeões — `/campeoes`**
- `H1`: "Campeões de todos os Majors de CS (2013–2026)".
- Tabela cronológica: ano · Major · campeão · cidade; cada linha linka ao Major.

### Integridade de dados (regra firme)

Nas páginas públicas só aparecem **dados reais**: nome do Major, ano, cidade,
campeão, colocação dos times e composição dos elencos (quais 5 jogadores).
**Ratings nunca aparecem** (são procedurais/inventados — evitar desinformação).
Funções aparecem **com aviso** de simplificação didática.

### Ajustes técnicos

- **Sitemap dinâmico**: substituir `static/sitemap.xml` por endpoint
  prerenderizado `src/routes/sitemap.xml/+server.ts` que gera **todas** as URLs
  (estáticas conhecidas + `/contato` + `/majors` + `/campeoes` + as 24
  `/majors/[id]`) a partir de `loadMajorsIndex()`. Remover o arquivo estático.
- **JSON-LD (structured data)**: `WebSite` + `VideoGame` na home;
  `BreadcrumbList` nas páginas de Major. Injetado via `<svelte:head>`
  (componente próprio ou extensão do `Seo.svelte`).
- **Linking interno**: adicionar "Majors" no header (`+layout.svelte` nav) e no
  footer — caminho de crawl e de usuário para as páginas novas.
- **Meta por página**: `title`/`description` otimizados com keywords reais via o
  componente `Seo` existente.

## Fora do escopo (YAGNI)

- Página por time (dados são por Major, não consolidados por organização).
- PWA/manifest (já decidido em rodadas anteriores).
- Refazer o SEO técnico básico existente.

## Verificação

- `npm test && npm run check && npm run build` (lembrar do PATH do Node v22 via
  nvm — ver CLAUDE.md).
- Screenshot headless das páginas novas (`/majors`, `/majors/[id]`, `/campeoes`).
- Conferir que o `build/` contém os HTMLs prerenderizados das 24 páginas de Major
  e que o `sitemap.xml` gerado lista todas as URLs.
- **Sem `git push`** — deploy automático na Vercel exige confirmação do usuário.

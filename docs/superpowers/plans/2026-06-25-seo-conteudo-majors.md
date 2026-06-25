# SEO por conteúdo (páginas de Majors) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar páginas indexáveis a partir dos dados reais dos 24 Majors (hub, página por Major, lista de campeões) + structured data e sitemap dinâmico, para aumentar o tráfego orgânico de jogar13a0.com.br.

**Architecture:** Páginas SvelteKit prerenderizadas (o `prerender = true` global em `src/routes/+layout.ts` já cascateia para as novas rotas). Os dados vêm de **imports diretos de JSON / `import.meta.glob`** em tempo de build (sem usar o `loader.ts` http do jogo, evitando problemas de origem de `fetch` no prerender). O sitemap é gerado por um **script de prebuild** a partir do `index.json`. JSON-LD é injetado via um componente `JsonLd.svelte`.

**Tech Stack:** SvelteKit 2 + Svelte 5 (runes) + TypeScript, `adapter-static`, Vitest, Node v22 (via nvm).

## Global Constraints

- **Ambiente:** antes de qualquer comando npm/node, rodar `export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH` (Node padrão do shell é v10 e quebra).
- **Integridade de dados (regra firme):** nas páginas públicas só aparecem dados reais — nome do Major, ano, cidade, campeão, colocação (`placement`) dos times e composição dos elencos (nick dos 5 jogadores). **Ratings NUNCA aparecem.** Funções (AWP/IGL/entry/lurker/suporte) aparecem **com uma nota discreta** de que são simplificação didática, não classificação oficial.
- **Sem `git push`:** push na `main` aciona deploy automático na Vercel; só com confirmação explícita do usuário.
- **Tokens de design (`src/app.css`):** `--accent` (#f6a821 laranja TR), `--accent-bright`, `--ct` (#6cb2f0 azul CT), `--panel`/`--panel-2`/`--panel-3`, `--border`/`--border-strong`, `--text`, `--muted`, `--cut`/`--cut-sm` (chanfros via clip-path). Fontes: `--font-display` (Rajdhani) para títulos/uppercase, corpo Barlow. UI inteira em português; respeitar `prefers-reduced-motion`.
- **Componente SEO existente:** `src/lib/components/Seo.svelte` recebe `{ title, description, path }` e cuida de `<title>`, description, canonical, Open Graph e Twitter. Toda página nova usa-o.
- **Tipos (`src/lib/data/types.ts`):** `MajorIndexEntry { id, name, year, city, champion }`; `Major { id, name, year, city, teams: Team[] }`; `Team { id, name, placement, players: Player[] }`; `Player { nick, role, role2?, rating }`; `ROLES`, `ROLE_LABELS: Record<Role, string>`.

---

### Task 1: Helper de ordenação cronológica dos Majors

**Files:**
- Create: `src/lib/data/content.ts`
- Test: `src/lib/data/content.test.ts`

**Interfaces:**
- Consumes: `MajorIndexEntry` de `./types`.
- Produces: `sortMajorsByYear(index: MajorIndexEntry[], dir?: 'asc' | 'desc'): MajorIndexEntry[]` — ordena por ano, estável (preserva ordem original em empates de ano), sem mutar a entrada.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/data/content.test.ts
import { describe, it, expect } from 'vitest';
import { sortMajorsByYear } from './content';
import type { MajorIndexEntry } from './types';

const sample: MajorIndexEntry[] = [
	{ id: 'a', name: 'A', year: 2014, city: 'X', champion: 'T1' },
	{ id: 'b', name: 'B', year: 2013, city: 'Y', champion: 'T2' },
	{ id: 'c', name: 'C', year: 2014, city: 'Z', champion: 'T3' }
];

describe('sortMajorsByYear', () => {
	it('ordena ascendente por ano, preservando ordem original em empates', () => {
		expect(sortMajorsByYear(sample, 'asc').map((m) => m.id)).toEqual(['b', 'a', 'c']);
	});

	it('ordena descendente por ano, mantendo ordem original dentro do mesmo ano', () => {
		expect(sortMajorsByYear(sample, 'desc').map((m) => m.id)).toEqual(['a', 'c', 'b']);
	});

	it('não muta o array original', () => {
		const copy = [...sample];
		sortMajorsByYear(sample, 'desc');
		expect(sample).toEqual(copy);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH && npx vitest run src/lib/data/content.test.ts`
Expected: FAIL — `Cannot find module './content'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/data/content.ts
import type { MajorIndexEntry } from './types';

/** Ordena os Majors por ano (estável em empates), sem mutar a entrada. */
export function sortMajorsByYear(
	index: MajorIndexEntry[],
	dir: 'asc' | 'desc' = 'asc'
): MajorIndexEntry[] {
	return index
		.map((m, i) => ({ m, i }))
		.sort((x, y) =>
			dir === 'asc' ? x.m.year - y.m.year || x.i - y.i : y.m.year - x.m.year || x.i - y.i
		)
		.map((w) => w.m);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH && npx vitest run src/lib/data/content.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/content.ts src/lib/data/content.test.ts
git commit -m "feat: helper de ordenação cronológica de Majors para páginas de conteúdo"
```

---

### Task 2: Builder de sitemap XML

**Files:**
- Modify: `src/lib/seo.ts`
- Test: `src/lib/seo.test.ts` (criar)

**Interfaces:**
- Consumes: `SITE_URL` de `./seo` (já existe: `'https://jogar13a0.com.br'`).
- Produces: `buildSitemapXml(paths: string[]): string` — recebe caminhos começando com `/`, devolve XML de sitemap completo; a home (`'/'`) vira `SITE_URL` sem barra dupla (consistente com o canonical do `Seo.svelte`).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/seo.test.ts
import { describe, it, expect } from 'vitest';
import { buildSitemapXml } from './seo';

describe('buildSitemapXml', () => {
	it('começa com o cabeçalho XML e o urlset', () => {
		const xml = buildSitemapXml(['/']);
		expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
		expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
	});

	it('trata a home sem barra dupla e monta urls absolutas', () => {
		const xml = buildSitemapXml(['/', '/majors', '/majors/katowice-2015']);
		expect(xml).toContain('<loc>https://jogar13a0.com.br</loc>');
		expect(xml).toContain('<loc>https://jogar13a0.com.br/majors</loc>');
		expect(xml).toContain('<loc>https://jogar13a0.com.br/majors/katowice-2015</loc>');
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH && npx vitest run src/lib/seo.test.ts`
Expected: FAIL — `buildSitemapXml is not a function` / import inexistente.

- [ ] **Step 3: Write minimal implementation**

Acrescentar ao final de `src/lib/seo.ts` (manter as consts já existentes):

```ts
/** Monta o XML de sitemap a partir de caminhos absolutos no site (ex.: "/", "/majors"). */
export function buildSitemapXml(paths: string[]): string {
	const urls = paths
		.map((p) => `\t<url>\n\t\t<loc>${SITE_URL}${p === '/' ? '' : p}</loc>\n\t</url>`)
		.join('\n');
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH && npx vitest run src/lib/seo.test.ts`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/seo.ts src/lib/seo.test.ts
git commit -m "feat: builder de sitemap XML a partir de caminhos do site"
```

---

### Task 3: Script de geração de sitemap + prebuild

**Files:**
- Create: `scripts/gen-sitemap.ts`
- Modify: `package.json` (adicionar scripts `gen-sitemap` e `prebuild`)
- Modify: `static/sitemap.xml` (passa a ser saída gerada — regenerada pelo script)

**Interfaces:**
- Consumes: `buildSitemapXml` de `../src/lib/seo.ts`; `static/data/majors/index.json`.
- Produces: arquivo `static/sitemap.xml` com todas as URLs (estáticas conhecidas + `/contato` + `/majors` + `/campeoes` + uma por Major).

- [ ] **Step 1: Criar o script**

```ts
// scripts/gen-sitemap.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildSitemapXml } from '../src/lib/seo.ts';

const indexPath = fileURLToPath(new URL('../static/data/majors/index.json', import.meta.url));
const index = JSON.parse(readFileSync(indexPath, 'utf-8')) as { id: string }[];

const staticPaths = ['/', '/jogo', '/sobre', '/contato', '/privacidade', '/majors', '/campeoes'];
const majorPaths = index.map((m) => `/majors/${m.id}`);

const xml = buildSitemapXml([...staticPaths, ...majorPaths]);
const out = fileURLToPath(new URL('../static/sitemap.xml', import.meta.url));
writeFileSync(out, xml);

console.log(`sitemap.xml gerado com ${staticPaths.length + majorPaths.length} URLs`);
```

- [ ] **Step 2: Adicionar scripts ao `package.json`**

No bloco `"scripts"`, ao lado de `"validate-data"`, acrescentar:

```json
"gen-sitemap": "node --experimental-strip-types scripts/gen-sitemap.ts",
"prebuild": "npm run gen-sitemap",
```

(`prebuild` roda automaticamente antes de `npm run build`, inclusive no deploy da Vercel.)

- [ ] **Step 3: Rodar o gerador e conferir a saída**

Run: `export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH && npm run gen-sitemap`
Expected: imprime `sitemap.xml gerado com 31 URLs` (7 estáticas + 24 Majors).

Conferir que `static/sitemap.xml` agora contém `<loc>https://jogar13a0.com.br/contato</loc>`, `<loc>https://jogar13a0.com.br/majors</loc>` e `<loc>https://jogar13a0.com.br/majors/katowice-2015</loc>`.

- [ ] **Step 4: Commit**

```bash
git add scripts/gen-sitemap.ts package.json static/sitemap.xml
git commit -m "feat: gerar sitemap.xml no prebuild com todas as rotas e Majors"
```

---

### Task 4: Componente JsonLd + structured data na home

**Files:**
- Create: `src/lib/components/JsonLd.svelte`
- Modify: `src/routes/+page.svelte`

**Interfaces:**
- Produces: `JsonLd.svelte` com prop `data: Record<string, unknown>` que injeta `<script type="application/ld+json">` em `<svelte:head>`.
- Consumes: `SITE_URL`, `SITE_NAME`, `OG_IMAGE` de `$lib/seo`.

- [ ] **Step 1: Criar o componente JsonLd**

```svelte
<!-- src/lib/components/JsonLd.svelte -->
<script lang="ts">
	let { data }: { data: Record<string, unknown> } = $props();
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<script type="application/ld+json">${JSON.stringify(data)}</` + `script>`}
</svelte:head>
```

(O `</` + `script>` evita que o parser corte o bloco; o conteúdo é gerado por nós, sem entrada do usuário — seguro para `@html`.)

- [ ] **Step 2: Adicionar structured data à home**

Em `src/routes/+page.svelte`, no `<script>`, adicionar os imports junto aos existentes:

```ts
import JsonLd from '$lib/components/JsonLd.svelte';
import { SITE_URL, SITE_NAME, OG_IMAGE } from '$lib/seo';
```

E o objeto do grafo (após as constantes do componente, antes do markup):

```ts
const jsonLd = {
	'@context': 'https://schema.org',
	'@graph': [
		{ '@type': 'WebSite', name: SITE_NAME, url: SITE_URL, inLanguage: 'pt-BR' },
		{
			'@type': 'VideoGame',
			name: SITE_NAME,
			url: SITE_URL,
			applicationCategory: 'Game',
			operatingSystem: 'Navegador web',
			genre: 'Simulação',
			gamePlatform: 'Web',
			inLanguage: 'pt-BR',
			image: OG_IMAGE,
			description:
				'Sorteie elencos históricos dos Majors de Counter-Strike, monte o time dos sonhos e simule um Major inteiro.',
			offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' }
		}
	]
};
```

Logo após a tag `<Seo ... />` existente, adicionar:

```svelte
<JsonLd data={jsonLd} />
```

- [ ] **Step 3: Verificar tipos e build da home**

Run: `export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH && npm run check`
Expected: 0 erros.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/JsonLd.svelte src/routes/+page.svelte
git commit -m "feat: structured data (WebSite + VideoGame) na home via JsonLd"
```

---

### Task 5: Página hub `/majors`

**Files:**
- Create: `src/routes/majors/+page.ts`
- Create: `src/routes/majors/+page.svelte`

**Interfaces:**
- Consumes: `index.json` (import direto); `sortMajorsByYear` de `$lib/data/content`; `MajorIndexEntry`.
- Produces: rota `/majors` prerenderizada; `data.majors: MajorIndexEntry[]` (mais recentes primeiro) para a página.

- [ ] **Step 1: Criar o load**

```ts
// src/routes/majors/+page.ts
import majorsIndex from '../../../static/data/majors/index.json';
import { sortMajorsByYear } from '$lib/data/content';
import type { MajorIndexEntry } from '$lib/data/types';
import type { PageLoad } from './$types';

export const load: PageLoad = () => ({
	majors: sortMajorsByYear(majorsIndex as MajorIndexEntry[], 'desc')
});
```

- [ ] **Step 2: Criar a página**

```svelte
<!-- src/routes/majors/+page.svelte -->
<script lang="ts">
	import { base } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Seo
	title="Todos os Majors de Counter-Strike — campeões, elencos e sedes | 13 a 0"
	description="A lista completa dos Majors de CS (CS:GO e CS2), de DreamHack Winter 2013 a hoje: campeão, cidade-sede, ano e os times de cada edição."
	path="/majors"
/>

<section>
	<p class="tag">Almanaque</p>
	<h2>Todos os Majors de Counter-Strike</h2>

	<p class="intro">
		Os Majors são os campeonatos mais importantes do Counter-Strike. Aqui estão todas as edições
		— de <strong>DreamHack Winter 2013</strong> em diante — com o campeão, a cidade-sede e os
		elencos que disputaram cada uma. Toque em um Major para ver os times.
	</p>

	<ul class="major-list">
		{#each data.majors as m (m.id)}
			<li>
				<a class="major-row" href="{base}/majors/{m.id}">
					<span class="year">{m.year}</span>
					<span class="body">
						<strong class="name">{m.name}</strong>
						<span class="meta">{m.city} · Campeão: {m.champion}</span>
					</span>
					<span class="arrow" aria-hidden="true">→</span>
				</a>
			</li>
		{/each}
	</ul>

	<p class="cta-line">
		<a class="btn" href="{base}/jogo?novo=classic">Montar meu time dos sonhos →</a>
	</p>
</section>

<style>
	.intro {
		color: var(--muted);
		max-width: 42rem;
		margin: 0.6rem 0 1.6rem;
		line-height: 1.6;
	}

	.major-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.major-row {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		padding: 0.7rem 0.9rem;
		background: var(--panel-2);
		border: 1px solid var(--border);
		border-left: 3px solid var(--accent);
		color: var(--text);
		text-decoration: none;
		clip-path: polygon(var(--cut-sm) 0, 100% 0, 100% calc(100% - var(--cut-sm)), calc(100% - var(--cut-sm)) 100%, 0 100%, 0 var(--cut-sm));
		transition: border-color 0.15s, background 0.15s;
	}

	.major-row:hover {
		background: var(--panel-3);
		border-left-color: var(--accent-bright);
	}

	.year {
		font-family: var(--font-display);
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--accent-bright);
		min-width: 3.2rem;
	}

	.body {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.name {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 600;
	}

	.meta {
		font-size: 0.82rem;
		color: var(--muted);
	}

	.arrow {
		color: var(--muted);
	}

	.cta-line {
		margin-top: 1.8rem;
	}
</style>
```

- [ ] **Step 3: Verificar tipos**

Run: `export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH && npm run check`
Expected: 0 erros (o `./$types` é gerado pelo svelte-kit sync no check/build).

- [ ] **Step 4: Commit**

```bash
git add src/routes/majors/+page.ts src/routes/majors/+page.svelte
git commit -m "feat: página hub /majors com a lista de todos os Majors"
```

---

### Task 6: Página por Major `/majors/[id]`

**Files:**
- Create: `src/routes/majors/[id]/+page.ts`
- Create: `src/routes/majors/[id]/+page.svelte`

**Interfaces:**
- Consumes: todos os `static/data/majors/*.json` via `import.meta.glob` (eager); `Major`, `ROLE_LABELS`, `Role` de `$lib/data/types`; `SITE_URL` de `$lib/seo`; `JsonLd`.
- Produces: 24 rotas `/majors/[id]` prerenderizadas (`entries()`); `data.major: Major`. **Sem ratings**; funções com nota de simplificação.

- [ ] **Step 1: Criar o load com entries()**

```ts
// src/routes/majors/[id]/+page.ts
import { error } from '@sveltejs/kit';
import type { Major } from '$lib/data/types';
import type { EntryGenerator, PageLoad } from './$types';

const modules = import.meta.glob<Major>('../../../../static/data/majors/*.json', {
	eager: true,
	import: 'default'
});

const byId = new Map<string, Major>();
for (const major of Object.values(modules)) byId.set(major.id, major);

export const entries: EntryGenerator = () => [...byId.keys()].map((id) => ({ id }));

export const load: PageLoad = ({ params }) => {
	const major = byId.get(params.id);
	if (!major) throw error(404, 'Major não encontrado');
	return { major };
};
```

- [ ] **Step 2: Criar a página (sem ratings, com nota nas funções)**

```svelte
<!-- src/routes/majors/[id]/+page.svelte -->
<script lang="ts">
	import { base } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import JsonLd from '$lib/components/JsonLd.svelte';
	import { SITE_URL } from '$lib/seo';
	import { ROLE_LABELS, type Role } from '$lib/data/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const major = $derived(data.major);
	const champion = $derived(major.teams.find((t) => t.placement === 'Campeão')?.name);

	const breadcrumb = $derived({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
			{ '@type': 'ListItem', position: 2, name: 'Majors', item: `${SITE_URL}/majors` },
			{
				'@type': 'ListItem',
				position: 3,
				name: major.name,
				item: `${SITE_URL}/majors/${major.id}`
			}
		]
	});
</script>

<Seo
	title="{major.name} — campeão e elencos | 13 a 0"
	description="{major.name} ({major.year}), em {major.city}{champion ? `: campeão ${champion}` : ''}. Veja a colocação e os elencos completos dos times que disputaram este Major de Counter-Strike."
	path="/majors/{major.id}"
/>
<JsonLd data={breadcrumb} />

<section>
	<p class="crumbs">
		<a href="{base}/majors">← Todos os Majors</a>
	</p>

	<p class="tag">Major · {major.year}</p>
	<h2>{major.name}</h2>

	<dl class="facts">
		<div><dt>Sede</dt><dd>{major.city}</dd></div>
		<div><dt>Ano</dt><dd>{major.year}</dd></div>
		{#if champion}<div><dt>Campeão</dt><dd>{champion}</dd></div>{/if}
	</dl>

	<div class="teams">
		{#each major.teams as team (team.id)}
			<article class="team">
				<header class="team-head">
					<strong class="team-name">{team.name}</strong>
					<span class="placement">{team.placement}</span>
				</header>
				<ul class="roster">
					{#each team.players as p (p.nick)}
						<li>
							<span class="nick">{p.nick}</span>
							<span class="role">{ROLE_LABELS[p.role as Role]}</span>
						</li>
					{/each}
				</ul>
			</article>
		{/each}
	</div>

	<p class="note">
		As funções indicadas (AWPer, IGL, entry, lurker, suporte) são uma simplificação didática
		para fins do jogo, não uma classificação oficial.
	</p>

	<p class="cta-line">
		<a class="btn" href="{base}/jogo?novo=classic">Jogar com elencos como esses →</a>
	</p>
</section>

<style>
	.crumbs {
		margin: 0 0 0.4rem;
	}

	.crumbs a {
		font-family: var(--font-display);
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--muted);
		text-decoration: none;
	}

	.crumbs a:hover {
		color: var(--accent-bright);
	}

	.facts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.6rem;
		margin: 0.6rem 0 1.6rem;
		padding: 0.8rem 1rem;
		background: var(--panel-2);
		border: 1px solid var(--border);
		border-top: 2px solid var(--accent);
	}

	.facts div {
		display: flex;
		flex-direction: column;
	}

	.facts dt {
		font-family: var(--font-display);
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--muted);
	}

	.facts dd {
		margin: 0.1rem 0 0;
		font-weight: 600;
		color: var(--text);
	}

	.teams {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
		gap: 0.7rem;
	}

	.team {
		background: var(--panel-2);
		border: 1px solid var(--border);
		border-left: 3px solid var(--border-strong);
		padding: 0.7rem 0.85rem;
		clip-path: polygon(var(--cut-sm) 0, 100% 0, 100% calc(100% - var(--cut-sm)), calc(100% - var(--cut-sm)) 100%, 0 100%, 0 var(--cut-sm));
	}

	.team-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		padding-bottom: 0.4rem;
		border-bottom: 1px solid var(--border);
	}

	.team-name {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 700;
	}

	.placement {
		font-family: var(--font-display);
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--accent-bright);
	}

	.roster {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.roster li {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		font-size: 0.9rem;
	}

	.nick {
		font-weight: 600;
		color: var(--text);
	}

	.role {
		font-size: 0.78rem;
		color: var(--muted);
	}

	.note {
		margin-top: 1.4rem;
		font-size: 0.8rem;
		font-style: italic;
		color: var(--muted);
	}

	.cta-line {
		margin-top: 1.4rem;
	}
</style>
```

- [ ] **Step 3: Verificar tipos**

Run: `export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH && npm run check`
Expected: 0 erros.

- [ ] **Step 4: Commit**

```bash
git add src/routes/majors/\[id\]/+page.ts src/routes/majors/\[id\]/+page.svelte
git commit -m "feat: página por Major (/majors/[id]) com elencos reais, sem ratings"
```

---

### Task 7: Página lista de campeões `/campeoes`

**Files:**
- Create: `src/routes/campeoes/+page.ts`
- Create: `src/routes/campeoes/+page.svelte`

**Interfaces:**
- Consumes: `index.json`; `sortMajorsByYear`; `MajorIndexEntry`.
- Produces: rota `/campeoes` prerenderizada; `data.majors: MajorIndexEntry[]` (cronológico ascendente).

- [ ] **Step 1: Criar o load**

```ts
// src/routes/campeoes/+page.ts
import majorsIndex from '../../../static/data/majors/index.json';
import { sortMajorsByYear } from '$lib/data/content';
import type { MajorIndexEntry } from '$lib/data/types';
import type { PageLoad } from './$types';

export const load: PageLoad = () => ({
	majors: sortMajorsByYear(majorsIndex as MajorIndexEntry[], 'asc')
});
```

- [ ] **Step 2: Criar a página**

```svelte
<!-- src/routes/campeoes/+page.svelte -->
<script lang="ts">
	import { base } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Seo
	title="Campeões de todos os Majors de CS (2013–2026) | 13 a 0"
	description="Quem venceu cada Major de Counter-Strike, em ordem cronológica: time campeão, edição, ano e cidade-sede — de DreamHack Winter 2013 aos Majors de CS2."
	path="/campeoes"
/>

<section>
	<p class="tag">Almanaque</p>
	<h2>Campeões de todos os Majors de CS</h2>

	<p class="intro">
		Todos os campeões de Major do Counter-Strike em ordem cronológica, do primeiro
		(DreamHack Winter 2013) até as edições mais recentes de CS2.
	</p>

	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Ano</th>
					<th>Major</th>
					<th>Campeão</th>
					<th>Sede</th>
				</tr>
			</thead>
			<tbody>
				{#each data.majors as m (m.id)}
					<tr>
						<td class="year">{m.year}</td>
						<td><a href="{base}/majors/{m.id}">{m.name}</a></td>
						<td class="champ">{m.champion}</td>
						<td class="city">{m.city}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<style>
	.intro {
		color: var(--muted);
		max-width: 42rem;
		margin: 0.6rem 0 1.4rem;
		line-height: 1.6;
	}

	.table-wrap {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	th {
		font-family: var(--font-display);
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
		text-align: left;
		padding: 0.5rem 0.6rem;
		border-bottom: 2px solid var(--accent);
	}

	td {
		padding: 0.5rem 0.6rem;
		border-bottom: 1px solid var(--border);
	}

	.year {
		font-family: var(--font-display);
		font-weight: 700;
		color: var(--accent-bright);
	}

	td a {
		color: var(--text);
		text-decoration: none;
		border-bottom: 1px solid transparent;
	}

	td a:hover {
		color: var(--accent-bright);
		border-bottom-color: var(--accent);
	}

	.champ {
		font-weight: 600;
	}

	.city {
		color: var(--muted);
	}
</style>
```

- [ ] **Step 3: Verificar tipos**

Run: `export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH && npm run check`
Expected: 0 erros.

- [ ] **Step 4: Commit**

```bash
git add src/routes/campeoes/+page.ts src/routes/campeoes/+page.svelte
git commit -m "feat: página /campeoes com todos os campeões de Major"
```

---

### Task 8: Linking interno (header + footer)

**Files:**
- Modify: `src/routes/+layout.svelte`

**Interfaces:**
- Consumes: nada novo.
- Produces: links para `/majors` e `/campeoes` no header `<nav>` e no `<footer>` (descoberta por crawler e usuários).

- [ ] **Step 1: Adicionar links no header**

Em `src/routes/+layout.svelte`, no `<nav>` do header, adicionar antes do link "Como jogar":

```svelte
		<a class="nav-link" href="{base}/majors">Majors</a>
```

- [ ] **Step 2: Adicionar links no footer**

No `<nav class="foot-nav">`, adicionar antes do link "Como jogar":

```svelte
		<a href="{base}/majors">Majors</a>
		<a href="{base}/campeoes">Campeões</a>
```

- [ ] **Step 3: Verificar tipos**

Run: `export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH && npm run check`
Expected: 0 erros.

- [ ] **Step 4: Commit**

```bash
git add src/routes/+layout.svelte
git commit -m "feat: links de navegação para /majors e /campeoes"
```

---

### Task 9: Verificação final (suíte + build + prerender + screenshots)

**Files:** nenhum (verificação).

- [ ] **Step 1: Suíte completa de qualidade**

Run: `export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH && npm test && npm run check && npm run build`
Expected: testes PASS, check com 0 erros, build conclui (o `prebuild` gera o sitemap antes).

- [ ] **Step 2: Conferir prerender das páginas no build**

Run: `ls build/majors build/campeoes && ls build/majors | head`
Expected: existe `build/campeoes.html` (ou `build/campeoes/index.html`), `build/majors.html` e uma página para cada Major (ex.: `build/majors/katowice-2015.html`). Confirmar 24 páginas de Major.

- [ ] **Step 3: Conferir conteúdo indexável e ausência de ratings**

Run: `grep -l "application/ld+json" build/index.html && grep -c "1.42\|rating" build/majors/katowice-2015.html`
Expected: a home contém o bloco JSON-LD; a página do Major **não** contém ratings (grep de `1.42`/`rating` retorna 0). Confirmar visualmente que há nicks + funções e a nota de simplificação.

- [ ] **Step 4: Conferir o sitemap gerado**

Run: `grep -c "<loc>" build/sitemap.xml`
Expected: 31 `<loc>` (7 estáticas + 24 Majors), incluindo `/contato`, `/majors`, `/campeoes`.

- [ ] **Step 5: Screenshots das páginas novas**

Servir o build e capturar com Chrome headless (ajustar porta):

```bash
export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH
(cd build && python3 -m http.server 8099 >/dev/null 2>&1 &) ; sleep 1
google-chrome --headless --disable-gpu --hide-scrollbars --virtual-time-budget=8000 \
  --window-size=520,1400 --screenshot=/tmp/majors.png "http://localhost:8099/majors.html"
google-chrome --headless --disable-gpu --hide-scrollbars --virtual-time-budget=8000 \
  --window-size=520,1600 --screenshot=/tmp/major.png "http://localhost:8099/majors/katowice-2015.html"
google-chrome --headless --disable-gpu --hide-scrollbars --virtual-time-budget=8000 \
  --window-size=520,1600 --screenshot=/tmp/campeoes.png "http://localhost:8099/campeoes.html"
```

Revisar os 3 screenshots: layout no estilo CS2/HLTV, sem ratings, nota de simplificação presente, links funcionando.

- [ ] **Step 6: Relatar ao usuário**

Resumir o que foi feito, anexar/citar os screenshots e **perguntar antes de qualquer `git push`** (deploy automático na Vercel). Lembrar o usuário de, após o deploy, enviar o sitemap no Google Search Console (`https://jogar13a0.com.br/sitemap.xml`) e pedir indexação das novas URLs.

---

## Self-Review

**Spec coverage:**
- Hub `/majors` → Task 5 ✓
- Página por Major `/majors/[id]` (24 URLs, sem rating, funções com aviso) → Task 6 ✓
- Lista de campeões `/campeoes` → Task 7 ✓
- Sitemap dinâmico incluindo `/contato` + novas páginas → Tasks 2–3 (via prebuild script — desvio documentado do endpoint, por não haver `svelte.config.js`) ✓
- JSON-LD (WebSite + VideoGame na home; BreadcrumbList no Major) → Tasks 4 e 6 ✓
- Linking interno (header + footer) → Task 8 ✓
- Integridade de dados (sem ratings; funções com nota) → Task 6 + verificação na Task 9 Step 3 ✓
- Verificação (test + check + build + screenshots) → Task 9 ✓
- Fora do escopo (página por time, PWA, refazer SEO técnico básico) → não há tarefas, correto ✓

**Placeholder scan:** sem TBD/TODO; todo passo de código tem código completo.

**Type consistency:** `sortMajorsByYear(index, dir)` usado igual nas Tasks 1, 5, 7. `buildSitemapXml(paths)` definido na Task 2 e consumido na Task 3. `JsonLd` prop `data` definido na Task 4 e usado nas Tasks 4 e 6. `Major`/`MajorIndexEntry`/`ROLE_LABELS` conforme `types.ts`.

**Decisões/Desvios do spec:**
- Sitemap por **script de prebuild** em vez de endpoint (`+server.ts`) — mais robusto sem `svelte.config.js`; mesma URL pública `/sitemap.xml` servida de `static/`.
- Dados das páginas via **import direto / `import.meta.glob`** em build, não pelo `loader.ts` http — evita falha de origem de `fetch` no prerender e não toca no fluxo do jogo.

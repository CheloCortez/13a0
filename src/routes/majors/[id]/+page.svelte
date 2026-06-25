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

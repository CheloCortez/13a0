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

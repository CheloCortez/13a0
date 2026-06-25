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
